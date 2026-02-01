from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import trips, polls, ai, feedback

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router)
app.include_router(trips.router)
app.include_router(polls.router)
app.include_router(feedback.router)

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "OutTheGC API",
        "health": "/health",
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
