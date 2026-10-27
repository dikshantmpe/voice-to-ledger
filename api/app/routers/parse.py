import json
import logging
import os
import re
from datetime import date
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from app.models.parsed import ParsedEntry
from app.services.prompt import ACCOUNTS, system_prompt

log = logging.getLogger("uvicorn.error")
router = APIRouter(tags=["parse"])

class ParseIn(BaseModel):
    text: str

# Try these in order; first one that exists on your key wins.
GEMINI_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash"]

@router.post("/parse", response_model=ParsedEntry)
def parse(body: ParseIn):
    if not body.text.strip():
        raise HTTPException(422, "text is empty")

    if os.getenv("PARSE_MOCK") == "1":
        return ParsedEntry(
            entry_date=date.today(), party="Rahul", debit_account="Purchases",
            credit_account="Cash", amount=5000, narration="Raw material payment",
            raw_utterance=body.text, confidence=0.9, needs_review=False,
        )

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(503, "GEMINI_API_KEY not configured on the server")

    chosen = os.getenv("GEMINI_MODEL")
    models_to_try = [chosen] if chosen else GEMINI_CANDIDATES

    last_err = None
    text = None
    for model in models_to_try:
        if not model:
            continue
        try:
            resp = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": gemini_key},
                json={
                    "systemInstruction": {"parts": [{"text": system_prompt()}]},
                    "contents": [{"role": "user", "parts": [{"text": body.text}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
                },
                timeout=60,
            )
            if resp.status_code == 404:
                last_err = f"model {model} not found"
                continue
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            data = json.loads(text)
            break
        except json.JSONDecodeError:
            log.error("parse: LLM returned non-JSON: %r", text[:300] if text else None)
            raise HTTPException(422, "Could not understand, please say it again")
        except HTTPException:
            raise
        except Exception as e:
            last_err = str(e)
            log.error("parse: model %s failed: %r", model, e)
            continue
    else:
        log.error("parse: all models failed. last: %s", last_err)
        raise HTTPException(502, "Extraction service unavailable")

    try:
        entry = ParsedEntry(**{**data, "raw_utterance": body.text})
    except (ValidationError, TypeError):
        raise HTTPException(422, "Could not understand, please say it again")

    if entry.entry_date is None:
        entry.entry_date = date.today()
        entry.needs_review = True
    for account in (entry.debit_account, entry.credit_account):
        if account not in ACCOUNTS:
            entry.needs_review = True
    if entry.amount is None:
        entry.needs_review = True

    return entry