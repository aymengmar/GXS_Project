from fastapi import APIRouter, File, Form, Header, UploadFile

from app.services.document_service import upload_driver_document

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    authorization: str = Header(...),
) -> dict:
    return await upload_driver_document(
        authorization=authorization,
        document_type=document_type,
        file=file,
    )
