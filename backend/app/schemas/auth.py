from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator, model_validator


class OwnCarDetails(BaseModel):
    vehicle_make_model: str
    plate_number: str
    insurance_provider: str
    insurance_number: str
    vehicle_year: int


class DriverRegisterRequest(BaseModel):
    access_token: str
    postal_code: str
    full_name: str
    phone: str | None = None
    car_type: Literal["own_car", "company_car"]
    own_car_details: OwnCarDetails | None = None

    @field_validator("postal_code")
    @classmethod
    def postal_code_valid(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 5:
            raise ValueError("postal_code must be a 5-digit German postal code")
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
    must_change_password: bool = False


class ChangePasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 12:
            raise ValueError("Password must be at least 12 characters.")
        return v


class ChangePasswordResponse(BaseModel):
    message: str


class EmailVerificationSendRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class EmailVerificationSendResponse(BaseModel):
    message: str


class EmailVerificationVerifyRequest(BaseModel):
    email: str
    code: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("code")
    @classmethod
    def code_must_be_digits(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("code must be exactly 6 digits")
        return v


class EmailVerificationVerifyResponse(BaseModel):
    verified: bool
    message: str
    auth_user_id: str | None = None
    access_token: str | None = None


class AdminUserInfo(BaseModel):
    auth_user_id: str
    email: str
    full_name: str
    role: str
    status: str


class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: AdminUserInfo
    next_route: str
