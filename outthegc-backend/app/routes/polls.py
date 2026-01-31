from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from app.models import CreatePollRequest, VoteRequest, ClosePollRequest
from app import storage

router = APIRouter(prefix="/trips", tags=["polls"])


def build_poll_response(poll_id: str) -> Dict[str, Any]:
    """Build poll response with vote counts and member info."""
    poll = storage.get_poll_or_404(poll_id)
    
    # Get all votes for this poll
    poll_votes = storage.get_poll_votes(poll_id)
    
    # Count votes per option and collect vote details
    votes_by_option = {}
    vote_details = []
    
    for opt in poll.options:
        votes_for_option = [v for v in poll_votes if v.option_id == opt.id]
        votes_by_option[opt.id] = len(votes_for_option)
        
        # Add vote details (member_id and member name if available)
        for vote in votes_for_option:
            try:
                member = storage.get_member_or_404(vote.member_id)
                member_name = member.name
            except ValueError:
                member_name = "Unknown"
            vote_details.append({
                "member_id": vote.member_id,
                "member_name": member_name,
                "option_id": vote.option_id
            })
    
    return {
        "poll_id": poll.id,
        "trip_id": poll.trip_id,
        "type": poll.type,
        "question": poll.question,
        "options": [
            {
                "id": opt.id,
                "label": opt.label,
                "vote_count": votes_by_option.get(opt.id, 0)
            }
            for opt in poll.options
        ],
        "is_open": poll.is_open,
        "created_at": poll.created_at.isoformat(),
        "total_votes": len(poll_votes),
        "vote_details": vote_details
    }


@router.post("/{trip_id}/polls")
def create_poll(trip_id: str, req: CreatePollRequest) -> Dict[str, Any]:
    """Create new poll. Organiser only."""
    try:
        trip = storage.get_trip_or_404(trip_id)
        member = storage.assert_member_in_trip(req.created_by_member_id, trip_id)
        
        # Enforce organiser-only
        if not storage.is_organiser(req.created_by_member_id, trip_id):
            raise HTTPException(status_code=403, detail="Only organiser can create polls")
        
        # Create poll with auto-assigned option IDs if needed
        from uuid import uuid4
        options_list = []
        for opt_input in req.options:
            opt_id = opt_input.id if opt_input.id else str(uuid4())
            options_list.append(opt_input.label)  # Pass label for storage.create_poll
        
        poll = storage.create_poll(trip_id, req.type, req.question, options_list)
        
        return build_poll_response(poll.id)
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
        raise HTTPException(status_code=400, detail=f"Failed to create poll: {str(e)}")


@router.post("/{trip_id}/polls/{poll_id}/vote")
def vote_on_poll(trip_id: str, poll_id: str, req: VoteRequest) -> Dict[str, Any]:
    """Vote on a poll."""
    try:
        trip = storage.get_trip_or_404(trip_id)
        poll = storage.get_poll_or_404(poll_id)
        
        if poll.trip_id != trip_id:
            raise HTTPException(status_code=400, detail="Poll does not belong to this trip")
        
        # Ensure poll is open
        if not poll.is_open:
            raise HTTPException(status_code=400, detail="Poll is closed")
        
        # Ensure member belongs to trip
        storage.assert_member_in_trip(req.member_id, trip_id)
        
        # Ensure option exists
        if not any(opt.id == req.option_id for opt in poll.options):
            raise HTTPException(status_code=400, detail="Invalid poll option")
        
        # Record vote (upserts if member already voted)
        storage.vote(poll_id, req.member_id, req.option_id)
        
        # Return updated poll results
        return build_poll_response(poll_id)
    except HTTPException:
        raise
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Member or trip not found")
        if "not in trip" in msg.lower():
            raise HTTPException(status_code=403, detail="Member not authorized for this trip")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to vote: {str(e)}")


@router.post("/{trip_id}/polls/{poll_id}/close")
def close_poll(trip_id: str, poll_id: str, req: ClosePollRequest) -> Dict[str, Any]:
    """Close a poll. Organiser only."""
    try:
        trip = storage.get_trip_or_404(trip_id)
        poll = storage.get_poll_or_404(poll_id)
        
        if poll.trip_id != trip_id:
            raise HTTPException(status_code=400, detail="Poll does not belong to this trip")
        
        # Enforce organiser-only
        if not storage.is_organiser(req.member_id, trip_id):
            raise HTTPException(status_code=403, detail="Only organiser can close polls")
        
        # Close poll
        storage.close_poll(poll_id)
        
        return build_poll_response(poll_id)
    except HTTPException:
        raise
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail="Trip or member not found")
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to close poll: {str(e)}")
