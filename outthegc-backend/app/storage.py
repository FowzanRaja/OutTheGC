from typing import Dict, List, Optional, Tuple
from datetime import datetime
from uuid import uuid4
from app.models import (
    Trip, Member, Constraints, Availability, Poll, Vote, PlanVersion, Option, Feedback,
    PollOption, SliderConfig, DateWindow
)

# ============================================================================
# GLOBAL STORAGE DICTS
# ============================================================================

trips: Dict[str, Trip] = {}
members: Dict[str, Member] = {}
constraints_by_member: Dict[str, Constraints] = {}
availability_by_member: Dict[str, Availability] = {}
polls: Dict[str, Poll] = {}
votes: Dict[Tuple[str, str, Optional[str]], Vote] = {}  # (poll_id, member_id, option_id) -> Vote
plans_by_trip: Dict[str, List[PlanVersion]] = {}
feedback_by_trip: Dict[str, List[Feedback]] = {}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_trip_or_404(trip_id: str) -> Trip:
    """Retrieve trip or raise exception."""
    if trip_id not in trips:
        raise ValueError(f"Trip {trip_id} not found")
    return trips[trip_id]


def get_member_or_404(member_id: str) -> Member:
    """Retrieve member or raise exception."""
    if member_id not in members:
        raise ValueError(f"Member {member_id} not found")
    return members[member_id]


def get_poll_or_404(poll_id: str) -> Poll:
    """Retrieve poll or raise exception."""
    if poll_id not in polls:
        raise ValueError(f"Poll {poll_id} not found")
    return polls[poll_id]


def assert_member_in_trip(member_id: str, trip_id: str) -> Member:
    """Assert member exists and belongs to trip."""
    member = get_member_or_404(member_id)
    if member.trip_id != trip_id:
        raise ValueError(f"Member {member_id} is not in trip {trip_id}")
    return member


def is_organiser(member_id: str, trip_id: str) -> bool:
    """Check if member is organiser of trip."""
    member = assert_member_in_trip(member_id, trip_id)
    return member.role == "organiser"


def get_latest_plan(trip_id: str) -> Optional[PlanVersion]:
    """Get most recent plan version for trip."""
    plan_list = plans_by_trip.get(trip_id, [])
    return plan_list[-1] if plan_list else None


def get_trip_members(trip_id: str) -> List[Member]:
    """Get all members in a trip."""
    return [m for m in members.values() if m.trip_id == trip_id]


def get_availability(member_id: str) -> Optional[Availability]:
    """Get availability for a member."""
    return availability_by_member.get(member_id)


def get_constraints(member_id: str) -> Optional[Constraints]:
    """Get constraints for a member."""
    return constraints_by_member.get(member_id)


def get_all_polls_for_trip(trip_id: str) -> List[Poll]:
    """Get all polls for a trip."""
    return [p for p in polls.values() if p.trip_id == trip_id]


# ============================================================================
# CRUD: TRIPS
# ============================================================================

def create_trip(name: str, origin: str, brief: Optional[str], organiser_name: str) -> Tuple[Trip, Member]:
    """Create new trip and organiser member."""
    trip_id = str(uuid4())
    organiser_id = str(uuid4())
    
    now = datetime.utcnow()
    
    # Create trip
    trip = Trip(
        id=trip_id,
        name=name,
        organiser_member_id=organiser_id,
        brief=brief,
        origin=origin,
        destination_seed_list=[],
        required_member_ids=[organiser_id],
        created_at=now
    )
    trips[trip_id] = trip
    
    # Create organiser member
    organiser = Member(
        id=organiser_id,
        trip_id=trip_id,
        name=organiser_name,
        role="organiser"
    )
    members[organiser_id] = organiser
    
    # Initialize empty collections
    plans_by_trip[trip_id] = []
    feedback_by_trip[trip_id] = []
    
    return trip, organiser


def update_brief(trip_id: str, brief: str) -> Trip:
    """Update trip brief."""
    trip = get_trip_or_404(trip_id)
    trip.brief = brief
    trips[trip_id] = trip
    return trip


