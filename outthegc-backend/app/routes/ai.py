from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.models import GenerateOptionsRequest, RerunOptionsRequest
from app import storage
from app.services import ai, availability

router = APIRouter(prefix="/trips", tags=["ai"])


def build_plan_response(plan_version) -> Dict[str, Any]:
    """Build plan version response."""
    return {
        "id": plan_version.id,
        "trip_id": plan_version.trip_id,
        "version_num": plan_version.version_num,
        "created_at": plan_version.created_at.isoformat(),
        "options": [
            {
                "id": opt.id,
                "title": opt.title,
                "destination": opt.destination,
                "date_window": opt.date_window,
                "summary": opt.summary,
                "itinerary": opt.itinerary,
                "transport": opt.transport,
                "costs": opt.costs,
                "packing_list": opt.packing_list,
                "rationale": opt.rationale,
                "assumptions": opt.assumptions
            }
            for opt in plan_version.options
        ]
    }


@router.get("/claude-test")
def claude_test() -> Dict[str, Any]:
    """Simple Claude connectivity test."""
    response = ai.call_claude_api(
        "Reply with exactly 10 random french words separated by single spaces. No punctuation.",
        debug=True,
    )
    if not response:
        return {"ok": False, "detail": "Claude unavailable"}
    if response.startswith("ERROR:") or response in {
        "MISSING_CLAUDE_API_KEY",
        "ANTHROPIC_SDK_NOT_INSTALLED",
        "EMPTY_RESPONSE",
        "EMPTY_TEXT",
    }:
        return {"ok": False, "detail": response}
    return {"ok": True, "response": response}


@router.post("/{trip_id}/generate-options")
def generate_options(trip_id: str, req: GenerateOptionsRequest) -> Dict[str, Any]:
    """Generate trip options using AI. Organiser only."""
    try:
        trip = storage.get_trip_or_404(trip_id)
        
        # Enforce organiser-only
        if not storage.is_organiser(req.created_by_member_id, trip_id):
            raise HTTPException(status_code=403, detail="Only organiser can generate options")
        
        # Generate options via AI service
        result = ai.generate_options(trip_id)
        plan_version = result['plan_version']
        warning = result['warning']
        success = result['success']
        
        # Store plan version
        storage.add_plan_version(trip_id, plan_version.options)
        
        # Get latest stored plan (to return version_num, etc)
        latest_plan = storage.get_latest_plan(trip_id)
        
        response = build_plan_response(latest_plan)
        if warning:
            response['warning'] = warning
        response['success'] = success
        
        return response
    except HTTPException:
        raise
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Trip not found")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate options: {str(e)}")


@router.post("/{trip_id}/rerun-options")
def rerun_options(trip_id: str, req: RerunOptionsRequest) -> Dict[str, Any]:
    """Rerun option generation with feedback. Organiser only."""
    try:
        trip = storage.get_trip_or_404(trip_id)
        
        # Enforce organiser-only
        if not storage.is_organiser(req.created_by_member_id, trip_id):
            raise HTTPException(status_code=403, detail="Only organiser can rerun options")
        
        # Pull feedback for trip
        feedback_list = storage.get_feedback_for_trip(trip_id)
        
        # Build feedback summary for context
        feedback_summary = {
            'total_feedback': len(feedback_list),
            'by_option': {}
        }
        for feedback in feedback_list:
            opt_id = feedback.option_id
            if opt_id not in feedback_summary['by_option']:
                feedback_summary['by_option'][opt_id] = {
                    'ratings': [],
                    'disliked_activities': [],
                    'comments': []
                }
            feedback_summary['by_option'][opt_id]['ratings'].append(feedback.rating)
            feedback_summary['by_option'][opt_id]['disliked_activities'].extend(feedback.disliked_activity_ids)
            if feedback.comment:
                feedback_summary['by_option'][opt_id]['comments'].append(feedback.comment)
        
        # Calculate average ratings per option
        for opt_id in feedback_summary['by_option']:
            ratings = feedback_summary['by_option'][opt_id]['ratings']
            feedback_summary['by_option'][opt_id]['average_rating'] = sum(ratings) / len(ratings) if ratings else 0
        
        # TODO: Enhance AI prompt with feedback insights
        # For now, just generate fresh options (can be enhanced to use feedback)
        result = ai.generate_options(trip_id)
        plan_version = result['plan_version']
        warning = result['warning']
        success = result['success']
        
        # Store new plan version
        storage.add_plan_version(trip_id, plan_version.options)
        
        # Get latest stored plan
        latest_plan = storage.get_latest_plan(trip_id)
        
        response = build_plan_response(latest_plan)
        if warning:
            response['warning'] = warning
        response['success'] = success
        response['feedback_considered'] = feedback_summary
        
        return response
    except HTTPException:
        raise
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Trip not found")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to rerun options: {str(e)}")
