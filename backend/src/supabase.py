from typing import Any

import httpx

from src.config import settings


class SupabaseClient:
    """Async Client for interacting directly with Supabase Database (PostgREST API)."""

    def __init__(self) -> None:
        self.base_url = f"{settings.SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def select(
        self, table: str, query_params: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Fetch records from a Supabase table."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.base_url}/{table}",
                headers=self.headers,
                params=query_params or {},
            )
            if resp.status_code >= 400:
                # Return empty list fallback if table is not yet created in Supabase
                return []
            return resp.json()

    async def insert(
        self, table: str, data: dict[str, Any] | list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Insert records into a Supabase table."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{self.base_url}/{table}", headers=self.headers, json=data
            )
            if resp.status_code >= 400:
                return []
            return resp.json()

    async def update(
        self, table: str, data: dict[str, Any], query_params: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Update records in a Supabase table."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.patch(
                f"{self.base_url}/{table}",
                headers=self.headers,
                json=data,
                params=query_params,
            )
            if resp.status_code >= 400:
                return []
            return resp.json()

    async def delete(
        self, table: str, query_params: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Delete records from a Supabase table."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.delete(
                f"{self.base_url}/{table}", headers=self.headers, params=query_params
            )
            if resp.status_code >= 400:
                return []
            return resp.json()


supabase_db = SupabaseClient()
