import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from config import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}


async def save_verification_document(file: UploadFile) -> str:
    """
    Saves an uploaded document and returns a path reference to store in
    the DB. This is the ONLY function that knows the storage is local
    disk — swapping to S3 later means rewriting this function to upload
    to a bucket and return an object key instead, with every caller
    (the apply endpoint) unchanged.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Document must be a PDF, JPG, or PNG")

    contents = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(400, f"Document must be under {settings.max_upload_size_mb}MB")

    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename or "").suffix or ".bin"
    stored_filename = f"{uuid.uuid4()}{extension}"
    full_path = upload_path / stored_filename

    with open(full_path, "wb") as f:
        f.write(contents)

    return str(full_path)