import os

# Environment flags
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() in ("1", "true", "yes")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
