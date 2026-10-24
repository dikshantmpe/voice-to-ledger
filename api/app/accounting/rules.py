from decimal import Decimal

class LedgerError(ValueError):
    pass

def validate_entry(debit: str, credit: str, amount: Decimal | None, accounts: set[str]) -> None:
    if amount is None or amount <= 0:
        raise LedgerError("amount must be a positive number")
    if debit not in accounts:
        raise LedgerError(f"unknown debit account: {debit}")
    if credit not in accounts:
        raise LedgerError(f"unknown credit account: {credit}")
    if debit == credit:
        raise LedgerError("debit and credit cannot be the same account")