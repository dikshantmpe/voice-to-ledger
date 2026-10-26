import json
import os
from datetime import date
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from app.models.parsed import ParsedEntry
from app.services.prompt import ACCOUNTS, system_prompt

router = APIRouter(tags=["parse"])

class ParseIn(BaseModel):
    text: str

@router.post("/parse", response_model=ParsedEntry)
def parse(body: ParseIn):
    if not body.text.strip():
        raise HTTPException(422, "text is empty")

    # Mock mode: PARSE_MOCK=1 in .env returns a fixed sample, no Gemini call
    if os.getenv("PARSE_MOCK") == "1":
        return ParsedEntry(
            entry_date=date.today(), party="Rahul", debit_account="Purchases",
            credit_account="Cash", amount=5000, narration="Raw material payment",
            raw_utterance=body.text, confidence=0.9, needs_review=False,
        )

    try:
        resp = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')}:generateContent",
            params={"key": os.getenv("GEMINI_API_KEY")},
            json={
                "systemInstruction": {"parts": [{"text": system_prompt()}]},
                "contents": [{"role": "user", "parts": [{"text": body.text}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
            },
            timeout=60,
        )
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(422, "Could not understand, please say it again")
    except Exception as e:
        print("LLM ERROR:", repr(e))
        raise HTTPException(502, "Extraction service unavailable")

    try:
        entry = ParsedEntry(**{**data, "raw_utterance": body.text})
    except (ValidationError, TypeError):
        raise HTTPException(422, "Could not understand, please say it again")

    # Backend safety checks: anything unclear goes to review
    if entry.entry_date is None:
        entry.entry_date = date.today()
        entry.needs_review = True
    for account in (entry.debit_account, entry.credit_account):
        if account not in ACCOUNTS:
            entry.needs_review = True
    if entry.amount is None:
        entry.needs_review = True

    return entry