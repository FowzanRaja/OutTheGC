#!/bin/bash
# OutTheGC Backend Test Flow (curl version)
# Run this after starting: uvicorn app.main:app --reload

BASE_URL="http://127.0.0.1:8000"

echo "=== 1. Create Trip ==="
CREATE_TRIP=$(curl -s -X POST "$BASE_URL/trips" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Break 2026",
    "origin": "Toronto, Canada",
    "brief": "Adventure trip with mix of cultural experiences",
    "organiser_name": "Sarah"
  }')
TRIP_ID=$(echo $CREATE_TRIP | jq -r '.trip_id')
ORGANISER_ID=$(echo $CREATE_TRIP | jq -r '.organiser_member_id')
echo "Trip ID: $TRIP_ID"
echo "Organiser ID: $ORGANISER_ID"
sleep 1

echo -e "\n=== 2. Join Trip (Member 1) ==="
JOIN1=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mike"}')
MEMBER1_ID=$(echo $JOIN1 | jq -r '.member_id')
echo "Member 1 ID: $MEMBER1_ID"
sleep 1

echo -e "\n=== 3. Join Trip (Member 2) ==="
JOIN2=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"name": "Emma"}')
MEMBER2_ID=$(echo $JOIN2 | jq -r '.member_id')
echo "Member 2 ID: $MEMBER2_ID"
sleep 1

echo -e "\n=== 4. Submit Constraints (Organiser) ==="
curl -s -X PUT "$BASE_URL/trips/$TRIP_ID/members/$ORGANISER_ID/constraints" \
  -H "Content-Type: application/json" \
  -d '{
    "budget_min": 1000,
    "budget_max": 2000,
    "tags": ["adventure", "cultural"],
    "must_haves": ["wifi"],
    "must_avoids": ["extreme sports"],
    "sliders": {"activity_level": 7},
    "available_dates": [
      "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06",
      "2026-02-07", "2026-02-08", "2026-02-09", "2026-02-10"
    ]
  }' > /dev/null
echo "Organiser constraints submitted"
sleep 1

echo -e "\n=== 5. Submit Constraints (Member 1) ==="
curl -s -X PUT "$BASE_URL/trips/$TRIP_ID/members/$MEMBER1_ID/constraints" \
  -H "Content-Type: application/json" \
  -d '{
    "budget_min": 800,
    "budget_max": 1500,
    "tags": ["beach", "relaxation"],
    "must_haves": ["beach access"],
    "must_avoids": [],
    "sliders": {"activity_level": 5},
    "available_dates": [
      "2026-02-05", "2026-02-06", "2026-02-07", "2026-02-08"
    ]
  }' > /dev/null
echo "Member 1 constraints submitted"
sleep 1

echo -e "\n=== 6. Set Required Attendees ==="
curl -s -X PUT "$BASE_URL/trips/$TRIP_ID/required-attendees" \
  -H "Content-Type: application/json" \
  -d "{\"required_member_ids\": [\"$ORGANISER_ID\", \"$MEMBER1_ID\"]}" > /dev/null
echo "Required attendees set"
sleep 1

echo -e "\n=== 7. Create Poll ==="
CREATE_POLL=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/polls" \
  -H "Content-Type: application/json" \
  -d "{
    \"created_by_member_id\": \"$ORGANISER_ID\",
    \"type\": \"dates\",
    \"question\": \"Which date window works best?\",
    \"options\": [
      {\"label\": \"2026-02-05..2026-02-08\"},
      {\"label\": \"2026-02-06..2026-02-09\"}
    ]
  }")
POLL_ID=$(echo $CREATE_POLL | jq -r '.poll_id')
OPTION1_ID=$(echo $CREATE_POLL | jq -r '.options[0].id')
echo "Poll ID: $POLL_ID"
sleep 1

echo -e "\n=== 8. Vote on Poll ==="
curl -s -X POST "$BASE_URL/trips/$TRIP_ID/polls/$POLL_ID/vote" \
  -H "Content-Type: application/json" \
  -d "{\"member_id\": \"$ORGANISER_ID\", \"option_id\": \"$OPTION1_ID\"}" > /dev/null
echo "Vote submitted"
sleep 1

echo -e "\n=== 9. Close Poll ==="
curl -s -X POST "$BASE_URL/trips/$TRIP_ID/polls/$POLL_ID/close" \
  -H "Content-Type: application/json" \
  -d "{\"member_id\": \"$ORGANISER_ID\"}" > /dev/null
echo "Poll closed"
sleep 1

echo -e "\n=== 10. Generate Options ==="
GENERATE=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/generate-options" \
  -H "Content-Type: application/json" \
  -d "{\"created_by_member_id\": \"$ORGANISER_ID\"}")
VERSION=$(echo $GENERATE | jq -r '.version_num')
OPTION_ID=$(echo $GENERATE | jq -r '.options[0].id')
echo "Plan Version: $VERSION"
echo "Option ID: $OPTION_ID"
sleep 1

echo -e "\n=== 11. Submit Feedback ==="
curl -s -X POST "$BASE_URL/trips/$TRIP_ID/options/$OPTION_ID/feedback" \
  -H "Content-Type: application/json" \
  -d "{
    \"member_id\": \"$MEMBER1_ID\",
    \"rating\": 4,
    \"disliked_activity_ids\": [],
    \"comment\": \"Looks great!\"
  }" > /dev/null
echo "Feedback submitted"
sleep 1

echo -e "\n=== 12. Rerun Options ==="
RERUN=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/rerun-options" \
  -H "Content-Type: application/json" \
  -d "{\"created_by_member_id\": \"$ORGANISER_ID\"}")
NEW_VERSION=$(echo $RERUN | jq -r '.version_num')
echo "New Plan Version: $NEW_VERSION"

echo -e "\n=== All Tests Complete! ==="
echo "Trip ID: $TRIP_ID"
echo "Access API docs at: http://127.0.0.1:8000/docs"
