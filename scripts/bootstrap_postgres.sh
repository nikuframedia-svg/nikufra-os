#!/bin/bash
# Bootstrap PostgreSQL for PRODPLAN 4.0 OS
# Exits with non-zero code if any step fails
# PostgreSQL 15+ only - no SQLite support

set -euo pipefail  # Exit on error, undefined vars, pipe failures

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Trap for error reporting
trap 'echo "❌ Error at line $LINENO. Command: $BASH_COMMAND"' ERR

echo "================================================================================"
echo "PRODPLAN 4.0 OS - PostgreSQL Bootstrap"
echo "================================================================================"
echo ""

# Step 1: Start PostgreSQL via Docker
echo "1. Iniciando PostgreSQL via Docker Compose..."
if ! docker compose up -d db; then
    echo "   ❌ Erro ao iniciar PostgreSQL"
    echo "   Verifique se Docker está rodando: docker ps"
    exit 1
fi

# Step 2: Wait for PostgreSQL to be ready
echo ""
echo "2. Aguardando PostgreSQL ficar ready..."
MAX_WAIT=120  # 2 minutes
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker compose exec -T db pg_isready -U nelo_user -d nelo_db -h localhost > /dev/null 2>&1; then
        echo "   ✅ PostgreSQL está ready"
        break
    fi
    echo "   ⏳ Aguardando... ($WAIT_COUNT/$MAX_WAIT)s"
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "   ❌ Timeout: PostgreSQL não ficou ready em ${MAX_WAIT}s"
    echo "   Verifique logs: docker compose logs db"
    exit 1
fi

# Step 3: Set DATABASE_URL
echo ""
echo "3. Configurando DATABASE_URL..."
export DATABASE_URL="postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"
echo "   DATABASE_URL=$DATABASE_URL"

# Step 4: Apply migrations
echo ""
echo "4. Aplicando migrations..."
# Try to find alembic in PATH
ALEMBIC_CMD=""
if command -v alembic &> /dev/null; then
    ALEMBIC_CMD="alembic"
else
    # Try common Python bin paths
    for PYTHON_BIN in "$HOME/Library/Python/3.9/bin" "$HOME/.local/bin" "/usr/local/bin"; do
        if [ -f "$PYTHON_BIN/alembic" ]; then
            export PATH="$PYTHON_BIN:$PATH"
            ALEMBIC_CMD="alembic"
            break
        fi
    done
fi

if [ -z "$ALEMBIC_CMD" ]; then
    echo "   ⚠️  Alembic não encontrado no PATH, tentando python -m alembic..."
    if ! DATABASE_URL="$DATABASE_URL" python3 -m alembic upgrade head; then
        echo "   ❌ Migrations falharam"
        exit 1
    fi
else
    if ! DATABASE_URL="$DATABASE_URL" $ALEMBIC_CMD upgrade head; then
        echo "   ❌ Migrations falharam"
        exit 1
    fi
fi
echo "   ✅ OK: migrations applied"

# Step 5: Validate prerequisites
echo ""
echo "5. Validando pré-requisitos..."
if ! DATABASE_URL="$DATABASE_URL" python3 scripts/validate_prerequisites.py; then
    echo "   ❌ Validação de pré-requisitos falhou"
    exit 1
fi
echo "   ✅ OK: prerequisites validated"

# Step 6: Run release gate
echo ""
echo "6. Rodando release gate..."
if ! DATABASE_URL="$DATABASE_URL" python3 scripts/release_gate.py; then
    echo "   ❌ Release gate falhou"
    echo "   Verifique: docs/RELEASE_BLOCKED.md"
    exit 1
fi
echo "   ✅ OK: release gate passed"

echo ""
echo "================================================================================"
echo "✅ BOOTSTRAP COMPLETO"
echo "================================================================================"
echo ""
echo "Resumo:"
echo "  ✅ Postgres ready"
echo "  ✅ Migrations applied"
echo "  ✅ Prerequisites validated"
echo "  ✅ Release gate passed"
echo ""
echo "Próximos passos:"
echo "  1. Rodar ingestão: DATABASE_URL='$DATABASE_URL' python app/ingestion/main_turbo.py"
echo "  2. Iniciar API: docker compose up -d api"
echo "  3. Iniciar worker: docker compose up -d worker"
echo ""
