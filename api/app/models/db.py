from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, Text, Boolean, Float, DateTime, Date, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(15), unique=True)
    business_name: Mapped[str | None] = mapped_column(String(120))

class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    type: Mapped[str] = mapped_column(String(16))

class Entry(Base):
    __tablename__ = "entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(index=True)
    entry_date: Mapped[date] = mapped_column(Date)
    party: Mapped[str | None] = mapped_column(String(120))
    debit_account: Mapped[str] = mapped_column(String(64))
    credit_account: Mapped[str] = mapped_column(String(64))
    amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    narration: Mapped[str] = mapped_column(Text, default="")
    raw_utterance: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float | None] = mapped_column(Float)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    entry_id: Mapped[int | None] = mapped_column(index=True)
    user_id: Mapped[int] = mapped_column()
    action: Mapped[str] = mapped_column(String(32))
    detail: Mapped[str] = mapped_column(Text, default="{}")
    at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())