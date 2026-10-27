import os
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db import engine
from app.routers import entries, ledger, parse, voice

if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=0.0)

# ---------------------------------------------------------------------------
# CORS
# ALLOWED_ORIGINS env var wins if set (comma-separated).
# If not set, these defaults keep the API reachable so a forgotten env var
# can never break the frontend again.
# ---------------------------------------------------------------------------
DEFAULT_ORIGINS = [
    "https://voice-to-ledger-vercel.app",   # production frontend
    "https://voice-to-ledger.vercel.app",   # in case the Vercel URL differs
    "http://localhost:3000",                # Next.js local dev
    "http://127.0.0.1:3000",
    "http://localhost",                     # Capacitor Android webview
    "https://localhost",                    # Capacitor iOS webview
]

_origins_env = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOW_ORIGINS = _origins_env or DEFAULT_ORIGINS
print("CORS allowed origins:", ALLOW_ORIGINS)   # visible in Render logs

app = FastAPI(title="VoxLedger API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app$",  # any Vercel preview URL
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}

app.include_router(entries.router)
app.include_router(ledger.router)
app.include_router(parse.router)
app.include_router(voice.router)