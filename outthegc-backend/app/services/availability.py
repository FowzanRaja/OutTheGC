from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Set
from app import storage


def get_available_dates_set(member_id: str) -> Set[date]:
    """Convert member's ISO date strings to set of date objects."""
    avail = storage.availability_by_member.get(member_id)
    if not avail:
        return set()
    
    dates = set()
    for date_str in avail.available_dates:
        try:
            d = datetime.fromisoformat(date_str).date()
            dates.add(d)
        except ValueError:
            # Skip invalid dates
            pass
    return dates


def find_best_availability_windows(trip_id: str, window_length: int = 4) -> List[Dict]:
    """
    Find top 3 contiguous date windows where organiser and all required attendees
    are available for every day. Score by total members available for full window.
    
    Returns:
        List of dicts with keys:
        - window: "2026-02-03..2026-02-06"
        - start: "2026-02-03"
        - end: "2026-02-06"
        - days: ["2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06"]
        - score: number of members available for all days
    """
    trip = storage.get_trip_or_404(trip_id)
    
    # Determine which members must attend all days
    must_attend = {trip.organiser_member_id}
    must_attend.update(trip.required_member_ids)
    
    # Build availability map for all members in trip
    avail_map: Dict[str, Set[date]] = {}
    all_dates: Set[date] = set()
    
    for member_id, member in storage.members.items():
        if member.trip_id == trip_id:
            avail_dates = get_available_dates_set(member_id)
            avail_map[member_id] = avail_dates
            all_dates.update(avail_dates)
    
    if not all_dates:
        return []
    
    # Sort all dates chronologically
    sorted_dates = sorted(all_dates)
    
    # Generate and score all contiguous windows
    candidate_windows = []
    
    for i in range(len(sorted_dates) - window_length + 1):
        window_dates = sorted_dates[i : i + window_length]
        window_set = set(window_dates)
        
        # Check: all must_attend members have availability for all days in window
        all_required_available = True
        for mid in must_attend:
            if mid not in avail_map or not window_set.issubset(avail_map[mid]):
                all_required_available = False
                break
        
        if not all_required_available:
            continue
        
        # Score: count how many total members are available for all days
        score = 0
        for member_id, member_dates in avail_map.items():
            if window_set.issubset(member_dates):
                score += 1
        
        candidate_windows.append({
            'start': window_dates[0],
            'end': window_dates[-1],
            'days': window_dates,
            'score': score
        })
    
    # Sort by score (descending), then start date (ascending) for determinism
    candidate_windows.sort(key=lambda w: (-w['score'], w['start']))
    
    # Format and return top 3
    result = []
    for w in candidate_windows[:3]:
        day_strs = [d.isoformat() for d in w['days']]
        result.append({
            'window': f"{w['start'].isoformat()}..{w['end'].isoformat()}",
            'start': w['start'].isoformat(),
            'end': w['end'].isoformat(),
            'days': day_strs,
            'score': w['score']
        })
    
    return result


def format_window_as_string(window: Dict) -> str:
    """Helper to format window dict as simple string for poll options."""
    return window['window']
