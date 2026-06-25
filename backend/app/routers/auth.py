import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.dependencies import get_current_user
from app.services.auth_service import (
    build_google_auth_url,
    exchange_google_code,
    verify_google_id_token,
    create_access_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

REDIRECT_URI = f"{BACKEND_URL}/auth/google/callback"


@router.get("/google")
async def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured — set GOOGLE_CLIENT_ID in .env")
    state = secrets.token_urlsafe(32)
    auth_url = build_google_auth_url(GOOGLE_CLIENT_ID, REDIRECT_URI, state)
    redirect = RedirectResponse(url=auth_url)
    redirect.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        secure=ENVIRONMENT != "development",
        max_age=600,
    )
    return redirect


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state — possible CSRF")

    try:
        token_data = await exchange_google_code(
            code=code,
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            redirect_uri=REDIRECT_URI,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange OAuth code: {e}")

    try:
        google_user = verify_google_id_token(token_data["id_token"], GOOGLE_CLIENT_ID)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to verify Google token: {e}")

    google_id = google_user["sub"]
    email = google_user.get("email", "")
    name = google_user.get("name", email)
    avatar_url = google_user.get("picture")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(google_id=google_id, email=email, name=name, avatar_url=avatar_url)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.name = name
        user.avatar_url = avatar_url
        await db.commit()

    access_token = create_access_token(user.id)
    redirect = RedirectResponse(url=f"{FRONTEND_URL}/dashboard")
    redirect.delete_cookie("oauth_state")
    redirect.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=ENVIRONMENT != "development",
        max_age=7 * 24 * 3600,
    )
    return redirect


@router.get("/me", response_model=UserResponse | None)
async def get_me(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        from app.services.auth_service import decode_access_token
        payload = decode_access_token(token)
        user = await db.get(User, payload.get("sub"))
        return user
    except Exception:
        return None


@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie("access_token", samesite="lax")
    return {"message": "Logged out"}
