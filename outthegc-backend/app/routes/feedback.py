from fastapi import APIRouter, HTTPException
from typing import Dict
from app.models import FeedbackRequest
from app import storage

router = APIRouter(prefix="/trips", tags=["feedback"])


@router.post("/{trip_id}/options/{option_id}/feedback")
def submit_feedback(trip_id: str, option_id: str, req: FeedbackRequest) -> Dict[str, bool]:
    """Submit feedback on a trip option."""
    try:
        # Verify trip exists
        trip = storage.get_trip_or_404(trip_id)
        
        # Verify member belongs to trip
        member = storage.assert_member_in_trip(req.member_id, trip_id)
        
        # Verify option_id exists in latest plan
        latest_plan = storage.get_latest_plan(trip_id)
        if not latest_plan:
            raise HTTPException(status_code=400, detail="No plan exists for this trip")
        
        option_exists = any(opt.id == option_id for opt in latest_plan.options)
        if not option_exists:
            raise HTTPException(status_code=400, detail="Invalid option ID")
        
        # Store feedback (upsert by trip_id, option_id, member_id)
        storage.add_feedback(
            trip_id=trip_id,
            option_id=option_id,
            member_id=req.member_id,
            rating=req.rating,
            disliked_activity_ids=req.disliked_activity_ids,
            comment=req.comment
        )
        
        return {"success": True}
    except HTTPException:
        raise
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Trip or member not found")
        if "not in trip" in msg.lower():
            raise HTTPException(status_code=403, detail="Member not authorized for this trip")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to submit feedback: {str(e)}")
