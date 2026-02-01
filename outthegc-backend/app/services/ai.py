import json
from typing import Optional, List, Dict, Any
from datetime import datetime
try:
    from anthropic import Anthropic
except ImportError:  # Optional if dependency not installed
    Anthropic = None
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
    
    prompt = f"""You are an expert travel planner AI and group decision assistant.

Your task is to generate MULTIPLE realistic holiday plan options for a group of people,
based strictly on the structured input provided.

You must follow ALL instructions carefully.

────────────────────────────────
CONTEXT
────────────────────────────────

This is a collaborative group holiday planner.

The group has already:
- submitted availability
- submitted budgets
- submitted preferences
- chosen a date window (or been given one)
- optionally provided an organiser brief
- optionally provided feedback from previous plans

You are NOT deciding dates.
You are NOT deciding who is attending.
You are NOT resolving conflicts.

You are ONLY generating holiday plan OPTIONS that respect the given constraints.

────────────────────────────────
INPUT DATA
────────────────────────────────

**Trip Details:**
- Name: {trip['name']}
- Origin: {trip['origin']}
- Organiser Brief: {trip.get('brief', 'No brief provided')}
- Destination Candidates: {', '.join(trip['destination_seed_list']) if trip['destination_seed_list'] else 'Open to suggestions'}

**Members:**
{json.dumps(context['members'], indent=2)}

**Member Constraints & Preferences:**
{json.dumps(constraints, indent=2)}

**Best Availability Windows:**
{json.dumps(windows, indent=2)}

**Feedback Summary:**
{json.dumps(context['feedback_summary'], indent=2)}

────────────────────────────────
WHAT YOU MUST GENERATE
────────────────────────────────

You MUST generate EXACTLY **3 holiday options**.

Each option must:
- be clearly distinct from the others
- target a different travel "style" where possible
- use DIFFERENT destinations (vary style: beach vs city vs mountains, etc.)
- use DIFFERENT date windows (spread across available windows)
- stay realistic and internally consistent
- respect budget and constraints

Label them: Option A, Option B, Option C

DO NOT invent extra options.
DO NOT ask questions.
DO NOT include explanations outside the JSON.

────────────────────────────────
OPTION REQUIREMENTS
────────────────────────────────

Each option MUST include:

1. Destination
2. Date window (use the provided one verbatim)
3. Short summary (2–3 sentences)
4. Day-by-day itinerary:
   - Days numbered starting at Day 1
   - Each day contains time blocks
   - Include travel buffers and meals
5. Estimated costs:
   - total_per_person
   - breakdown (transport, accommodation, food, activities, buffer)
6. Transport plan:
   - mock but realistic (flight / train / coach / car)
7. Packing list:
   - item + reason
8. Rationale:
   - explain why this option fits the group
9. Assumptions:
   - list any assumptions you made due to missing data

────────────────────────────────
STRICT OUTPUT FORMAT
────────────────────────────────

You MUST respond with **VALID JSON ONLY**.
NO markdown.
NO commentary.
NO explanations.
NO trailing text.

Use EXACTLY this schema:

[
  {{
    "id": "option-a",
    "title": "string",
    "destination": "City, Country",
    "date_window": "string (use from best_windows verbatim)",
    "summary": "2-3 sentences",
    "itinerary": [
      {{
        "day": 1,
        "blocks": [
          {{
            "time": "08:00-09:00",
            "title": "Breakfast",
            "notes": "details"
          }}
        ]
      }}
    ],
    "costs": {{
      "total_per_person": 950,
      "breakdown": {{
        "transport": 200,
        "accommodation": 400,
        "food": 180,
        "activities": 120,
        "buffer": 50
      }}
    }},
    "transport": [
      {{
        "leg": "origin -> destination",
        "mode": "flight|train|coach|car",
        "duration": "2h 15m",
        "cost_per_person": 150
      }}
    ],
    "packing_list": [
      "item: reason"
    ],
    "rationale": "Why this option fits the group",
    "assumptions": ["assumption1", "assumption2"]
  }}
]

────────────────────────────────
GUARDRAILS
────────────────────────────────

- Do NOT exceed budgets unrealistically
- Do NOT ignore organiser brief or constraints
- Do NOT hallucinate unavailable destinations
- Do NOT use real-time pricing or weather
- Keep tone neutral and practical
- Be concise but complete
- Include reasonable spacing and gaps in daily schedules

If any required information is missing:
- Make a reasonable assumption
- Document it in the assumptions list

Failure to follow format = invalid output.

BEGIN.
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

def call_claude_api(prompt: str, *, debug: bool = False) -> Optional[str]:
    """
    Call Claude API for trip planning.
    """
    if not config.CLAUDE_API_KEY:
        if debug:
            return "MISSING_CLAUDE_API_KEY"
        return None

    if Anthropic is None:
        if debug:
            return "ANTHROPIC_SDK_NOT_INSTALLED"
        return None

    try:
        client = Anthropic(api_key=config.CLAUDE_API_KEY)
        message = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        if not message or not getattr(message, "content", None):
            return "EMPTY_RESPONSE" if debug else None

        parts = []
        for block in message.content:
            text = getattr(block, "text", None)
            if text:
                parts.append(text)
        text = "".join(parts).strip()
        return text or ("EMPTY_TEXT" if debug else None)
    except Exception as e:
        if debug:
            return f"ERROR: {type(e).__name__}: {e}"
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
            # Log raw response for debugging
            print(f"[DEBUG] Claude raw response length: {len(response)}")
            print(f"[DEBUG] Claude response preview: {response[:500]}...")
            
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
