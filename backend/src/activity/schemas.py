from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: UUID
    room_id: UUID
    actor_profile_id: UUID | None
    actor_name: str | None
    action: str
    entity_type: str
    entity_id: UUID | None
    old_values: dict[str, Any] | None
    new_values: dict[str, Any] | None
    created_at: datetime
