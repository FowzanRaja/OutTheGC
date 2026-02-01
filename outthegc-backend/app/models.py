from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# STORED MODELS (In-memory state)
# ============================================================================

class Trip(BaseModel):
    id: str
    name: str
    organiser_member_id: str
    brief: Optional[str] = None
    origin: str
    destination_seed_list: List[str] = []
    required_member_ids: List[str] = []
    created_at: datetime


class Member(BaseModel):
    id: str
    trip_id: str
    name: str
    role: str


class Constraints(BaseModel):
    member_id: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    sliders: Dict[str, Any] = {}
    tags: List[str] = []
    must_haves: List[str] = []
    must_avoids: List[str] = []
    requests: Optional[str] = None


class Availability(BaseModel):
    member_id: str
    available_dates: List[str] = []


class PollOption(BaseModel):
    id: str
    label: str


class SliderConfig(BaseModel):
    left_label: str
    right_label: str
    min: int = 0
    max: int = 100
    step: int = 1


class Poll(BaseModel):
    id: str
    trip_id: str
    type: str
    question: str
    options: List[PollOption]
    slider: Optional[SliderConfig] = None
    is_open: bool
    created_at: datetime


class Vote(BaseModel):
    poll_id: str
    member_id: str
    option_id: Optional[str] = None
    value: Optional[int] = None


class Option(BaseModel):
    id: str
    title: str
    destination: str
    date_window: str
    summary: str
    itinerary: List[Dict[str, Any]] = []
    transport: List[Dict[str, Any]] = []
    costs: Dict[str, Any] = {}
    packing_list: List[str] = []
    rationale: str
    assumptions: List[str] = []


class PlanVersion(BaseModel):
    id: str
    trip_id: str
    version_num: int
    created_at: datetime
    options: List[Option]


class Feedback(BaseModel):
    trip_id: str
    option_id: str
    member_id: str
    rating: int
    disliked_activity_ids: List[str] = []
    comment: Optional[str] = None


# ============================================================================
# REQUEST MODELS
# ============================================================================

class CreateTripRequest(BaseModel):
    name: str
    origin: str
    brief: Optional[str] = None
    organiser_name: str


class JoinTripRequest(BaseModel):
    name: str


class UpdateBriefRequest(BaseModel):
    brief: str


class RequiredAttendeesRequest(BaseModel):
    required_member_ids: List[str]


class UpsertMemberInputsRequest(BaseModel):
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    sliders: Dict[str, Any] = {}
    tags: List[str] = []
    must_haves: List[str] = []
    must_avoids: List[str] = []
    requests: Optional[str] = None
    available_dates: List[str] = []


class CreatePollOptionInput(BaseModel):
    id: Optional[str] = None
    label: str


class CreatePollRequest(BaseModel):
    created_by_member_id: str
    type: str
    question: str
    options: List[CreatePollOptionInput] = []
    slider: Optional[SliderConfig] = None


class VoteRequest(BaseModel):
    member_id: str
    option_id: Optional[str] = None
    value: Optional[int] = None


class ClosePollRequest(BaseModel):
    member_id: str


class GenerateOptionsRequest(BaseModel):
    created_by_member_id: str
    duration_days: Optional[int] = None


class RerunOptionsRequest(BaseModel):
    created_by_member_id: str


class FeedbackRequest(BaseModel):
    member_id: str
    rating: int
    disliked_activity_ids: List[str] = []
    comment: Optional[str] = None
