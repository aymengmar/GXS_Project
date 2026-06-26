from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator, model_validator


class OwnCarDetails(BaseModel):
    vehicle_make_model: str
    plate_number: str
    insurance_provider: str
    insurance_number: str
    vehicle_year: int


class DriverRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    car_type: Literal["own_car", "company_car"]
    own_car_details: OwnCarDetails | None = None

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

    @model_validator(mode="after")
    def own_car_details_required_for_own_car(self) -> "DriverRegisterRequest":
        if self.car_type == "own_car" and self.own_car_details is None:
            raise ValueError("own_car_details is required when car_type is own_car")
        return self


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
