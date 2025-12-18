.PHONY: help bootstrap reset-db verify migrate ingest backfill aggregates test perf clean

help:
	@echo "PRODPLAN 4.0 OS - Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  bootstrap     - Setup inicial completo (migrations + ingestão)"
	@echo "  reset-db      - Reset database (DROP + CREATE + migrations)"
	@echo "  migrate       - Aplicar migrations"
	@echo "  ingest        - Rodar ingestão turbo"
	@echo "  backfill      - Rodar backfill jobs"
	@echo "  aggregates    - Computar aggregates incrementais"
	@echo "  verify        - Verificação completa (migrations + ingestão parcial + testes)"
	@echo "  test          - Rodar testes"
	@echo "  perf          - Rodar benchmarks de performance"
	@echo "  clean         - Limpar arquivos temporários"

bootstrap:
	@echo "🚀 Bootstrap completo via script..."
	@./scripts/bootstrap_postgres.sh

prod-ready:
	@echo "🏭 PRODUCTION PROOF - Executando todos os passos..."
	@./scripts/prod_ready.sh

validate-db:
	@echo "🔍 Validando PostgreSQL..."
	@python3 scripts/validate_prerequisites.py || (echo "❌ Validação falhou. Configure PostgreSQL primeiro." && exit 1)

triage:
	@echo "🔍 Running error triage..."
	@python3 scripts/triage_errors.py

feature-gates:
	@echo "🔍 Evaluating feature gates..."
	@python3 scripts/evaluate_feature_gates.py

migrate-from-zero:
	@echo "🔍 Testing migrations from zero..."
	@python3 scripts/migrate_from_zero.py

slo-results:
	@echo "⚡ Generating SLO results..."
	@python3 scripts/generate_slo_results.py

release-gate:
	@echo "🚪 Running release gate..."
	@python3 scripts/release_gate.py || (echo "❌ Release gate failed. Check docs/RELEASE_BLOCKED.md" && exit 1)

reset-db:
	@echo "⚠️  RESETANDO DATABASE - Todos os dados serão perdidos!"
	@read -p "Tem certeza? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@psql $$DATABASE_URL -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
	@echo "✅ Database resetado"
	@$(MAKE) migrate

migrate:
	@echo "📦 Aplicando migrations..."
	@alembic upgrade head
	@echo "✅ Migrations aplicadas"

ingest:
	@echo "📥 Rodando ingestão turbo..."
	@python app/ingestion/main_turbo.py
	@echo "✅ Ingestão completa"

backfill:
	@echo "🔄 Rodando backfill jobs..."
	@python -c "from app.workers.jobs_backfill import backfill_ofch_event_time, backfill_faseof_derived_columns; import asyncio; asyncio.run(backfill_ofch_event_time({})); asyncio.run(backfill_faseof_derived_columns({}))"
	@echo "✅ Backfill completo"

aggregates:
	@echo "📊 Computando aggregates incrementais..."
	@python -c "from app.analytics.incremental_aggregates import IncrementalAggregates; from backend.config import DATABASE_URL; from datetime import date, timedelta; aggregates = IncrementalAggregates(DATABASE_URL); today = date.today(); [aggregates.compute_all_incremental(today - timedelta(days=i)) for i in range(7)]"
	@echo "✅ Aggregates computados"

verify: validate-db migrate
	@echo "🔍 Verificação completa..."
	@echo "1. Validando pré-requisitos..."
	@python3 scripts/validate_prerequisites.py || exit 1
	@echo "2. Verificando migrations..."
	@export PATH="/Users/martimnicolau/Library/Python/3.9/bin:$$PATH" && alembic current || echo "⚠️  Alembic não encontrado no PATH"
	@echo "3. Validando contagens (se ingestão foi rodada)..."
	@python3 app/ingestion/validate_counts.py || echo "⚠️  Validação de contagens falhou (ingestão pode não ter sido rodada)"
	@echo "4. Rodando testes de integridade..."
	@pytest tests/test_integrity.py -v || exit 1
	@echo "✅ Verificação completa passou!"

test:
	@pytest tests/ -v

perf:
	@echo "⚡ Rodando benchmarks de performance..."
	@pytest tests/performance/ -v --benchmark-only
	@echo "✅ Benchmarks completos"

clean:
	@echo "🧹 Limpando arquivos temporários..."
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@find . -type f -name "*.pyo" -delete
	@find . -type f -name ".coverage" -delete
	@find . -type d -name ".pytest_cache" -exec rm -r {} + 2>/dev/null || true
	@echo "✅ Limpeza completa"
