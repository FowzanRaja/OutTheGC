from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models import (
    CreateTripRequest, JoinTripRequest, UpdateBriefRequest,
    RequiredAttendeesRequest, UpsertMemberInputsRequest
)
from app import storage
from app.services import seed

router = APIRouter(prefix="/trips", tags=["trips"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/")
def create_trip(req: CreateTripRequest) -> Dict[str, str]:
    """Create new trip with organiser member."""
    try:
        trip, organiser = storage.create_trip(
            name=req.name,
            origin=req.origin,
            brief=req.brief,
            organiser_name=req.organiser_name
        )
        
        # Seed destination list with demo options
        trip.destination_seed_list = ["Barcelona", "Lisbon", "Rome", "Paris", "Amsterdam"]
        storage.update_brief(trip.id, trip.brief or "")  # Store updated trip
        
        return {
            "trip_id": trip.id,
            "organiser_member_id": organiser.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create trip: {str(e)}")


@router.post("/{trip_id}/join")
def join_trip(trip_id: str, req: JoinTripRequest) -> Dict[str, str]:
    """Add new member to trip."""
    try:
        storage.get_trip_or_404(trip_id)
        member = storage.join_trip(trip_id, req.name)
        return {"member_id": member.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Trip not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to join trip: {str(e)}")


@router.get("/{trip_id}")
def get_trip(trip_id: str) -> Dict[str, Any]:
    """Get full trip state."""
    try:
        trip = storage.get_trip_or_404(trip_id)
        members = storage.get_trip_members(trip_id)
        
        # Build members list
        members_list = [{"id": m.id, "name": m.name, "role": m.role} for m in members]
        
        # Build constraints completion status
        constraints_completion = []
        for member in members:
            member_constraints = storage.get_constraints(member.id)
            member_availability = storage.get_availability(member.id)
            has_constraints = member_constraints is not None
            has_availability = member_availability is not None and bool(member_availability.available_dates)
            constraints_completion.append({
                "member_id": member.id,
                "name": member.name,
                "has_constraints": has_constraints,
                "has_availability": has_availability
            })
        
        # Build polls summary
        polls_summary = []
        trip_polls = storage.get_all_polls_for_trip(trip_id)
        for poll in trip_polls:
            # Count votes per option
            votes_for_poll = storage.get_poll_votes(poll.id)
            votes_by_option = {}
            for opt in poll.options:
                votes_by_option[opt.id] = sum(1 for v in votes_for_poll if v.option_id == opt.id)
            
            polls_summary.append({
                "poll_id": poll.id,
                "question": poll.question,
                "type": poll.type,
                "is_open": poll.is_open,
                "options": [{"id": opt.id, "label": opt.label} for opt in poll.options],
                "votes_by_option": votes_by_option,
                "total_votes": len(votes_for_poll)
            })
        
        # Build latest plan
        latest_plan = None
        plan_list = storage.get_plans_for_trip(trip_id)
        if plan_list:
            latest = plan_list[-1]
            latest_plan = {
                "id": latest.id,
                "version_num": latest.version_num,
                "created_at": latest.created_at.isoformat(),
                "options": [
                    {
                        "id": opt.id,
                        "title": opt.title,
                        "destination": opt.destination,
                        "date_window": opt.date_window,
                        "summary": opt.summary
                    }
                    for opt in latest.options
                ]
            }
        
        # Build feedback summary
        feedback_list = storage.get_feedback_for_trip(trip_id)
        feedback_summary = {
            "total_count": len(feedback_list),
            "average_rating": sum(f.rating for f in feedback_list) / len(feedback_list) if feedback_list else 0,
            "by_member": len(set(f.member_id for f in feedback_list))
        }
        
        return {
            "trip": {
                "id": trip.id,
                "name": trip.name,
                "organiser_member_id": trip.organiser_member_id,
                "brief": trip.brief,
                "origin": trip.origin,
                "destination_seed_list": trip.destination_seed_list,
                "required_member_ids": trip.required_member_ids,
                "created_at": trip.created_at.isoformat()
            },
            "members": members_list,
            "constraints_completion": constraints_completion,
            "polls": polls_summary,
            "latest_plan": latest_plan,
            "feedback_summary": feedback_summary
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Trip not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get trip: {str(e)}")


@router.put("/{trip_id}/brief")
def update_brief(trip_id: str, req: UpdateBriefRequest) -> Dict[str, bool]:
    """Update trip brief."""
    try:
        storage.update_brief(trip_id, req.brief)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Trip not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update brief: {str(e)}")


@router.put("/{trip_id}/required-attendees")
def set_required_attendees(trip_id: str, req: RequiredAttendeesRequest) -> Dict[str, bool]:
    """Set required attendee members."""
    try:
        storage.set_required_attendees(trip_id, req.required_member_ids)
        return {"success": True}
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Trip or member not found")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to set required attendees: {str(e)}")


@router.put("/{trip_id}/members/{member_id}/constraints")
def upsert_member_constraints(trip_id: str, member_id: str, req: UpsertMemberInputsRequest) -> Dict[str, bool]:
    """Upsert member constraints and availability."""
    try:
        # Validate member belongs to trip
        member = storage.assert_member_in_trip(member_id, trip_id)
        
        # Upsert constraints
        storage.upsert_constraints(
            member_id=member_id,
            budget_min=req.budget_min,
            budget_max=req.budget_max,
            sliders=req.sliders,
            tags=req.tags,
            must_haves=req.must_haves,
            must_avoids=req.must_avoids,
            requests=req.requests
        )
        
        # Upsert availability
        storage.upsert_availability(member_id, req.available_dates)
        
        return {"success": True}
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Member or trip not found")
        if "not in trip" in msg.lower():
            raise HTTPException(status_code=403, detail="Member not authorized for this trip")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update constraints: {str(e)}")


@router.post("/{trip_id}/seed")
def seed_trip(trip_id: str) -> Dict[str, Any]:
    """
    Seed trip with fake members, constraints, availability, polls, and options.
    Great for demos and testing!
    """
    try:
        result = seed.seed_trip_data(trip_id)
        return {
            "success": True,
            "message": "Trip seeded successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
