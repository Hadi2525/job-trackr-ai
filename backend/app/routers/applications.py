import os
import re
import json
import asyncio
import traceback
import httpx
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc
from google import genai
from google.genai import types as genai_types
from app.database import get_db
from app.models.user import User
from app.models.application import JobApplication, ApplicationStatus
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    ScrapeRequest, ScrapeResult,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


@router.get("", response_model=list[ApplicationResponse])
async def list_applications(
    status: ApplicationStatus | None = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_sort = {"created_at", "updated_at", "date_applied", "company", "title", "status"}
    if sort not in allowed_sort:
        sort = "created_at"

    stmt = select(JobApplication).where(JobApplication.user_id == current_user.id)
    if status:
        stmt = stmt.where(JobApplication.status == status)

    col = getattr(JobApplication, sort)
    stmt = stmt.order_by(desc(col) if order == "desc" else asc(col))

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/scrape", response_model=ScrapeResult)
async def scrape_job_posting(
    body: ScrapeRequest,
    current_user: User = Depends(get_current_user),
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    url = body.url.strip()

    # Fetch page HTML
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch URL: {e}")

    # Parse HTML
    soup = BeautifulSoup(html, "lxml")

    # --- Logo extraction (before stripping scripts) ---
    logo_url: str | None = None

    # 1. JSON-LD structured data — job boards embed hiringOrganization.logo
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            ld = json.loads(script.string or "")
            items = ld if isinstance(ld, list) else [ld]
            for item in items:
                org = item.get("hiringOrganization") or item.get("Organization") or {}
                if isinstance(org, dict):
                    raw_logo = org.get("logo")
                    if isinstance(raw_logo, str) and raw_logo.startswith("http"):
                        logo_url = raw_logo
                    elif isinstance(raw_logo, dict):
                        logo_url = raw_logo.get("url") or raw_logo.get("contentUrl")
                if logo_url:
                    break
        except Exception:
            pass
        if logo_url:
            break

    # 2. Placeholder — will be replaced below once Gemini returns company_domain

    # Strip HTML to readable text
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    # Trim to ~12k chars to stay within token budget
    text = text[:12000]

    # Ask Gemini to extract structured job data
    prompt = f"""Extract job posting information from the text below and return ONLY a valid JSON object.
Use null for any field you cannot find. For salary fields use annual integers (e.g. 95000), not strings.
For responsibilities, requirements, and nice_to_haves use plain bullet-point text with each point on a new line starting with "- ".
For company_domain, return ONLY the bare domain of the hiring company's own website (e.g. "google.com", "amazon.com", "lovehoney.com") — NOT the job board domain. Use your knowledge of the company if needed. Return null if unknown.

Return exactly this JSON shape:
{{
  "company": "company name",
  "company_domain": "companydomain.com",
  "title": "job title",
  "location": "city and province/state, or Remote, or Hybrid",
  "salary_min": null,
  "salary_max": null,
  "job_description": "full job description as plain text",
  "responsibilities": "- point one\\n- point two",
  "requirements": "- point one\\n- point two",
  "nice_to_haves": "- point one\\n- point two"
}}

Job posting text:
{text}"""

    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        config = genai_types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=8192,
        )

        def _call_gemini(model: str):
            return gemini_client.models.generate_content(
                model=model, contents=prompt, config=config,
            )

        # Try the latest model first; fall back to 2.0-flash on 503 overload
        response = None
        last_error = None
        for model in ["gemini-2.5-flash", "gemini-2.5-flash-lite"]:
            try:
                response = await asyncio.get_event_loop().run_in_executor(
                    None, lambda m=model: _call_gemini(m)
                )
                break
            except Exception as e:
                last_error = e
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    continue
                raise

        if response is None:
            raise last_error  # type: ignore[misc]

        raw = response.text
        if not raw:
            raise ValueError(
                f"Gemini returned empty response. "
                f"Finish reason: {response.candidates[0].finish_reason if response.candidates else 'unknown'}"
            )

        # Strip markdown code fences in case the model wraps the JSON
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {e}")

    company_name: str | None = data.get("company")
    company_domain: str | None = data.get("company_domain")

    # Prefer the company's own domain for Brandfetch over the job-board domain
    if not logo_url:
        domain_for_logo = company_domain or None
        if domain_for_logo:
            logo_url = f"https://cdn.brandfetch.io/{domain_for_logo}"

    return ScrapeResult(
        company=company_name,
        title=data.get("title"),
        location=data.get("location"),
        salary_min=data.get("salary_min"),
        salary_max=data.get("salary_max"),
        job_description=data.get("job_description"),
        responsibilities=data.get("responsibilities"),
        requirements=data.get("requirements"),
        nice_to_haves=data.get("nice_to_haves"),
        company_logo_url=logo_url,
        job_url=url,
    )


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = JobApplication(**data.model_dump(), user_id=current_user.id)
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = await db.get(JobApplication, app_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: str,
    data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = await db.get(JobApplication, app_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    await db.commit()
    await db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=204)
async def delete_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = await db.get(JobApplication, app_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()
