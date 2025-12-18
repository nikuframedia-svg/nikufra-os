# Ingestion Guide

## Overview

The ingestion system processes `Folha_IA.xlsx` in streaming mode, validating, mapping, and upserting data into PostgreSQL with full auditability and error handling.

## Architecture

```
Excel File (Folha_IA.xlsx)
    ↓
StreamingExcelLoader (openpyxl read_only)
    ↓
Row-by-row iteration
    ↓
Mapper (Excel columns → DB schema)
    ↓
Validator (type checking, business rules)
    ↓
Batch Upsert (5000 rows/batch, ON CONFLICT)
    ↓
PostgreSQL (partitioned tables)
    ↓
Rejects Table (if validation fails)
```

## Usage

### Basic Ingestion

```bash
python -m app.ingestion.main
```

### Programmatic Usage

```python
from app.ingestion.orchestrator import IngestionOrchestrator

orchestrator = IngestionOrchestrator(
    file_path="data/raw/Folha_IA.xlsx",
    batch_size=5000
)

results = orchestrator.run()
print(f"Processed: {results['total_processed']:,}")
print(f"Rejected: {results['total_rejected']:,}")
```

## Ingestion Order

Master data first (no dependencies), then transactions:

1. `Fases` → `fases_catalogo`
2. `Modelos` → `modelos`
3. `Funcionarios` → `funcionarios`
4. `FuncionariosFasesAptos` → `funcionarios_fases_aptos`
5. `FasesStandardModelos` → `fases_standard_modelos`
6. `OrdensFabrico` → `ordens_fabrico`
7. `FasesOrdemFabrico` → `fases_ordem_fabrico`
8. `FuncionariosFaseOrdemFabrico` → `funcionarios_fase_ordem_fabrico`
9. `OrdemFabricoErros` → `erros_ordem_fabrico`

## Validation Rules

### OrdensFabrico
- `of_id`: Required
- `of_data_criacao`: Required, valid date
- `of_data_acabamento`: Must be >= `of_data_criacao` if both present

### FasesOrdemFabrico
- `faseof_id`: Required
- `faseof_of_id`: Required
- `faseof_fim`: Must be >= `faseof_inicio` if both present

### OrdemFabricoErros
- `erro_descricao`: Required
- `erro_gravidade`: Must be 1-3 if present

## Rejection Reasons

- `MAPPING_ERROR`: Failed to map Excel row to DB schema
- `VALIDATION_ERROR`: Failed validation rules
- `UPSERT_ERROR`: Database error during upsert

## Monitoring

### Check Ingestion Status

```sql
-- Latest run
SELECT * FROM ingestion_runs ORDER BY run_id DESC LIMIT 1;

-- Sheet-level stats
SELECT 
    sheet_name,
    status,
    total_rows,
    processed_rows,
    rejected_rows,
    throughput_rows_per_sec,
    completed_at
FROM ingestion_sheet_runs
WHERE run_id = (SELECT MAX(run_id) FROM ingestion_runs)
ORDER BY sheet_name;
```

### Check Rejects

```sql
-- Rejects by reason
SELECT 
    reason_code,
    COUNT(*) as count,
    COUNT(DISTINCT sheet_name) as affected_sheets
FROM ordens_fabrico_rejects
WHERE ingestion_run_id = (SELECT MAX(run_id) FROM ingestion_runs)
GROUP BY reason_code
ORDER BY count DESC;

-- Sample rejects
SELECT 
    row_number,
    reason_code,
    reason_detail,
    raw_json
FROM ordens_fabrico_rejects
WHERE ingestion_run_id = (SELECT MAX(run_id) FROM ingestion_runs)
LIMIT 10;
```

### Verify Row Counts

```sql
-- Compare with Excel expected counts
SELECT 'ordens_fabrico' as table_name, COUNT(*) as actual_count, 27381 as expected_count FROM ordens_fabrico
UNION ALL
SELECT 'fases_ordem_fabrico', COUNT(*), 519080 FROM fases_ordem_fabrico
UNION ALL
SELECT 'funcionarios_fase_ordem_fabrico', COUNT(*), 423770 FROM funcionarios_fase_ordem_fabrico
UNION ALL
SELECT 'erros_ordem_fabrico', COUNT(*), 89837 FROM erros_ordem_fabrico
UNION ALL
SELECT 'funcionarios', COUNT(*), 903 FROM funcionarios
UNION ALL
SELECT 'funcionarios_fases_aptos', COUNT(*), 903 FROM funcionarios_fases_aptos
UNION ALL
SELECT 'fases_catalogo', COUNT(*), 72 FROM fases_catalogo
UNION ALL
SELECT 'modelos', COUNT(*), 895 FROM modelos
UNION ALL
SELECT 'fases_standard_modelos', COUNT(*), 15348 FROM fases_standard_modelos;
```

## Performance

### Expected Throughput

- Small sheets (<10k rows): 10,000+ rows/sec
- Medium sheets (10k-100k rows): 5,000-10,000 rows/sec
- Large sheets (>100k rows): 2,000-5,000 rows/sec

### Memory Usage

- Peak memory: <2GB (even for 500k+ row sheets)
- Uses streaming (no full sheet load)

## Idempotency

Ingestion is **idempotent**: safe to re-run.

- Uses `ON CONFLICT` upserts
- No duplicate rows
- Rejects are appended (not replaced)

## Distributed Locks

Redis distributed lock prevents concurrent ingestion:

- Lock key: `ingestion:run`
- Timeout: 1 hour
- Automatically released on completion/error

## Troubleshooting

### High Rejection Rate

1. Check `*_rejects` tables for patterns
2. Review validation rules
3. Check Excel data quality
4. Adjust mappers if column names changed

### Slow Ingestion

1. Check database indexes (should be created by migrations)
2. Verify batch size (default 5000)
3. Check database connection pool
4. Monitor database CPU/IO

### Memory Issues

1. Verify using `read_only=True` in openpyxl
2. Check batch size (reduce if needed)
3. Monitor with `htop` or similar

## Next Steps After Ingestion

1. **Reconcile Orphans**: Run reconciliation job
2. **Refresh MVs**: Refresh materialized views
3. **Compute KPIs**: Run KPI snapshot job
4. **Verify Data**: Check data quality issues table

