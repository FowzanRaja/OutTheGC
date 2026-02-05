# OutTheGC (Out the Group Chat)

OutTheGC helps groups actually book a trip instead of endlessly debating in the group chat.
It turns messy “where/when/what vibe?” conversations into quick polls and clear decisions — then uses your group’s answers as context for AI-assisted planning.

Built for collaborative trips: one shared dashboard, simple voting, and a trip brief the AI can use.

## What it does

- Create a trip + invite friends
- Set a trip brief (the “context” for planning — budget, vibes, must-dos, constraints)
- Run polls to make decisions fast, including:
	- Single choice (pick one)
	- Multiple choice (pick many)
	- Preference slider (a spectrum, e.g. Busy town ↔ Countryside)
	- Dates (availability within a window)
- See results update quickly (“live-ish” refresh)
- Member list + role badges (organiser/member)

YouTube demo: https://youtu.be/JH8HRHUFkDs

## Why it exists (the pitch)

Group trips usually fail for one reason: no structure.
Everyone has different budgets, dates, and preferences — and the group chat turns into 200 messages and zero decisions.

OutTheGC gives the group a single place to decide where to go, when to go, and what kind of trip you’re actually planning — so the plan finally leaves the chat.

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, React Router
- Backend: FastAPI (Python), in-memory storage (hackathon-simple, no DB)

## Repo Structure

- outthegc-frontend/ — React UI
- outthegc-backend/ — FastAPI API
- Images/ — design assets + screenshots

## Quick Start

### Backend (FastAPI)

1. (Recommended) Create + activate a virtual environment
2. Install deps:

```
pip install fastapi uvicorn
```

Run:

```
python -m uvicorn app.main:app --reload
```

API: http://localhost:8000
Docs: http://localhost:8000/docs

### Frontend (React)

Install:

```
npm install
```

Start:

```
npm run dev
```

UI: http://localhost:5173

## API Overview (Core Endpoints)

### Trips

Get trip state

GET /trips/{trip_id}

Returns trip details, members, polls, and votes.

### Polls

Create poll

POST /trips/{trip_id}/polls

Types:

single / multi
Requires options[] (min 2)

slider
Requires:

```
{
	"slider": { "left_label": "...", "right_label": "...", "min?": 0, "max?": 100, "step?": 1 }
}
```

dates
Requires:

```
{ "date_window": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } }
```

Vote

POST /trips/{trip_id}/polls/{poll_id}/vote

Payload depends on type:

single / multi: option_id

slider: value

dates: start_date, end_date

## Notes / Limitations

- CORS is set up for http://localhost:5173
- Storage is in-memory by default — restarting backend clears everything
- This is intentional for hackathon speed; DB can be added later if needed

## Licence

Private project (internal use)
