import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from config import get_settings

settings = get_settings()

VERIFICATION_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _save_file(file: UploadFile, subdirectory: str, allowed_types: set[str], max_mb: int) -> str:
    """
    Shared save logic. subdirectory keeps different upload kinds
    (verifications, event covers) physically separated on disk, so
    admin-only documents and public images never end up in the same
    folder even though they go through the same underlying function.
    """
    if file.content_type not in allowed_types:
        raise HTTPException(400, f"File type not allowed. Accepted: {', '.join(sorted(allowed_types))}")

    contents = await file.read()
    max_bytes = max_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(400, f"File must be under {max_mb}MB")

    upload_path = Path(settings.upload_dir).parent / subdirectory
    upload_path.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename or "").suffix or ".bin"
    stored_filename = f"{uuid.uuid4()}{extension}"
    full_path = upload_path / stored_filename

    with open(full_path, "wb") as f:
        f.write(contents)

    return str(full_path)


async def save_verification_document(file: UploadFile) -> str:
    return await _save_file(
        file, subdirectory="verifications",
        allowed_types=VERIFICATION_CONTENT_TYPES, max_mb=settings.max_upload_size_mb,
    )


async def save_event_cover_image(file: UploadFile) -> str:
    return await _save_file(
        file, subdirectory="event_covers",
        allowed_types=IMAGE_CONTENT_TYPES, max_mb=5,
    )