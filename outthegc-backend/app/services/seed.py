from datetime import datetime, timedelta
from uuid import uuid4
from app import storage
from app.services import ai


def seed_trip_data(trip_id: str) -> dict:
    """
    Seed a trip with fake members, constraints, availability, polls, and options.
    Makes demo trips ready in one click.
    """
    trip = storage.get_trip_or_404(trip_id)
    
    # Create 3-6 fake members (excluding organiser)
    fake_members = [
        {"name": "Alice Chen", "budget": (800, 1500), "tags": ["adventure", "cultural", "foodie"], "dates": 12},
        {"name": "Bob Martinez", "budget": (600, 1200), "tags": ["relaxation", "beach", "nature"], "dates": 15},
        {"name": "Charlie Davis", "budget": (1000, 2000), "tags": ["nightlife", "adventure", "shopping"], "dates": 10},
        {"name": "Diana Kim", "budget": (700, 1400), "tags": ["cultural", "museums", "photography"], "dates": 14},
        {"name": "Ethan Johnson", "budget": (500, 1000), "tags": ["budget-friendly", "nature", "hiking"], "dates": 18},
    ]
    
    created_members = []
    base_date = datetime(2026, 2, 1).date()
    
    for i, fake_data in enumerate(fake_members):
        # Create member
        member = storage.join_trip(trip_id, fake_data["name"])
        created_members.append(member)
        
        # Add constraints
        storage.upsert_constraints(
            member_id=member.id,
            budget_min=fake_data["budget"][0],
            budget_max=fake_data["budget"][1],
            tags=fake_data["tags"],
            must_haves=["wifi", "comfortable accommodation"] if i % 2 == 0 else ["local experiences"],
            must_avoids=["extreme sports"] if i % 3 == 0 else [],
            sliders={
                "activity_level": (i + 2) * 2,  # 4, 6, 8, 10, 12
                "social_preference": (i + 1) * 2,  # 2, 4, 6, 8, 10
                "budget_flexibility": 5 + i  # 5-9
            },
            requests=f"Would love to try local cuisine and meet new people!" if i % 2 == 0 else None
        )
        
        # Add availability (varied overlapping date ranges)
        num_dates = fake_data["dates"]
        start_offset = i * 2  # Stagger start dates
        available_dates = [
            (base_date + timedelta(days=start_offset + j)).isoformat()
            for j in range(num_dates)
        ]
        storage.upsert_availability(member.id, available_dates)
    
    # Mark first 2 members as required attendees
    if len(created_members) >= 2:
        required_ids = trip.required_member_ids + [created_members[0].id, created_members[1].id]
        storage.set_required_attendees(trip_id, required_ids)
    
    # Create 1-2 sample polls
    polls_created = []
    
    # Poll 1: Destination preference
    from app.models import PollOption
    poll1 = storage.create_poll(
        trip_id=trip_id,
        poll_type="destination",
        question="Which destination interests you most?",
        options=["Barcelona, Spain", "Lisbon, Portugal", "Rome, Italy"]
    )
    polls_created.append(poll1)
    
    # Add some votes to poll 1
    for i, member in enumerate(created_members[:3]):
        storage.vote(poll1.id, member.id, poll1.options[i % len(poll1.options)].id)
    
    # Poll 2: Date preference
    poll2 = storage.create_poll(
        trip_id=trip_id,
        poll_type="dates",
        question="Which date window works best for you?",
        options=["2026-02-03..2026-02-06", "2026-02-10..2026-02-13", "2026-02-17..2026-02-20"]
    )
    polls_created.append(poll2)
    
    # Add some votes to poll 2
    for i, member in enumerate(created_members):
        storage.vote(poll2.id, member.id, poll2.options[i % len(poll2.options)].id)
    
    # Generate mock options
    result = ai.generate_options(trip_id)
    plan_version = result['plan_version']
    
    # Store plan version
    stored_plan = storage.add_plan_version(trip_id, plan_version.options)
    
    # Add some sample feedback
    if len(created_members) >= 2 and plan_version.options:
        storage.add_feedback(
            trip_id=trip_id,
            option_id=plan_version.options[0].id,
            member_id=created_members[0].id,
            rating=4,
            disliked_activity_ids=[],
            comment="Love the adventure focus! Would prefer more downtime though."
        )
        
        storage.add_feedback(
            trip_id=trip_id,
            option_id=plan_version.options[1].id,
            member_id=created_members[1].id,
            rating=5,
            disliked_activity_ids=[],
            comment="This looks perfect for our group!"
        )
    
    return {
        "members_created": len(created_members),
        "member_names": [m.name for m in created_members],
        "polls_created": len(polls_created),
        "plan_version": stored_plan.version_num,
        "feedback_added": 2 if len(created_members) >= 2 else 0
    }
