from typing import Annotated, Any
from uuid import UUID

import jwt
from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.config import settings
from src.exceptions import AppError

security = HTTPBearer(auto_error=False)
Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
ALLOWED_ALGORITHMS = {"HS256", "RS256", "ES256"}


class AuthenticatedUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    email: EmailStr | None = None
    role: str = "authenticated"
    user_metadata: dict[str, Any] = Field(default_factory=dict)


def _get_signing_key(token: str, algorithm: str) -> str | object:
    if algorithm == "HS256":
        return settings.SUPABASE_JWT_SECRET

    jwks_client = PyJWKClient(
        f"{settings.supabase_api_url}/auth/v1/.well-known/jwks.json",
        cache_keys=True,
    )
    return jwks_client.get_signing_key_from_jwt(token).key


def get_current_user(credentials: Credentials) -> AuthenticatedUser:
    if credentials is None:
        raise AppError(
            code="missing_authorization",
            message="Thiếu Authorization Bearer token.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    token = credentials.credentials
    try:
        algorithm = jwt.get_unverified_header(token).get("alg")
        if algorithm not in ALLOWED_ALGORITHMS:
            raise InvalidTokenError("Unsupported signing algorithm")

        payload = jwt.decode(
            token,
            key=_get_signing_key(token, algorithm),
            algorithms=[algorithm],
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1",
            options={"require": ["exp", "sub", "aud"]},
        )
        return AuthenticatedUser(
            id=UUID(payload["sub"]),
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
            user_metadata=payload.get("user_metadata") or {},
        )
    except (InvalidTokenError, PyJWKClientError, KeyError, TypeError, ValueError) as exc:
        raise AppError(
            code="invalid_token",
            message="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        ) from exc


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
