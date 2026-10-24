import json
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.accounting.rules import validate_entry, LedgerError
from app.db import get_db
from app.deps import current_user
from app.models.db import Account, AuditLog, Entry, User

router = APIRouter(prefix="/entries", tags=["entries"])

class EntryIn(BaseModel):
    entry_date: date
    party: str | None = None
    debit_account: str
    credit_account: str
    amount: Decimal | None = None
    narration: str = ""
    raw_utterance: str | None = None
    confidence: float | None = None
    needs_review: bool = False

class EntryPatch(BaseModel):
    entry_date: date | None = None
    party: str | None = None
    debit_account: str | None = None
    credit_account: str | None = None
    amount: Decimal | None = None
    narration: str | None = None

class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entry_date: date
    party: str | None
    debit_account: str
    credit_account: str
    amount: Decimal | None
    narration: str
    status: str
    needs_review: bool
    confidence: float | None

def owned(db: Session, entry_id: int, user: User) -> Entry:
    entry = db.get(Entry, entry_id)
    if not entry or entry.owner_id != user.id:
        raise HTTPException(404, "entry not found")
    return entry

def audit(db: Session, entry_id: int, user_id: int, action: str, detail: dict) -> None:
    db.add(AuditLog(entry_id=entry_id, user_id=user_id, action=action,
                    detail=json.dumps(detail, default=str)))

@router.post("", status_code=201, response_model=EntryOut)
def create_entry(body: EntryIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entry = Entry(owner_id=user.id, status="pending", **body.model_dump())
    db.add(entry)
    db.flush()
    audit(db, entry.id, user.id, "extract", body.model_dump())
    db.commit()
    db.refresh(entry)
    return entry

@router.get("", response_model=list[EntryOut])
def list_entries(status: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    q = db.query(Entry).filter(Entry.owner_id == user.id)
    if status:
        q = q.filter(Entry.status == status)
    return q.order_by(Entry.id.desc()).all()

@router.patch("/{entry_id}", response_model=EntryOut)
def edit_entry(entry_id: int, body: EntryPatch, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entry = owned(db, entry_id, user)
    if entry.status != "pending":
        raise HTTPException(409, "only pending entries can be edited")
    changes = body.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(entry, field, value)
    entry.needs_review = False
    audit(db, entry.id, user.id, "edit", changes)
    db.commit()
    db.refresh(entry)
    return entry

@router.post("/{entry_id}/approve", response_model=EntryOut)
def approve(entry_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entry = owned(db, entry_id, user)
    if entry.status != "pending":
        raise HTTPException(409, "entry is not pending")
    if entry.needs_review:
        raise HTTPException(422, "entry needs review: edit it before approving")
    accounts = {a.name for a in db.query(Account).all()}
    try:
        validate_entry(entry.debit_account, entry.credit_account, entry.amount, accounts)
    except LedgerError as e:
        raise HTTPException(422, str(e))
    entry.status = "approved"
    audit(db, entry.id, user.id, "approve", {"amount": str(entry.amount)})
    db.commit()
    db.refresh(entry)
    return entry

@router.post("/{entry_id}/reject", response_model=EntryOut)
def reject(entry_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entry = owned(db, entry_id, user)
    if entry.status != "pending":
        raise HTTPException(409, "entry is not pending")
    entry.status = "rejected"
    audit(db, entry.id, user.id, "reject", {})
    db.commit()
    db.refresh(entry)
    return entry