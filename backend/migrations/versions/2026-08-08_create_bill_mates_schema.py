"""Create the Bill Mates MVP schema.

Revision ID: 20260808_01
Revises:
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260808_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TYPE room_role AS ENUM ('owner', 'admin', 'member');
        CREATE TYPE membership_status AS ENUM ('invited', 'active', 'left', 'removed');
        CREATE TYPE invite_status AS ENUM ('active', 'expired', 'revoked');
        CREATE TYPE expense_status AS ENUM ('draft', 'posted', 'cancelled');
        CREATE TYPE split_method AS ENUM ('equal', 'exact', 'percentage', 'shares');
        CREATE TYPE settlement_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
        CREATE TYPE settlement_method AS ENUM ('bank_transfer', 'cash', 'e_wallet', 'other');
        CREATE TYPE ocr_status AS ENUM (
            'not_requested',
            'pending',
            'processing',
            'completed',
            'failed'
        );

        CREATE TABLE profiles (
            id uuid PRIMARY KEY,
            email varchar(320) NOT NULL UNIQUE,
            display_name varchar(128) NOT NULL,
            phone varchar(32),
            avatar_path text,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE payment_accounts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
            label varchar(80) NOT NULL,
            method varchar(32) NOT NULL,
            bank_code varchar(32),
            bank_name varchar(128),
            account_number varchar(64),
            account_name varchar(128),
            wallet_provider varchar(64),
            is_default boolean NOT NULL DEFAULT false,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX payment_accounts_profile_id_idx ON payment_accounts(profile_id);

        CREATE TABLE rooms (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name varchar(128) NOT NULL,
            description text,
            currency varchar(3) NOT NULL DEFAULT 'VND',
            created_by_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
            archived_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX rooms_created_by_profile_id_idx ON rooms(created_by_profile_id);

        CREATE TABLE room_members (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
            role room_role NOT NULL DEFAULT 'member',
            status membership_status NOT NULL DEFAULT 'active',
            nickname varchar(80),
            joined_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            UNIQUE (room_id, profile_id)
        );
        CREATE INDEX room_members_room_id_idx ON room_members(room_id);
        CREATE INDEX room_members_profile_id_idx ON room_members(profile_id);

        CREATE TABLE room_invites (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            created_by_member_id uuid NOT NULL REFERENCES room_members(id) ON DELETE RESTRICT,
            token varchar(96) NOT NULL UNIQUE,
            status invite_status NOT NULL DEFAULT 'active',
            expires_at timestamptz NOT NULL,
            max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses > 0),
            use_count integer NOT NULL DEFAULT 0 CHECK (use_count >= 0),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX room_invites_room_id_idx ON room_invites(room_id);

        CREATE TABLE categories (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            name varchar(80) NOT NULL,
            icon varchar(64),
            color varchar(16),
            description text,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            UNIQUE (room_id, name)
        );
        CREATE INDEX categories_room_id_idx ON categories(room_id);

        CREATE TABLE expenses (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
            created_by_member_id uuid NOT NULL REFERENCES room_members(id) ON DELETE RESTRICT,
            paid_by_member_id uuid NOT NULL REFERENCES room_members(id) ON DELETE RESTRICT,
            title varchar(160) NOT NULL,
            note text,
            total_amount numeric(14, 2) NOT NULL CHECK (total_amount > 0),
            expense_date date NOT NULL,
            status expense_status NOT NULL DEFAULT 'draft',
            posted_at timestamptz,
            cancelled_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX expenses_room_id_expense_date_idx ON expenses(room_id, expense_date);
        CREATE INDEX expenses_status_idx ON expenses(status);

        CREATE TABLE expense_items (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
            category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
            name varchar(160) NOT NULL,
            quantity numeric(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
            unit_price numeric(14, 2) NOT NULL CHECK (unit_price >= 0),
            total_amount numeric(14, 2) NOT NULL CHECK (total_amount > 0),
            position integer NOT NULL DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX expense_items_expense_id_idx ON expense_items(expense_id);

        CREATE TABLE expense_item_splits (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_item_id uuid NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
            member_id uuid NOT NULL REFERENCES room_members(id) ON DELETE RESTRICT,
            split_method split_method NOT NULL,
            share_value numeric(14, 4) CHECK (share_value IS NULL OR share_value >= 0),
            amount_owed numeric(14, 2) NOT NULL CHECK (amount_owed >= 0),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            UNIQUE (expense_item_id, member_id)
        );
        CREATE INDEX expense_item_splits_expense_item_id_idx
            ON expense_item_splits(expense_item_id);
        CREATE INDEX expense_item_splits_member_id_idx ON expense_item_splits(member_id);

        CREATE TABLE expense_receipts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
            bucket varchar(80) NOT NULL,
            storage_path text NOT NULL UNIQUE,
            filename varchar(255) NOT NULL,
            mime_type varchar(100) NOT NULL,
            size_bytes integer NOT NULL CHECK (size_bytes > 0),
            ocr_status ocr_status NOT NULL DEFAULT 'not_requested',
            ocr_data jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX expense_receipts_expense_id_idx ON expense_receipts(expense_id);

        CREATE TABLE settlements (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
            from_member_id uuid NOT NULL REFERENCES room_members(id) ON DELETE RESTRICT,
            to_member_id uuid NOT NULL REFERENCES room_members(id) ON DELETE RESTRICT,
            payment_account_id uuid REFERENCES payment_accounts(id) ON DELETE SET NULL,
            amount numeric(14, 2) NOT NULL CHECK (amount > 0),
            method settlement_method NOT NULL,
            status settlement_status NOT NULL DEFAULT 'pending',
            reference varchar(128),
            note text,
            rejection_reason text,
            confirmed_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            CHECK (from_member_id <> to_member_id)
        );
        CREATE INDEX settlements_room_id_created_at_idx ON settlements(room_id, created_at);
        CREATE INDEX settlements_status_idx ON settlements(status);

        CREATE TABLE settlement_receipts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            settlement_id uuid NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
            bucket varchar(80) NOT NULL,
            storage_path text NOT NULL UNIQUE,
            filename varchar(255) NOT NULL,
            mime_type varchar(100) NOT NULL,
            size_bytes integer NOT NULL CHECK (size_bytes > 0),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX settlement_receipts_settlement_id_idx
            ON settlement_receipts(settlement_id);

        CREATE TABLE activity_logs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
            actor_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
            action varchar(80) NOT NULL,
            entity_type varchar(80) NOT NULL,
            entity_id uuid,
            old_values jsonb,
            new_values jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX activity_logs_room_id_created_at_idx
            ON activity_logs(room_id, created_at);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP TABLE activity_logs;
        DROP TABLE settlement_receipts;
        DROP TABLE settlements;
        DROP TABLE expense_receipts;
        DROP TABLE expense_item_splits;
        DROP TABLE expense_items;
        DROP TABLE expenses;
        DROP TABLE categories;
        DROP TABLE room_invites;
        DROP TABLE room_members;
        DROP TABLE rooms;
        DROP TABLE payment_accounts;
        DROP TABLE profiles;

        DROP TYPE ocr_status;
        DROP TYPE settlement_method;
        DROP TYPE settlement_status;
        DROP TYPE split_method;
        DROP TYPE expense_status;
        DROP TYPE invite_status;
        DROP TYPE membership_status;
        DROP TYPE room_role;
        """
    )
