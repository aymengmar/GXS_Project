from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator


class DriverRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    car_type: Literal["own_car", "company_car"]

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("full_name must not be empty")
        return v.strip()


class DriverRegisterResponse(BaseModel):
    message: str
    status: str


class DriverLoginRequest(BaseModel):
    email: EmailStr
    password: str


class DriverLoginResponse(BaseModel):
    access_token: str
    id: str
    email: str
    full_name: str
    car_type: str
    status: str
    external_driver_id: str | None
