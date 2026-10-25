from datetime import date
from decimal import Decimal
from pydantic import BaseModel

class ParsedEntry(BaseModel):
    entry_date: date | None = None
    party: str | None = None
    debit_account: str | None = None
    credit_account: str | None = None
    amount: Decimal | None = None
    narration: str = ""
    raw_utterance: str | None = None
    confidence: float = 0.0
    needs_review: bool = True