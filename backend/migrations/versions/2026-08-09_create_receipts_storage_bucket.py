"""Create the private receipts storage bucket.

Revision ID: 26a0a34774e6
Revises: 20260808_01
Create Date: 2026-08-09 12:57:29.399873
"""

from collections.abc import Sequence

from alembic import op

revision: str = "26a0a34774e6"
down_revision: str | None = "20260808_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO storage.buckets (
            id,
            name,
            public,
            file_size_limit,
            allowed_mime_types
        )
        VALUES (
            'receipts',
            'receipts',
            false,
            10485760,
            ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
        )
        ON CONFLICT (id) DO UPDATE
        SET public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM storage.objects
                WHERE bucket_id = 'receipts'
            ) THEN
                RAISE EXCEPTION
                    'Cannot remove the receipts bucket while it contains objects';
            END IF;

            DELETE FROM storage.buckets WHERE id = 'receipts';
        END
        $$;
        """
    )
