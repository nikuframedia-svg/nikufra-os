"""add pgcrypto + errors fingerprint

Revision ID: 006_errors_fingerprint_pgcrypto
Revises: 005_indexes_with_include
Create Date: 2025-12-18
"""

from alembic import op
import sqlalchemy as sa

revision = "006_errors_fingerprint_pgcrypto"
down_revision = "005_indexes_include"
branch_labels = None
depends_on = None


def upgrade():
    # pgcrypto needed for digest()
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # add fingerprint column
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        ADD COLUMN IF NOT EXISTS ofch_fingerprint text;
    """)

    # unique index to support ON CONFLICT (ofch_fingerprint, ofch_of_id)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ux_erros_fingerprint_ofid
        ON erros_ordem_fabrico (ofch_fingerprint, ofch_of_id);
    """)


def downgrade():
    # keep extension; drop only index + column
    op.execute("DROP INDEX IF EXISTS ux_erros_fingerprint_ofid;")
    op.execute("ALTER TABLE erros_ordem_fabrico DROP COLUMN IF EXISTS ofch_fingerprint;")

