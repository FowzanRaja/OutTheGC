# OutTheGC Backend Test Flow
# Run this after starting: uvicorn app.main:app --reload

$BASE_URL = "http://127.0.0.1:8000"

Write-Host "=== 1. Create Trip ===" -ForegroundColor Green
$createTripResponse = Invoke-RestMethod -Uri "$BASE_URL/trips" -Method Post -ContentType "application/json" -Body (@{
    name = "Spring Break 2026"
    origin = "Toronto, Canada"
    brief = "Adventure trip with mix of cultural experiences and outdoor activities"
    organiser_name = "Sarah"
} | ConvertTo-Json)

$TRIP_ID = $createTripResponse.trip_id
$ORGANISER_ID = $createTripResponse.organiser_member_id
Write-Host "Trip ID: $TRIP_ID"
Write-Host "Organiser ID: $ORGANISER_ID"

Start-Sleep -Seconds 1

Write-Host "`n=== 2. Join Trip (Member 1) ===" -ForegroundColor Green
$joinResponse1 = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/join" -Method Post -ContentType "application/json" -Body (@{
    name = "Mike"
} | ConvertTo-Json)
$MEMBER1_ID = $joinResponse1.member_id
Write-Host "Member 1 ID: $MEMBER1_ID"

Start-Sleep -Seconds 1

Write-Host "`n=== 3. Join Trip (Member 2) ===" -ForegroundColor Green
$joinResponse2 = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/join" -Method Post -ContentType "application/json" -Body (@{
    name = "Emma"
} | ConvertTo-Json)
$MEMBER2_ID = $joinResponse2.member_id
Write-Host "Member 2 ID: $MEMBER2_ID"

Start-Sleep -Seconds 1

Write-Host "`n=== 4. Submit Constraints (Organiser) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/members/$ORGANISER_ID/constraints" -Method Put -ContentType "application/json" -Body (@{
    budget_min = 1000
    budget_max = 2000
    tags = @("adventure", "cultural", "photography")
    must_haves = @("wifi", "good food")
    must_avoids = @("extreme sports")
    sliders = @{
        activity_level = 7
        social_preference = 8
        budget_flexibility = 6
    }
    requests = "Would love to try local cuisine!"
    available_dates = @(
        "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06",
        "2026-02-07", "2026-02-08", "2026-02-09", "2026-02-10",
        "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14"
    )
} | ConvertTo-Json) | Out-Null
Write-Host "Organiser constraints submitted"

Start-Sleep -Seconds 1

Write-Host "`n=== 5. Submit Constraints (Member 1) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/members/$MEMBER1_ID/constraints" -Method Put -ContentType "application/json" -Body (@{
    budget_min = 800
    budget_max = 1500
    tags = @("beach", "relaxation", "nightlife")
    must_haves = @("beach access")
    must_avoids = @("hiking")
    sliders = @{
        activity_level = 5
        social_preference = 9
        budget_flexibility = 7
    }
    available_dates = @(
        "2026-02-05", "2026-02-06", "2026-02-07", "2026-02-08",
        "2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12"
    )
} | ConvertTo-Json) | Out-Null
Write-Host "Member 1 constraints submitted"

Start-Sleep -Seconds 1

Write-Host "`n=== 6. Submit Constraints (Member 2) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/members/$MEMBER2_ID/constraints" -Method Put -ContentType "application/json" -Body (@{
    budget_min = 600
    budget_max = 1200
    tags = @("cultural", "museums", "shopping")
    must_haves = @("comfortable accommodation")
    must_avoids = @()
    sliders = @{
        activity_level = 6
        social_preference = 7
        budget_flexibility = 5
    }
    available_dates = @(
        "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06",
        "2026-02-07", "2026-02-08", "2026-02-09"
    )
} | ConvertTo-Json) | Out-Null
Write-Host "Member 2 constraints submitted"

Start-Sleep -Seconds 1

Write-Host "`n=== 7. Set Required Attendees ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/required-attendees" -Method Put -ContentType "application/json" -Body (@{
    required_member_ids = @($ORGANISER_ID, $MEMBER1_ID)
} | ConvertTo-Json) | Out-Null
Write-Host "Required attendees set"

Start-Sleep -Seconds 1

Write-Host "`n=== 8. Get Trip State (see best windows) ===" -ForegroundColor Green
$tripState = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID" -Method Get
Write-Host "Trip: $($tripState.trip.name)"
Write-Host "Members: $($tripState.members.Count)"
Write-Host "Constraints completion:" ($tripState.constraints_completion | ConvertTo-Json -Depth 3)

Start-Sleep -Seconds 1

