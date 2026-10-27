import logging
import os
import httpx
from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

log = logging.getLogger("uvicorn.error")
router = APIRouter(tags=["voice"])

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SUPPORTED_LANGUAGES = {"hi-IN", "pa-IN", "en-IN"}

@router.post("/voice")
async def voice(
    audio: UploadFile = File(...),
    language: str = Form("hi-IN"),
    lang: str | None = Form(None),  # older clients send "lang"; prefer it when present
):
    language = lang or language
    # Hinglish frontend se "hi-IN" bhejega
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(422, f"unsupported language: {language}")

    data = await audio.read()
    if not data:
        raise HTTPException(422, "audio is empty")

    key = os.getenv("SARVAM_API_KEY")
    if not key:
        # Frontend isi code par Web Speech API fallback use karega
        raise HTTPException(503, "speech service not configured")

    try:
        resp = httpx.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": key},
            files={"file": (audio.filename or "audio.wav", data, audio.content_type or "audio/wav")},
            data={"language_code": language},
            timeout=60,
        )
        resp.raise_for_status()
        text = resp.json().get("transcript", "")
    except Exception as e:
        log.error("voice: STT call failed: %r", e)
        raise HTTPException(502, "Speech service unavailable")

    if not text.strip():
        raise HTTPException(422, "could not hear anything, please say it again")

    return {"text": text}