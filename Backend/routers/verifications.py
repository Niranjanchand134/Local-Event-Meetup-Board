from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import require_admin, require_organizer
from core.storage import save_verification_document
from database import get_db
from models.enums import VerificationStatus
from models.organizer_verification import OrganizerVerification
from models.user import User
from schemas.verification import (
    VerificationAdminOut,
    VerificationOut,
    VerificationReviewRequest,
    VerificationStatsOut,
    VerificationSubmitRequest,
    verification_form,
)

router = APIRouter(prefix="/verifications", tags=["verifications"])


# ---------- Organizer-facing routes ----------

@router.post("/apply", response_model=VerificationOut, status_code=201)
async def apply_for_verification(
    form_data: VerificationSubmitRequest = Depends(verification_form),
    document: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    existing = await db.execute(
        select(OrganizerVerification)
        .where(
            OrganizerVerification.user_id == current_user.id,
            OrganizerVerification.status == VerificationStatus.pending,
        )
        .order_by(OrganizerVerification.submitted_at.desc())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "You already have an application under review")

    file_path = await save_verification_document(document)

    verification = OrganizerVerification(
        user_id=current_user.id,
        full_legal_name=form_data.full_legal_name,
        date_of_birth=form_data.date_of_birth,
        address=form_data.address,
        document_type=form_data.document_type,
        document_number=form_data.document_number,
        document_file_path=file_path,
        status=VerificationStatus.pending,
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)

    return verification


@router.get("/me", response_model=VerificationOut)
async def my_latest_verification(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    result = await db.execute(
        select(OrganizerVerification)
        .where(OrganizerVerification.user_id == current_user.id)
        .order_by(OrganizerVerification.submitted_at.desc())
        .limit(1)
    )
    verification = result.scalar_one_or_none()

    if verification is None:
        raise HTTPException(404, "No verification application submitted yet")

    return verification


# ---------- Admin-facing routes ----------

@router.get("/admin/stats", response_model=VerificationStatsOut)
async def get_verification_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    pending_count = await db.scalar(
        select(func.count(OrganizerVerification.id)).where(
            OrganizerVerification.status == VerificationStatus.pending
        )
    ) or 0

    approved_count = await db.scalar(
        select(func.count(OrganizerVerification.id)).where(
            OrganizerVerification.status == VerificationStatus.approved
        )
    ) or 0

    rejected_count = await db.scalar(
        select(func.count(OrganizerVerification.id)).where(
            OrganizerVerification.status == VerificationStatus.rejected
        )
    ) or 0

    total_count = pending_count + approved_count + rejected_count

    return VerificationStatsOut(
        pending=pending_count,
        approved=approved_count,
        rejected=rejected_count,
        total=total_count,
    )


@router.get("/admin/all", response_model=list[VerificationAdminOut])
async def list_all_verifications(
    status: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stmt = select(OrganizerVerification)

    if status and status in ["pending", "approved", "rejected"]:
        stmt = stmt.where(OrganizerVerification.status == VerificationStatus(status))

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                OrganizerVerification.full_legal_name.ilike(term),
                OrganizerVerification.document_number.ilike(term),
                OrganizerVerification.address.ilike(term),
            )
        )

    stmt = stmt.order_by(OrganizerVerification.submitted_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/admin/pending", response_model=list[VerificationAdminOut])
async def list_pending_verifications(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(OrganizerVerification)
        .where(OrganizerVerification.status == VerificationStatus.pending)
        .order_by(OrganizerVerification.submitted_at.asc())
    )
    return result.scalars().all()


@router.get("/admin/{verification_id}", response_model=VerificationAdminOut)
async def get_verification_detail(
    verification_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    verification = await db.get(OrganizerVerification, verification_id)
    if verification is None:
        raise HTTPException(404, "Verification application not found")
    return verification


@router.get("/admin/{verification_id}/document")
async def get_verification_document(
    verification_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    verification = await db.get(OrganizerVerification, verification_id)
    if verification is None:
        raise HTTPException(404, "Verification application not found")

    return FileResponse(verification.document_file_path)


@router.post("/admin/{verification_id}/review", response_model=VerificationAdminOut)
async def review_verification(
    verification_id: str,
    payload: VerificationReviewRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    verification = await db.get(OrganizerVerification, verification_id)
    if verification is None:
        raise HTTPException(404, "Verification application not found")

    if verification.status != VerificationStatus.pending:
        raise HTTPException(400, "This application has already been reviewed")

    verification.status = (
        VerificationStatus.approved if payload.decision == "approved" else VerificationStatus.rejected
    )
    verification.admin_note = payload.admin_note
    verification.reviewed_at = datetime.now(timezone.utc)
    verification.reviewed_by = admin.id

    if payload.decision == "approved":
        organizer = await db.get(User, verification.user_id)
        if organizer:
            organizer.is_verified_organizer = True

    await db.commit()
    await db.refresh(verification)

    return verification