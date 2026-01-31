# SQLite Migration Guide

## Current Architecture (In-Memory)

All routes interact with storage through **function calls only**. No direct access to global dictionaries.

### Storage Functions Available

**Trip Operations:**
- `create_trip()` - Create trip with organiser
- `get_trip_or_404()` - Retrieve trip or raise error
- `update_brief()` - Update trip brief
- `set_required_attendees()` - Set required members
- `get_trip_members()` - Get all members in trip

**Member Operations:**
- `join_trip()` - Add member to trip
- `get_member_or_404()` - Retrieve member or raise error
- `assert_member_in_trip()` - Validate member belongs to trip
- `is_organiser()` - Check if member is organiser

**Constraints & Availability:**
- `upsert_constraints()` - Create/update member constraints
- `upsert_availability()` - Create/update member availability
- `get_constraints()` - Get member constraints
- `get_availability()` - Get member availability

**Poll Operations:**
- `create_poll()` - Create new poll
- `get_poll_or_404()` - Retrieve poll or raise error
- `get_all_polls_for_trip()` - Get all polls for trip
- `vote()` - Record a vote
- `close_poll()` - Close poll
- `get_poll_votes()` - Get all votes for poll

**Plan Operations:**
- `add_plan_version()` - Create new plan version
- `get_latest_plan()` - Get most recent plan
- `get_plans_for_trip()` - Get all plan versions

**Feedback Operations:**
- `add_feedback()` - Store feedback
- `get_feedback_for_trip()` - Get all feedback for trip
- `get_feedback_for_option()` - Get feedback for specific option

## Migration to SQLite

When you're ready to migrate to SQLite:

1. **Keep all function signatures identical** - Routes won't need changes
2. **Replace internal implementation** in storage.py:
   - Change global dicts to SQLAlchemy/SQLite operations
   - Add database session management
   - Implement transactions for consistency

3. **Example migration pattern:**

```python
# OLD (in-memory):
def get_trip_or_404(trip_id: str) -> Trip:
    if trip_id not in trips:
        raise ValueError(f"Trip {trip_id} not found")
    return trips[trip_id]

# NEW (SQLite):
def get_trip_or_404(trip_id: str) -> Trip:
    with get_db_session() as session:
        trip = session.query(TripModel).filter_by(id=trip_id).first()
        if not trip:
            raise ValueError(f"Trip {trip_id} not found")
        return Trip.from_orm(trip)
```

4. **Add database models** (e.g., with SQLAlchemy):
   - Create ORM models matching Pydantic models
   - Use Alembic for migrations
   - Add indexes for performance

5. **Test the same way** - Your test scripts will work unchanged!

## Benefits of This Architecture

✅ **Zero route changes** when switching to SQLite
✅ **Consistent error handling** throughout
✅ **Easy testing** with mock storage layer
✅ **Clean separation** of concerns
✅ **Flexible** - swap to any database without touching routes

## Current Route → Storage Mapping

| Route | Storage Functions Used |
|-------|----------------------|
| `POST /trips` | `create_trip()`, `update_brief()` |
| `POST /trips/{id}/join` | `join_trip()` |
| `GET /trips/{id}` | `get_trip_or_404()`, `get_trip_members()`, `get_constraints()`, `get_availability()`, `get_all_polls_for_trip()`, `get_poll_votes()`, `get_plans_for_trip()`, `get_feedback_for_trip()` |
| `PUT /trips/{id}/brief` | `update_brief()` |
| `PUT /trips/{id}/required-attendees` | `set_required_attendees()` |
| `PUT /trips/{id}/members/{mid}/constraints` | `assert_member_in_trip()`, `upsert_constraints()`, `upsert_availability()` |
| `POST /trips/{id}/polls` | `create_poll()`, `is_organiser()` |
| `POST /trips/{id}/polls/{pid}/vote` | `get_poll_or_404()`, `assert_member_in_trip()`, `vote()` |
| `POST /trips/{id}/polls/{pid}/close` | `get_poll_or_404()`, `is_organiser()`, `close_poll()` |
| `POST /trips/{id}/generate-options` | `is_organiser()`, `add_plan_version()`, `get_latest_plan()` |
| `POST /trips/{id}/rerun-options` | `is_organiser()`, `get_feedback_for_trip()`, `add_plan_version()`, `get_latest_plan()` |
| `POST /trips/{id}/options/{oid}/feedback` | `assert_member_in_trip()`, `get_latest_plan()`, `add_feedback()` |

All routes are **SQLite-ready** with zero changes needed!
