# INGESTÃO NECESSÁRIA - Folha_IA.xlsx

## ⚠️ IMPORTANTE

Os dados do frontend vêm da base de dados PostgreSQL, que precisa ser populada com os dados do ficheiro `Folha_IA.xlsx`.

## Fluxo de Dados

```
Folha_IA.xlsx (data/raw/)
    ↓
[Ingestão] → TurboIngestionOrchestrator
    ↓
PostgreSQL (ordens_fabrico, fases_ordem_fabrico, etc.)
    ↓
[Serviços] → ProdplanService, BottleneckService, etc.
    ↓
[API] → /api/prodplan/orders, /api/prodplan/schedule/current, etc.
    ↓
[Frontend] → React Query hooks
    ↓
UI (Overview, Orders, Schedule, etc.)
```

## Como Executar Ingestão

1. **Configurar DATABASE_URL** no `.env`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/nelo_db
   ```

2. **Executar ingestão**:
   ```bash
   python3 app/ingestion/main_turbo.py
   ```

3. **Verificar dados**:
   ```bash
   python3 -c "from sqlalchemy import create_engine, text; from backend.config import DATABASE_URL; engine = create_engine(DATABASE_URL); conn = engine.connect(); result = conn.execute(text('SELECT COUNT(*) FROM ordens_fabrico')); print(f'Ordens: {result.scalar()}')"
   ```

## Status Atual

- ✅ Frontend configurado para consumir da API
- ✅ API configurada para ler da base de dados
- ✅ Serviços implementados (ProdplanService, etc.)
- ⚠️ Ingestão precisa ser executada para popular a BD

## Endpoints que Consomem Dados

- `/api/prodplan/orders` → lê de `ordens_fabrico`
- `/api/prodplan/schedule/current` → lê de `fases_ordem_fabrico`
- `/api/prodplan/bottlenecks` → calcula de `fases_ordem_fabrico`
- `/api/prodplan/risk_queue` → calcula de `ordens_fabrico`
- `/api/kpis/overview` → calcula de várias tabelas
- `/api/smartinventory/wip` → calcula de `fases_ordem_fabrico`
- `/api/quality/overview` → lê de `erros_ordem_fabrico`

Todos estes endpoints **DEPENDEM** dos dados do `Folha_IA.xlsx` estarem na base de dados.
