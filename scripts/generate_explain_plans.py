#!/usr/bin/env python3
"""
Generate EXPLAIN plans for critical queries.
Creates markdown files in docs/perf/ with query plans.
"""
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import DATABASE_URL

DOCS_PERF_DIR = PROJECT_ROOT / "docs" / "perf"
DOCS_PERF_DIR.mkdir(parents=True, exist_ok=True)


# Critical queries to analyze
QUERIES = {
    "schedule_current": """
        SELECT 
            of.of_id,
            of.of_data_criacao,
            of.of_data_acabamento,
            fof.faseof_id,
            fof.faseof_fase_id,
            fof.faseof_inicio,
            fof.faseof_fim,
            fof.faseof_is_open
        FROM ordens_fabrico of
        JOIN fases_ordem_fabrico fof ON fof.faseof_of_id = of.of_id
        WHERE fof.faseof_is_open = true
        ORDER BY fof.faseof_event_time DESC
        LIMIT 100;
    """,
    
    "orders_list": """
        SELECT 
            of.of_id,
            of.of_data_criacao,
            of.of_data_acabamento,
            m.produto_nome,
            COUNT(fof.faseof_id) as phase_count
        FROM ordens_fabrico of
        LEFT JOIN modelos m ON of.of_produto_id = m.produto_id
        LEFT JOIN fases_ordem_fabrico fof ON fof.faseof_of_id = of.of_id
        WHERE of.of_data_criacao >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY of.of_id, of.of_data_criacao, of.of_data_acabamento, m.produto_nome
        ORDER BY of.of_data_criacao DESC
        LIMIT 100;
    """,
    
    "quality_overview": """
        SELECT 
            e.ofch_fase_avaliacao,
            e.ofch_faseof_culpada,
            COUNT(*) as error_count,
            AVG(e.ofch_gravidade) as avg_gravidade
        FROM erros_ordem_fabrico e
        WHERE e.ofch_fase_avaliacao IS NOT NULL
        GROUP BY e.ofch_fase_avaliacao, e.ofch_faseof_culpada
        ORDER BY error_count DESC
        LIMIT 50;
    """,
    
    "smartinventory_wip": """
        SELECT 
            fof.faseof_fase_id,
            COUNT(*) as wip_count,
            AVG(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) as avg_age_hours
        FROM fases_ordem_fabrico fof
        WHERE fof.faseof_inicio IS NOT NULL 
          AND fof.faseof_fim IS NULL
        GROUP BY fof.faseof_fase_id
        ORDER BY wip_count DESC;
    """,
    
    "wip_mass": """
        SELECT 
            fof.faseof_fase_id,
            SUM(COALESCE(fof.faseof_peso, 0)) as total_mass,
            COUNT(*) as wip_count
        FROM fases_ordem_fabrico fof
        WHERE fof.faseof_inicio IS NOT NULL 
          AND fof.faseof_fim IS NULL
        GROUP BY fof.faseof_fase_id
        ORDER BY total_mass DESC;
    """,
}


def generate_explain_plan(engine, query_name: str, query_sql: str) -> str:
    """Generate EXPLAIN (ANALYZE, BUFFERS) plan for a query."""
    try:
        with engine.connect() as conn:
            # Set search path to core, public, staging
            conn.execute(text("SET search_path TO core, public, staging;"))
            
            # Get EXPLAIN plan
            explain_sql = f"EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) {query_sql}"
            result = conn.execute(text(explain_sql))
            plan_json = result.scalar()
            
            # Also get text format for readability
            explain_text_sql = f"EXPLAIN (ANALYZE, BUFFERS, VERBOSE) {query_sql}"
            result_text = conn.execute(text(explain_text_sql))
            plan_text = "\n".join([row[0] for row in result_text])
            
            return plan_json, plan_text
    except Exception as e:
        return None, f"Error generating plan: {e}"


def write_explain_markdown(query_name: str, query_sql: str, plan_json, plan_text: str):
    """Write EXPLAIN plan to markdown file."""
    output_file = DOCS_PERF_DIR / f"EXPLAIN_{query_name}.md"
    
    with open(output_file, 'w') as f:
        f.write(f"# EXPLAIN Plan: {query_name}\n\n")
        f.write(f"**Generated**: {datetime.now().isoformat()}\n\n")
        f.write("## Query\n\n")
        f.write("```sql\n")
        f.write(query_sql.strip())
        f.write("\n```\n\n")
        f.write("## Plan (Text)\n\n")
        f.write("```\n")
        f.write(plan_text)
        f.write("\n```\n\n")
        
        if plan_json:
            f.write("## Plan (JSON)\n\n")
            import json
            f.write("```json\n")
            f.write(json.dumps(plan_json, indent=2))
            f.write("\n```\n")
    
    print(f"✅ Generated: {output_file}")


def main():
    """Generate EXPLAIN plans for all queries."""
    print("="*80)
    print("GENERATE EXPLAIN PLANS")
    print("="*80)
    print()
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not configured")
        return 1
    
    try:
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        print(f"✅ Connected to database\n")
        
        for query_name, query_sql in QUERIES.items():
            print(f"📊 Analyzing: {query_name}...")
            plan_json, plan_text = generate_explain_plan(engine, query_name, query_sql)
            
            if plan_text and not plan_text.startswith("Error"):
                write_explain_markdown(query_name, query_sql, plan_json, plan_text)
            else:
                print(f"⚠️  {query_name}: {plan_text}")
                # Still write file with error message
                write_explain_markdown(query_name, query_sql, None, plan_text)
        
        print()
        print("="*80)
        print("✅ EXPLAIN PLANS GENERATED")
        print("="*80)
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

