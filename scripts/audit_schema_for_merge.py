#!/usr/bin/env python3
"""Audit PostgreSQL schema for merge hardening."""
import os
import json
from sqlalchemy import create_engine, text

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("Error: DATABASE_URL required")
    
    engine = create_engine(db_url)
    audit = {
        "schemas": [],
        "core_tables": {}
    }
    
    with engine.connect() as conn:
        # 1) List schemas
        result = conn.execute(text("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name IN ('public', 'core', 'staging')
            ORDER BY schema_name
        """))
        audit["schemas"] = [row[0] for row in result.fetchall()]
        
        # 2) For each core table, list columns and types
        core_tables = [
            "ordens_fabrico", "fases_ordem_fabrico", "erros_ordem_fabrico",
            "funcionarios", "funcionarios_fases_aptos", "funcionarios_fase_ordem_fabrico",
            "fases_catalogo", "modelos", "fases_standard_modelos"
        ]
        
        for table in core_tables:
            # Try public first, then core
            for schema in ["public", "core"]:
                result = conn.execute(
                    text("""
                        SELECT column_name, data_type, udt_name, is_nullable
                        FROM information_schema.columns
                        WHERE table_schema = :schema AND table_name = :table
                        ORDER BY ordinal_position
                    """),
                    {"schema": schema, "table": table}
                )
                cols = result.fetchall()
                if cols:
                    audit["core_tables"][f"{schema}.{table}"] = {
                        "columns": [
                            {
                                "name": c[0],
                                "data_type": c[1],
                                "udt_name": c[2],
                                "is_nullable": c[3] == "YES"
                            }
                            for c in cols
                        ]
                    }
                    break
        
        # 3) For each table, list PKs and UNIQUE INDEXES
        for qualified_name, info in audit["core_tables"].items():
            schema, table = qualified_name.split(".", 1)
            
            # PKs
            result = conn.execute(
                text("""
                    SELECT
                        array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) AS pk_cols
                    FROM pg_constraint c
                    JOIN pg_class t ON c.conrelid = t.oid
                    JOIN pg_namespace n ON t.relnamespace = n.oid
                    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
                    WHERE n.nspname = :schema
                      AND t.relname = :table
                      AND c.contype = 'p'
                    GROUP BY c.conkey
                """),
                {"schema": schema, "table": table}
            )
            pk_row = result.fetchone()
            info["primary_key"] = list(pk_row[0]) if pk_row and pk_row[0] else []
            
            # UNIQUE constraints
            result = conn.execute(
                text("""
                    SELECT
                        c.conname,
                        array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) AS unique_cols
                    FROM pg_constraint c
                    JOIN pg_class t ON c.conrelid = t.oid
                    JOIN pg_namespace n ON t.relnamespace = n.oid
                    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
                    WHERE n.nspname = :schema
                      AND t.relname = :table
                      AND c.contype = 'u'
                    GROUP BY c.conname, c.conkey
                """),
                {"schema": schema, "table": table}
            )
            info["unique_constraints"] = [
                {"name": row[0], "columns": list(row[1])}
                for row in result.fetchall()
            ]
            
            # UNIQUE indexes
            result = conn.execute(
                text("""
                    SELECT
                        idx.relname AS indexname,
                        array_agg(a.attname ORDER BY array_position(i.indkey, a.attnum)) AS index_cols
                    FROM pg_index i
                    JOIN pg_class t ON i.indrelid = t.oid
                    JOIN pg_class idx ON i.indexrelid = idx.oid
                    JOIN pg_namespace n ON t.relnamespace = n.oid
                    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
                    WHERE n.nspname = :schema
                      AND t.relname = :table
                      AND i.indisunique = true
                    GROUP BY idx.relname, i.indkey
                """),
                {"schema": schema, "table": table}
            )
            info["unique_indexes"] = [
                {"name": row[0], "columns": list(row[1])}
                for row in result.fetchall()
            ]
    
    # Write markdown
    os.makedirs("docs/merge", exist_ok=True)
    with open("docs/merge/AUDIT_SCHEMA.md", "w") as f:
        f.write("# Schema Audit for Merge Hardening\n\n")
        f.write("Generated automatically from PostgreSQL schema.\n\n")
        f.write("## Schemas\n\n")
        for s in audit["schemas"]:
            f.write(f"- `{s}`\n")
        f.write("\n## Core Tables\n\n")
        for qualified, info in sorted(audit["core_tables"].items()):
            f.write(f"### {qualified}\n\n")
            f.write("**Columns:**\n")
            for col in info["columns"]:
                nullable = "NULL" if col["is_nullable"] else "NOT NULL"
                f.write(f"- `{col['name']}`: {col['data_type']} ({col['udt_name']}) {nullable}\n")
            f.write(f"\n**Primary Key:** {', '.join(info['primary_key']) if info['primary_key'] else 'None'}\n\n")
            if info["unique_constraints"]:
                f.write("**Unique Constraints:**\n")
                for uc in info["unique_constraints"]:
                    f.write(f"- `{uc['name']}`: ({', '.join(uc['columns'])})\n")
            if info["unique_indexes"]:
                f.write("\n**Unique Indexes:**\n")
                for ui in info["unique_indexes"]:
                    f.write(f"- `{ui['name']}`: ({', '.join(ui['columns'])})\n")
            f.write("\n")
    
    # Write JSON
    with open("docs/merge/AUDIT_SCHEMA.json", "w") as f:
        json.dump(audit, f, indent=2)
    
    print("✅ Audit complete: docs/merge/AUDIT_SCHEMA.md and .json")

if __name__ == "__main__":
    main()

