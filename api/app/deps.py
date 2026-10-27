import os
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.db import User

# AUTH_MODE:
#   "demo" (default) -> trust the X-Demo-User header, auto-create the user.
#                      This is the only auth the app ships with right now, so it
#                      must be ON by default; otherwise every request 401s in prod.
#   anything else    -> refuse (until real OTP/JWT auth lands).
AUTH_MODE = os.getenv("AUTH_MODE", "demo")

def current_user(x_demo_user: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if AUTH_MODE != "demo" and os.getenv("ENV") != "dev":
        raise HTTPException(401, "auth not configured")
    phone = x_demo_user or "9999999999"
    user = db.query(User).filter_by(phone=phone).first()
    if not user:
        user = User(phone=phone, business_name="Demo Shop")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user