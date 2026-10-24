import csv
import io
from decimal import Decimal
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models.db import Entry, User

router = APIRouter(prefix="/ledger", tags=["ledger"])

def approved_rows(db: Session, user: User) -> list[Entry]:
    return (db.query(Entry)
            .filter(Entry.owner_id == user.id, Entry.status == "approved")
            .order_by(Entry.entry_date, Entry.id)
            .all())

@router.get("")
def get_ledger(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = approved_rows(db, user)
    total_debit = sum((r.amount for r in rows), Decimal("0"))
    total_credit = sum((r.amount for r in rows), Decimal("0"))
    return {
        "entries": [{
            "id": r.id, "entry_date": r.entry_date, "party": r.party,
            "debit_account": r.debit_account, "credit_account": r.credit_account,
            "amount": r.amount, "narration": r.narration,
        } for r in rows],
        "total_debit": total_debit,
        "total_credit": total_credit,
        "balanced": total_debit == total_credit,
    }

@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db), user: User = Depends(current_user)):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["date", "party", "debit_account", "credit_account", "amount", "narration"])
    for r in approved_rows(db, user):
        writer.writerow([r.entry_date, r.party or "", r.debit_account, r.credit_account, r.amount, r.narration])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=ledger.csv"})