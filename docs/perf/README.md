# Performance Documentation

## SLOs (Service Level Objectives)

- `/api/prodplan/orders`: p95 < 400ms
- `/api/prodplan/orders/{id}`: p95 < 250ms
- `/api/prodplan/schedule/current`: p95 < 250ms
- `/api/quality/overview`: p95 < 250ms

## EXPLAIN Plans

### Critical Queries

#### Orders List with Pagination
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT of_id, of_data_criacao, of_data_acabamento, of_produto_id, of_fase_id
FROM ordens_fabrico
WHERE of_data_criacao >= '2020-01-01'
ORDER BY of_data_criacao DESC, of_id DESC
LIMIT 100;
```

**Expected**: Index scan on `idx_of_data_criacao`

#### Order Phases
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT faseof_id, faseof_inicio, faseof_fim, faseof_fase_id
FROM fases_ordem_fabrico
WHERE faseof_of_id = '12345'
ORDER BY faseof_sequencia NULLS LAST;
```

**Expected**: Index scan on `idx_faseof_ofid_seq`

#### Schedule Current (WIP)
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT fase_id, wip_count, avg_wip_age_hours
FROM mv_wip_by_phase_current;
```

**Expected**: Sequential scan on materialized view (fast, pre-computed)

## Benchmarking

Run performance tests:

```bash
pytest tests/performance/ -m performance --benchmark-only
```

## Monitoring

- Prometheus metrics: http://localhost:9090
- Grafana dashboards: http://localhost:3000

Key metrics:
- `http_request_duration_seconds`
- `db_query_duration_seconds`
- `cache_hits_total`
- `cache_misses_total`

