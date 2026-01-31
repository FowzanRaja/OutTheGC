import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import PlanVersion, Option
from app import storage, config
from app.services import availability


# ============================================================================
# AGGREGATORS
# ============================================================================

def aggregate_trip_context(trip_id: str) -> Dict[str, Any]:
    """Pull all trip data needed for AI prompt."""
    trip = storage.get_trip_or_404(trip_id)
    members = storage.get_trip_members(trip_id)
    
    # Aggregate constraints
    constraints_list = []
    for member in members:
        constraint = storage.constraints_by_member.get(member.id)
        if constraint:
            constraints_list.append({
                'member_name': member.name,
                'budget_min': constraint.budget_min,
                'budget_max': constraint.budget_max,
                'tags': constraint.tags,
                'must_haves': constraint.must_haves,
                'must_avoids': constraint.must_avoids,
                'requests': constraint.requests
            })
    
    # Aggregate availability completion
    availability_status = []
    for member in members:
        avail = storage.availability_by_member.get(member.id)
        has_dates = bool(avail and avail.available_dates)
        availability_status.append({
            'member_name': member.name,
            'provided': has_dates,
            'count': len(avail.available_dates) if avail else 0
        })
    
    # Get best availability windows
    best_windows = availability.find_best_availability_windows(trip_id, window_length=4)
    
    # Feedback summaries (for reruns)
    feedback_list = storage.get_feedback_for_trip(trip_id)
    feedback_summary = {
        'total_feedback_count': len(feedback_list),
        'average_rating': sum(f.rating for f in feedback_list) / len(feedback_list) if feedback_list else 0,
        'common_dislikes': {}
    }
    for f in feedback_list:
        for activity_id in f.disliked_activity_ids:
            feedback_summary['common_dislikes'][activity_id] = feedback_summary['common_dislikes'].get(activity_id, 0) + 1
    
    return {
        'trip': {
            'id': trip.id,
            'name': trip.name,
            'brief': trip.brief,
            'origin': trip.origin,
            'destination_seed_list': trip.destination_seed_list,
            'created_at': trip.created_at.isoformat()
        },
        'members': [{'id': m.id, 'name': m.name, 'role': m.role} for m in members],
        'constraints': constraints_list,
        'availability_status': availability_status,
        'best_windows': best_windows,
        'feedback_summary': feedback_summary
    }


# ============================================================================
# PROMPT BUILDER
# ============================================================================

def build_ai_prompt(trip_id: str) -> str:
    """Build comprehensive prompt for Claude."""
    context = aggregate_trip_context(trip_id)
    trip = context['trip']
    constraints = context['constraints']
    windows = context['best_windows']
    
    prompt = f"""You are a travel planner. Plan a group trip based on the following:

**Trip Details:**
- Name: {trip['name']}
- Origin: {trip['origin']}
- Brief: {trip.get('brief', 'No brief provided')}
- Seed destinations to consider: {', '.join(trip['destination_seed_list']) if trip['destination_seed_list'] else 'Open to suggestions'}

**Members:**
{json.dumps(context['members'], indent=2)}

**Member Constraints & Preferences:**
{json.dumps(constraints, indent=2)}

**Best Availability Windows (organiser + required attendees available for all days):**
{json.dumps(windows, indent=2)}

**Task:**
Generate 3 diverse trip options. Each must:
1. Cover one of the best availability windows (or close)
2. Respect budget constraints
3. Include activities matching member preferences
4. Have realistic transport and costs

Return ONLY a valid JSON array of 3 option objects, no other text.
Each option must match this exact schema:
{{
  "id": "unique-id",
  "title": "Option Title",
  "destination": "City, Country",
  "date_window": "2026-02-03..2026-02-06",
  "summary": "Brief overview",
  "itinerary": [
    {{"day": 1, "activity": "description"}},
    ...
  ],
  "transport": [
    {{"leg": "origin -> destination", "mode": "flight", "duration": "2h", "cost_per_person": 150}}
  ],
  "costs": {{"accommodation": 600, "activities": 200, "transport": 150, "contingency": 100}},
  "packing_list": ["item1", "item2"],
  "rationale": "Why this option",
  "assumptions": ["assumption1"]
}}

Respond with ONLY the JSON array, no markdown, no explanation.
"""
    return prompt


# ============================================================================
# MOCK OPTIONS (Deterministic Fallback)
# ============================================================================