Write-Host "`n=== 9. Create Poll (Date Poll) ===" -ForegroundColor Green
$createPollResponse = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/polls" -Method Post -ContentType "application/json" -Body (@{
    created_by_member_id = $ORGANISER_ID
    type = "dates"
    question = "Which date window works best?"
    options = @(
        @{ label = "2026-02-05..2026-02-08" },
        @{ label = "2026-02-06..2026-02-09" },
        @{ label = "2026-02-07..2026-02-10" }
    )
} | ConvertTo-Json -Depth 3)
$POLL_ID = $createPollResponse.poll_id
$OPTION1_ID = $createPollResponse.options[0].id
Write-Host "Poll ID: $POLL_ID"
Write-Host "Option 1 ID: $OPTION1_ID"

Start-Sleep -Seconds 1

Write-Host "`n=== 10. Vote on Poll (Organiser) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/polls/$POLL_ID/vote" -Method Post -ContentType "application/json" -Body (@{
    member_id = $ORGANISER_ID
    option_id = $OPTION1_ID
} | ConvertTo-Json) | Out-Null
Write-Host "Organiser voted"

Start-Sleep -Seconds 1

Write-Host "`n=== 11. Vote on Poll (Member 1) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/polls/$POLL_ID/vote" -Method Post -ContentType "application/json" -Body (@{
    member_id = $MEMBER1_ID
    option_id = $OPTION1_ID
} | ConvertTo-Json) | Out-Null
Write-Host "Member 1 voted"

Start-Sleep -Seconds 1

Write-Host "`n=== 12. Close Poll ===" -ForegroundColor Green
$closedPoll = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/polls/$POLL_ID/close" -Method Post -ContentType "application/json" -Body (@{
    member_id = $ORGANISER_ID
} | ConvertTo-Json)
Write-Host "Poll closed. Total votes: $($closedPoll.total_votes)"

Start-Sleep -Seconds 1

Write-Host "`n=== 13. Generate Options ===" -ForegroundColor Green
$generateResponse = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/generate-options" -Method Post -ContentType "application/json" -Body (@{
    created_by_member_id = $ORGANISER_ID
    duration_days = 4
} | ConvertTo-Json)
Write-Host "Plan Version: $($generateResponse.version_num)"
Write-Host "Options Generated: $($generateResponse.options.Count)"
Write-Host "Warning: $($generateResponse.warning)"
$OPTION_ID = $generateResponse.options[0].id
Write-Host "First Option ID: $OPTION_ID"

Start-Sleep -Seconds 1

Write-Host "`n=== 14. Submit Feedback (Member 1) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/options/$OPTION_ID/feedback" -Method Post -ContentType "application/json" -Body (@{
    member_id = $MEMBER1_ID
    rating = 4
    disliked_activity_ids = @()
    comment = "Looks great! Just a bit over budget for me."
} | ConvertTo-Json) | Out-Null
Write-Host "Member 1 feedback submitted"

Start-Sleep -Seconds 1

Write-Host "`n=== 15. Submit Feedback (Member 2) ===" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/options/$OPTION_ID/feedback" -Method Post -ContentType "application/json" -Body (@{
    member_id = $MEMBER2_ID
    rating = 5
    disliked_activity_ids = @()
    comment = "Perfect! Love the cultural activities."
} | ConvertTo-Json) | Out-Null
Write-Host "Member 2 feedback submitted"

Start-Sleep -Seconds 1

Write-Host "`n=== 16. Rerun Options (with feedback) ===" -ForegroundColor Green
$rerunResponse = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID/rerun-options" -Method Post -ContentType "application/json" -Body (@{
    created_by_member_id = $ORGANISER_ID
} | ConvertTo-Json)
Write-Host "New Plan Version: $($rerunResponse.version_num)"
Write-Host "Feedback Considered: $($rerunResponse.feedback_considered.total_feedback) items"

Start-Sleep -Seconds 1

Write-Host "`n=== 17. Final Trip State ===" -ForegroundColor Green
$finalState = Invoke-RestMethod -Uri "$BASE_URL/trips/$TRIP_ID" -Method Get
Write-Host "Trip: $($finalState.trip.name)"
Write-Host "Members: $($finalState.members.Count)"
Write-Host "Polls: $($finalState.polls.Count)"
Write-Host "Latest Plan Version: $($finalState.latest_plan.version_num)"
Write-Host "Feedback Count: $($finalState.feedback_summary.total_count)"

Write-Host "`n=== All Tests Complete! ===" -ForegroundColor Cyan
Write-Host "Trip ID: $TRIP_ID"
Write-Host "Access at: http://127.0.0.1:8000/docs"
