import os
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.db import User

def current_user(x_demo_user: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if os.getenv("ENV") != "dev":
        raise HTTPException(401, "auth not configured")
    phone = x_demo_user or "9999999999"
    user = db.query(User).filter_by(phone=phone).first()
    if not user:
        user = User(phone=phone, business_name="Demo Shop")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user