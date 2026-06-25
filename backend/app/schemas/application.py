from datetime import datetime, date
from pydantic import BaseModel, ConfigDict
from app.models.application import ApplicationStatus
from app.schemas.document import DocumentBrief


class ApplicationCreate(BaseModel):
    company: str
    title: str
    status: ApplicationStatus = ApplicationStatus.applied
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    date_applied: date | None = None
    job_url: str | None = None
    company_logo_url: str | None = None
    job_description: str | None = None
    responsibilities: str | None = None
    requirements: str | None = None
    nice_to_haves: str | None = None
    notes: str | None = None
    resume_id: str | None = None
    cover_letter_id: str | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    title: str | None = None
    status: ApplicationStatus | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    date_applied: date | None = None
    job_url: str | None = None
    company_logo_url: str | None = None
    job_description: str | None = None
    responsibilities: str | None = None
    requirements: str | None = None
    nice_to_haves: str | None = None
    notes: str | None = None
    resume_id: str | None = None
    cover_letter_id: str | None = None


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResult(BaseModel):
    company: str | None = None
    title: str | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    job_description: str | None = None
    responsibilities: str | None = None
    requirements: str | None = None
    nice_to_haves: str | None = None
    company_logo_url: str | None = None
    job_url: str | None = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    company: str
    title: str
    status: ApplicationStatus
    location: str | None
    salary_min: int | None
    salary_max: int | None
    date_applied: date | None
    job_url: str | None
    company_logo_url: str | None
    job_description: str | None
    responsibilities: str | None
    requirements: str | None
    nice_to_haves: str | None
    notes: str | None
    resume_id: str | None
    cover_letter_id: str | None
    resume: DocumentBrief | None
    cover_letter: DocumentBrief | None
    created_at: datetime
    updated_at: datetime
