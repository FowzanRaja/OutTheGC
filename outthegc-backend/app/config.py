import os
from pathlib import Path

try:
	from dotenv import load_dotenv
except ImportError:  # Optional dependency
	load_dotenv = None

if load_dotenv:
	env_path = Path(__file__).resolve().parents[1] / ".env"
	load_dotenv(dotenv_path=env_path)

# Environment flags
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() in ("1", "true", "yes")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")
