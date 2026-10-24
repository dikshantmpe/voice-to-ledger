from app.db import SessionLocal
from app.models.db import Account

ACCOUNTS = [
    ("Cash", "asset"), ("Debtors", "asset"), ("Creditors", "liability"),
    ("Sales", "income"), ("Purchases", "expense"), ("Wages", "expense"),
    ("Rent", "expense"), ("Electricity", "expense"),
]

def run():
    db = SessionLocal()
    try:
        for name, kind in ACCOUNTS:
            if not db.query(Account).filter_by(name=name).first():
                db.add(Account(name=name, type=kind))
        db.commit()
        print("Seeded", len(ACCOUNTS), "accounts")
    finally:
        db.close()

if __name__ == "__main__":
    run()