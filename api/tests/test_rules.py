from decimal import Decimal
import pytest
from app.accounting.rules import validate_entry, LedgerError

ACCTS = {"Cash", "Purchases", "Sales"}

def test_valid_entry_passes():
    validate_entry("Purchases", "Cash", Decimal("5000"), ACCTS)

@pytest.mark.parametrize("amount", [None, Decimal("0"), Decimal("-10")])
def test_bad_amount_fails(amount):
    with pytest.raises(LedgerError):
        validate_entry("Purchases", "Cash", amount, ACCTS)

def test_unknown_debit_fails():
    with pytest.raises(LedgerError):
        validate_entry("Rent", "Cash", Decimal("100"), ACCTS)

def test_unknown_credit_fails():
    with pytest.raises(LedgerError):
        validate_entry("Purchases", "Bank", Decimal("100"), ACCTS)

def test_same_account_fails():
    with pytest.raises(LedgerError):
        validate_entry("Cash", "Cash", Decimal("100"), ACCTS)