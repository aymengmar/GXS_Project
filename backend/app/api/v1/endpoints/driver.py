from datetime import date

from fastapi import APIRouter, File, Form, Header, UploadFile

from app.schemas.driver import (
    DriverDashboardResponse,
    DriverDocumentsListResponse,
    DriverInsuranceExpiryResponse,
    DriverInsuranceExpiryUpdateRequest,
    DriverVehicleResponse,
)
from app.schemas.invoices import DriverInvoiceCreateResponse, DriverInvoicesListResponse
from app.services.driver_service import (
    get_driver_dashboard,
    get_driver_documents,
    get_driver_vehicle,
    update_driver_insurance_expiry,
)
from app.services.invoice_service import create_driver_invoice, get_driver_invoices

router = APIRouter()


@router.get("/dashboard", response_model=DriverDashboardResponse)
def driver_dashboard(authorization: str = Header(...)) -> DriverDashboardResponse:
    return get_driver_dashboard(authorization)


@router.get("/documents", response_model=DriverDocumentsListResponse)
def driver_documents(authorization: str = Header(...)) -> DriverDocumentsListResponse:
    return get_driver_documents(authorization)


@router.get("/vehicle", response_model=DriverVehicleResponse)
def driver_vehicle(authorization: str = Header(...)) -> DriverVehicleResponse:
    return get_driver_vehicle(authorization)


@router.patch("/vehicle/insurance-expiry", response_model=DriverInsuranceExpiryResponse)
def driver_update_insurance_expiry(
    body: DriverInsuranceExpiryUpdateRequest,
    authorization: str = Header(...),
) -> DriverInsuranceExpiryResponse:
    return update_driver_insurance_expiry(authorization, body.insurance_expiry_date)


@router.post("/invoices", response_model=DriverInvoiceCreateResponse)
async def driver_create_invoice(
    invoice_type: str = Form(...),
    invoice_date: date = Form(...),
    amount: float = Form(...),
    details: str | None = Form(None),
    notes: str | None = Form(None),
    file: UploadFile = File(...),
    authorization: str = Header(...),
) -> DriverInvoiceCreateResponse:
    return await create_driver_invoice(
        authorization=authorization,
        invoice_type=invoice_type,
        invoice_date=invoice_date,
        amount=amount,
        details=details,
        notes=notes,
        file=file,
    )


@router.get("/invoices", response_model=DriverInvoicesListResponse)
def driver_list_invoices(authorization: str = Header(...)) -> DriverInvoicesListResponse:
    return get_driver_invoices(authorization)
