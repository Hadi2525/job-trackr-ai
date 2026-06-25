import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentType
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.dependencies import get_current_user
from app.services.pdf_service import markdown_to_pdf
from google import genai
from google.genai import types as genai_types

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    type: DocumentType | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Document).where(Document.user_id == current_user.id)
    if type:
        stmt = stmt.where(Document.type == type)
    stmt = stmt.order_by(Document.updated_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=DocumentResponse, status_code=201)
async def create_document(
    data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = Document(**data.model_dump(), user_id=current_user.id)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(doc, field, value)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()


@router.post("/{doc_id}/export-pdf")
async def export_pdf(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        pdf_bytes = markdown_to_pdf(doc.content_md)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
    filename = doc.name.replace(" ", "_") + ".pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{doc_id}/review")
async def review_cover_letter(
    doc_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured — set GEMINI_API_KEY in .env")

    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.type != DocumentType.cover_letter:
        raise HTTPException(status_code=400, detail="Document is not a cover letter")

    job_description = body.get("job_description", "")

    system_prompt = """You are an expert career coach and professional writer specializing in job applications.
Review the cover letter provided and give specific, actionable feedback. Structure your response with these sections:
## Overall Assessment
## Strengths
## Areas to Improve
## Keyword & Relevance Analysis (vs the job description, if provided)
## Suggested Rewrites
Be direct, specific, and constructive. Reference specific lines from the cover letter."""

    user_content = f"**Cover Letter:**\n\n{doc.content_md}"
    if job_description:
        user_content += f"\n\n**Job Description:**\n\n{job_description}"

    client = genai.Client(api_key=GEMINI_API_KEY)

    def generate():
        for chunk in client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=user_content,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=2048,
            ),
        ):
            if chunk.text:
                yield f"data: {chunk.text}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