def generate_mock_options(trip_id: str) -> List[Option]:
    """Generate deterministic mock trip options."""
    context = aggregate_trip_context(trip_id)
    trip = context['trip']
    windows = context['best_windows']
    
    # Use first best window, or default dates
    if windows:
        date_window = windows[0]['window']
        destination = trip['destination_seed_list'][0] if trip['destination_seed_list'] else "Barcelona, Spain"
    else:
        date_window = "2026-02-03..2026-02-06"
        destination = trip['destination_seed_list'][0] if trip['destination_seed_list'] else "Barcelona, Spain"
    
    options = [
        Option(
            id="mock-opt-001",
            title="Adventure Option",
            destination=destination,
            date_window=date_window,
            summary="High-energy itinerary with outdoor activities and cultural exploration",
            itinerary=[
                {"day": 1, "activity": "Arrive and explore local markets"},
                {"day": 2, "activity": "Hiking or outdoor adventure"},
                {"day": 3, "activity": "City tour and cultural sites"},
                {"day": 4, "activity": "Beach day or water activity"}
            ],
            transport=[
                {"leg": f"{trip['origin']} -> {destination}", "mode": "flight", "duration": "2h", "cost_per_person": 180}
            ],
            costs={"accommodation": 400, "activities": 250, "transport": 180, "contingency": 100},
            packing_list=["hiking boots", "swimsuit", "sunscreen", "casual clothes", "comfortable shoes"],
            rationale="Balances activity levels and cultural immersion for diverse group",
            assumptions=["Budget-conscious group", "Mix of adventure seekers", "4-day window available"]
        ),
        Option(
            id="mock-opt-002",
            title="Relaxation Option",
            destination=destination,
            date_window=date_window,
            summary="Leisure-focused itinerary with wellness and cultural experiences",
            itinerary=[
                {"day": 1, "activity": "Arrive and settle in"},
                {"day": 2, "activity": "Spa or wellness retreat"},
                {"day": 3, "activity": "Museum visits and gastronomy"},
                {"day": 4, "activity": "Leisurely local exploration"}
            ],
            transport=[
                {"leg": f"{trip['origin']} -> {destination}", "mode": "flight", "duration": "2h", "cost_per_person": 160}
            ],
            costs={"accommodation": 500, "activities": 300, "transport": 160, "contingency": 100},
            packing_list=["comfortable clothes", "spa essentials", "casual shoes", "light layers"],
            rationale="Low-stress option emphasizing relaxation and cultural discovery",
            assumptions=["Preference for downtime", "Moderate budget", "Mix of interests"]
        ),
        Option(
            id="mock-opt-003",
            title="Social Option",
            destination=destination,
            date_window=date_window,
            summary="Group-focused itinerary with communal experiences and nightlife",
            itinerary=[
                {"day": 1, "activity": "Group welcome dinner"},
                {"day": 2, "activity": "Guided group tour"},
                {"day": 3, "activity": "Team activities and workshops"},
                {"day": 4, "activity": "Celebration and local nightlife"}
            ],
            transport=[
                {"leg": f"{trip['origin']} -> {destination}", "mode": "flight", "duration": "2h", "cost_per_person": 170}
            ],
            costs={"accommodation": 420, "activities": 280, "transport": 170, "contingency": 100},
            packing_list=["evening attire", "comfortable walking shoes", "casual clothes", "small day bag"],
            rationale="Maximizes group bonding with shared experiences and social activities",
            assumptions=["Group cohesion important", "Mix of social comfort levels", "Evening activities welcome"]
        )
    ]
    
    return options


# ============================================================================
# AI GENERATION
# ============================================================================

def call_claude_api(prompt: str) -> Optional[str]:
    """
    Call Claude API for trip planning.
    STUB for now - will implement with config.CLAUDE_API_KEY later.
    """
    if not config.CLAUDE_API_KEY:
        return None
    
    # TODO: Implement actual Claude API call
    # from anthropic import Anthropic
    # client = Anthropic(api_key=config.CLAUDE_API_KEY)
    # message = client.messages.create(
    #     model="claude-3-5-sonnet-20241022",
    #     max_tokens=2048,
    #     messages=[{"role": "user", "content": prompt}]
    # )
    # return message.content[0].text
    
    return None


def generate_options(trip_id: str) -> Dict[str, Any]:
    """
    Generate trip options. Uses MOCK_MODE or Claude.
    
    Returns:
        {
            'plan_version': PlanVersion,
            'warning': Optional[str],
            'success': bool
        }
    """
    trip = storage.get_trip_or_404(trip_id)
    
    if config.MOCK_MODE:
        # Use mock options
        options = generate_mock_options(trip_id)
        plan = PlanVersion(
            id=str(__import__('uuid').uuid4()),
            trip_id=trip_id,
            version_num=1,
            created_at=datetime.utcnow(),
            options=options
        )
        return {
            'plan_version': plan,
            'warning': 'MOCK_MODE: Using deterministic sample options',
            'success': True
        }
    else:
        # Try Claude
        prompt = build_ai_prompt(trip_id)
        response = call_claude_api(prompt)
        
        if not response:
            # Fall back to mock if Claude unavailable
            options = generate_mock_options(trip_id)
            plan = PlanVersion(
                id=str(__import__('uuid').uuid4()),
                trip_id=trip_id,
                version_num=1,
                created_at=datetime.utcnow(),
                options=options
            )
            return {
                'plan_version': plan,
                'warning': 'Claude unavailable, using mock options',
                'success': False
            }
        
        # Parse and validate Claude response
        try:
            parsed = json.loads(response)
            if not isinstance(parsed, list):
                parsed = [parsed]
            
            options = [Option(**opt) for opt in parsed]
            plan = PlanVersion(
                id=str(__import__('uuid').uuid4()),
                trip_id=trip_id,
                version_num=1,
                created_at=datetime.utcnow(),
                options=options
            )
            return {
                'plan_version': plan,
                'warning': None,
                'success': True
            }
        except (json.JSONDecodeError, ValueError) as e:
            # Validation failed, return mock + warning
            options = generate_mock_options(trip_id)
            plan = PlanVersion(
                id=str(__import__('uuid').uuid4()),
                trip_id=trip_id,
                version_num=1,
                created_at=datetime.utcnow(),
                options=options
            )
            return {
                'plan_version': plan,
                'warning': f'Claude response invalid: {str(e)}. Using mock options.',
                'success': False
            }