def set_required_attendees(trip_id: str, required_member_ids: List[str]) -> Trip:
    """Set required member IDs for trip."""
    trip = get_trip_or_404(trip_id)
    # Validate all members exist and are in trip
    for mid in required_member_ids:
        assert_member_in_trip(mid, trip_id)
    trip.required_member_ids = required_member_ids
    trips[trip_id] = trip
    return trip


# ============================================================================
# CRUD: MEMBERS & CONSTRAINTS
# ============================================================================

def join_trip(trip_id: str, name: str) -> Member:
    """Add new member to trip."""
    trip = get_trip_or_404(trip_id)
    
    member_id = str(uuid4())
    member = Member(
        id=member_id,
        trip_id=trip_id,
        name=name,
        role="member"
    )
    members[member_id] = member
    return member


def upsert_constraints(member_id: str, 
                      budget_min: Optional[float] = None,
                      budget_max: Optional[float] = None,
                      sliders: Optional[Dict] = None,
                      tags: Optional[List[str]] = None,
                      must_haves: Optional[List[str]] = None,
                      must_avoids: Optional[List[str]] = None,
                      requests: Optional[str] = None) -> Constraints:
    """Create or update member constraints."""
    member = get_member_or_404(member_id)
    
    constraints = Constraints(
        member_id=member_id,
        budget_min=budget_min,
        budget_max=budget_max,
        sliders=sliders or {},
        tags=tags or [],
        must_haves=must_haves or [],
        must_avoids=must_avoids or [],
        requests=requests
    )
    constraints_by_member[member_id] = constraints
    return constraints


def upsert_availability(member_id: str, available_dates: List[str]) -> Availability:
    """Create or update member availability."""
    member = get_member_or_404(member_id)
    
    availability = Availability(
        member_id=member_id,
        available_dates=available_dates
    )
    availability_by_member[member_id] = availability
    return availability


# ============================================================================
# CRUD: POLLS & VOTING
# ============================================================================

def create_poll(
    trip_id: str,
    poll_type: str,
    question: str,
    options: List[str],
    slider: Optional[SliderConfig] = None,
    date_window: Optional[DateWindow] = None
) -> Poll:
    """Create new poll for trip."""
    trip = get_trip_or_404(trip_id)
    
    poll_id = str(uuid4())
    poll_options = [PollOption(id=str(uuid4()), label=opt) for opt in options]
    
    poll = Poll(
        id=poll_id,
        trip_id=trip_id,
        type=poll_type,
        question=question,
        options=poll_options,
        slider=slider,
        date_window=date_window,
        is_open=True,
        created_at=datetime.utcnow()
    )
    polls[poll_id] = poll
    return poll


