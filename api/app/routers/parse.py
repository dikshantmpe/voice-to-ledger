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

@router.post("/parse", response_model=ParsedEntry)
def parse(body: ParseIn):
    if not body.text.strip():
        raise HTTPException(422, "text is empty")

    # Mock mode: PARSE_MOCK=1 in .env returns a fixed sample, no LLM call
    if os.getenv("PARSE_MOCK") == "1":
        return ParsedEntry(
            entry_date=date.today(), party="Rahul", debit_account="Purchases",
            credit_account="Cash", amount=5000, narration="Raw material payment",
            raw_utterance=body.text, confidence=0.9, needs_review=False,
        )

    xai_key = os.getenv("XAI_API_KEY")
    if not xai_key:
        raise HTTPException(503, "XAI_API_KEY not configured on the server")

    try:
        resp = httpx.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {xai_key}"},
            json={
                "model": os.getenv("XAI_MODEL", "grok-beta"),
                "messages": [
                    {"role": "system", "content": system_prompt()},
                    {"role": "user", "content": body.text},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0,
            },
            timeout=60,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"]
        # Grok can wrap JSON in ```json fences even with response_format set
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
        data = json.loads(text)
    except json.JSONDecodeError:
        log.error("parse: LLM returned non-JSON: %r", text[:300])
        raise HTTPException(422, "Could not understand, please say it again")
    except HTTPException:
        raise
    except Exception as e:
        log.error("parse: LLM call failed: %r", e)
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