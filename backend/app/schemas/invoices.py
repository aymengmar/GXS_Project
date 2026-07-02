from typing import Optional

from pydantic import BaseModel

INVOICE_TYPES: list[str] = ["fuel", "parking", "toll", "repair_maintenance", "car_wash", "other"]


class DriverInvoiceItem(BaseModel):
    id: str
    invoice_type: str
    invoice_date: str
    amount: float
    currency: str
    details: Optional[str] = None
    notes: Optional[str] = None
    invoice_number: str
    review_status: str
    status: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    receipt_preview_url: Optional[str] = None
    created_at: Optional[str] = None


class DriverInvoiceSummary(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    total_amount_this_month: float


class DriverInvoicesListResponse(BaseModel):
    summary: DriverInvoiceSummary
    items: list[DriverInvoiceItem]


class DriverInvoiceCreateResponse(BaseModel):
    message: str
    invoice: DriverInvoiceItem