def vote(
    poll_id: str,
    member_id: str,
    option_id: Optional[str] = None,
    value: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Vote:
    """Record a vote. Rejects if poll closed or option invalid.
    For single choice: replaces previous vote
    For multi choice: adds vote (allows multiple selections)
    """
    poll = polls.get(poll_id)
    if not poll:
        raise ValueError(f"Poll {poll_id} not found")
    
    if not poll.is_open:
        raise ValueError(f"Poll {poll_id} is closed")
    
    if poll.type == "slider":
        if value is None:
            raise ValueError("Slider vote requires value")
        if poll.slider is None:
            raise ValueError("Slider configuration not found for poll")
        if value < poll.slider.min or value > poll.slider.max:
            raise ValueError("Slider value out of range")
    elif poll.type == "dates":
        if not start_date or not end_date:
            raise ValueError("Date vote requires start_date and end_date")
        if poll.date_window is None:
            raise ValueError("Date window not found for poll")
    else:
        if option_id is None:
            raise ValueError("Option id is required for this poll type")
        # Validate option exists in poll
        if not any(opt.id == option_id for opt in poll.options):
            raise ValueError(f"Option {option_id} not found in poll {poll_id}")
    
    # Get member (validate exists)
    member = get_member_or_404(member_id)
    
    # For single choice polls: remove previous vote if it exists
    if poll.type == "single":
        keys_to_remove = [key for key in votes if key[0] == poll_id and key[1] == member_id]
        for key in keys_to_remove:
            del votes[key]

    if poll.type == "slider":
        keys_to_remove = [key for key in votes if key[0] == poll_id and key[1] == member_id]
        for key in keys_to_remove:
            del votes[key]
        vote_key = (poll_id, member_id, None)
        vote = Vote(poll_id=poll_id, member_id=member_id, option_id=None, value=value)
        votes[vote_key] = vote
        return vote

    if poll.type == "dates":
        keys_to_remove = [key for key in votes if key[0] == poll_id and key[1] == member_id]
        for key in keys_to_remove:
            del votes[key]
        vote_key = (poll_id, member_id, None)
        vote = Vote(
            poll_id=poll_id,
            member_id=member_id,
            option_id=None,
            start_date=start_date,
            end_date=end_date
        )
        votes[vote_key] = vote
        return vote

    # Store vote with unique key (poll_id, member_id, option_id) for multi-choice support
    vote_key = (poll_id, member_id, option_id)
    vote = Vote(poll_id=poll_id, member_id=member_id, option_id=option_id)
    votes[vote_key] = vote
    return vote


def close_poll(poll_id: str) -> Poll:
    """Close a poll to prevent further votes."""
    poll = polls.get(poll_id)
    if not poll:
        raise ValueError(f"Poll {poll_id} not found")
    
    poll.is_open = False
    polls[poll_id] = poll
    return poll


def get_poll_votes(poll_id: str) -> List[Vote]:
    """Get all votes for a poll."""
    return [v for key, v in votes.items() if key[0] == poll_id]


def get_member_votes_for_poll(poll_id: str, member_id: str) -> List[Vote]:
    """Get all votes by a specific member for a poll."""
    return [v for key, v in votes.items() if key[0] == poll_id and key[1] == member_id]


# ============================================================================
# CRUD: PLANS
# ============================================================================

def add_plan_version(trip_id: str, options: List[Option]) -> PlanVersion:
    """Create new plan version for trip."""
    trip = get_trip_or_404(trip_id)
    
    # Get next version number
    plan_list = plans_by_trip.get(trip_id, [])
    next_version = len(plan_list) + 1
    
    plan_id = str(uuid4())
    plan = PlanVersion(
        id=plan_id,
        trip_id=trip_id,
        version_num=next_version,
        created_at=datetime.utcnow(),
        options=options
    )
    
    if trip_id not in plans_by_trip:
        plans_by_trip[trip_id] = []
    plans_by_trip[trip_id].append(plan)
    
    return plan


def get_plans_for_trip(trip_id: str) -> List[PlanVersion]:
    """Get all plan versions for trip."""
    return plans_by_trip.get(trip_id, [])


# ============================================================================
# CRUD: FEEDBACK
# ============================================================================

def add_feedback(trip_id: str, option_id: str, member_id: str, rating: int,
                 disliked_activity_ids: Optional[List[str]] = None,
                 comment: Optional[str] = None) -> Feedback:
    """Record feedback on an option."""
    trip = get_trip_or_404(trip_id)
    member = assert_member_in_trip(member_id, trip_id)
    
    feedback = Feedback(
        trip_id=trip_id,
        option_id=option_id,
        member_id=member_id,
        rating=rating,
        disliked_activity_ids=disliked_activity_ids or [],
        comment=comment
    )
    
    if trip_id not in feedback_by_trip:
        feedback_by_trip[trip_id] = []
    feedback_by_trip[trip_id].append(feedback)
    
    return feedback


def get_feedback_for_trip(trip_id: str) -> List[Feedback]:
    """Get all feedback for trip."""
    return feedback_by_trip.get(trip_id, [])


def get_feedback_for_option(trip_id: str, option_id: str) -> List[Feedback]:
    """Get feedback for specific option."""
    return [f for f in feedback_by_trip.get(trip_id, []) if f.option_id == option_id]
