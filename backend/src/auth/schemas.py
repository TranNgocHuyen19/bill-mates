from pydantic import BaseModel, EmailStr, ConfigDict


class LoginInput(BaseModel):
    email: EmailStr
    password: str

    model_config = ConfigDict(from_attributes=True)


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str

    model_config = ConfigDict(from_attributes=True)


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserAuthResponse(BaseModel):
    id: str
    email: str | None = None
    name: str | None = None
