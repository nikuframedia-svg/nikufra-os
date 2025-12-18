# EXPLAIN Plan: smartinventory_wip

**Generated**: 2025-12-18T08:56:22.490378

## Query

```sql
SELECT 
            fof.faseof_fase_id,
            COUNT(*) as wip_count,
            AVG(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) as avg_age_hours
        FROM fases_ordem_fabrico fof
        WHERE fof.faseof_inicio IS NOT NULL 
          AND fof.faseof_fim IS NULL
        GROUP BY fof.faseof_fase_id
        ORDER BY wip_count DESC;
```

## Plan (Text)

```
Sort  (cost=0.02..0.03 rows=1 width=44) (actual time=0.007..0.008 rows=0 loops=1)
  Output: fof.faseof_fase_id, (count(*)), (avg((EXTRACT(epoch FROM (now() - fof.faseof_inicio)) / 3600.0)))
  Sort Key: (count(*)) DESC
  Sort Method: quicksort  Memory: 25kB
  ->  HashAggregate  (cost=0.00..0.01 rows=1 width=44) (actual time=0.001..0.002 rows=0 loops=1)
        Output: fof.faseof_fase_id, count(*), avg((EXTRACT(epoch FROM (now() - fof.faseof_inicio)) / 3600.0))
        Group Key: fof.faseof_fase_id
        Batches: 1  Memory Usage: 24kB
        ->  Result  (cost=0.00..0.00 rows=0 width=0) (actual time=0.001..0.001 rows=0 loops=1)
              Output: fof.faseof_fase_id, fof.faseof_inicio
              One-Time Filter: false
Planning:
  Buffers: shared hit=15
Planning Time: 0.092 ms
Execution Time: 0.049 ms
```

## Plan (JSON)

```json
[
  {
    "Plan": {
      "Node Type": "Sort",
      "Parallel Aware": false,
      "Async Capable": false,
      "Startup Cost": 0.02,
      "Total Cost": 0.03,
      "Plan Rows": 1,
      "Plan Width": 44,
      "Actual Startup Time": 0.012,
      "Actual Total Time": 0.012,
      "Actual Rows": 0,
      "Actual Loops": 1,
      "Output": [
        "fof.faseof_fase_id",
        "(count(*))",
        "(avg((EXTRACT(epoch FROM (now() - fof.faseof_inicio)) / 3600.0)))"
      ],
      "Sort Key": [
        "(count(*)) DESC"
      ],
      "Sort Method": "quicksort",
      "Sort Space Used": 25,
      "Sort Space Type": "Memory",
      "Shared Hit Blocks": 0,
      "Shared Read Blocks": 0,
      "Shared Dirtied Blocks": 0,
      "Shared Written Blocks": 0,
      "Local Hit Blocks": 0,
      "Local Read Blocks": 0,
      "Local Dirtied Blocks": 0,
      "Local Written Blocks": 0,
      "Temp Read Blocks": 0,
      "Temp Written Blocks": 0,
      "Plans": [
        {
          "Node Type": "Aggregate",
          "Strategy": "Hashed",
          "Partial Mode": "Simple",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Async Capable": false,
          "Startup Cost": 0.0,
          "Total Cost": 0.01,
          "Plan Rows": 1,
          "Plan Width": 44,
          "Actual Startup Time": 0.002,
          "Actual Total Time": 0.003,
          "Actual Rows": 0,
          "Actual Loops": 1,
          "Output": [
            "fof.faseof_fase_id",
            "count(*)",
            "avg((EXTRACT(epoch FROM (now() - fof.faseof_inicio)) / 3600.0))"
          ],
          "Group Key": [
            "fof.faseof_fase_id"
          ],
          "Planned Partitions": 0,
          "HashAgg Batches": 1,
          "Peak Memory Usage": 24,
          "Disk Usage": 0,
          "Shared Hit Blocks": 0,
          "Shared Read Blocks": 0,
          "Shared Dirtied Blocks": 0,
          "Shared Written Blocks": 0,
          "Local Hit Blocks": 0,
          "Local Read Blocks": 0,
          "Local Dirtied Blocks": 0,
          "Local Written Blocks": 0,
          "Temp Read Blocks": 0,
          "Temp Written Blocks": 0,
          "Plans": [
            {
              "Node Type": "Result",
              "Parent Relationship": "Outer",
              "Parallel Aware": false,
              "Async Capable": false,
              "Startup Cost": 0.0,
              "Total Cost": 0.0,
              "Plan Rows": 0,
              "Plan Width": 0,
              "Actual Startup Time": 0.001,
              "Actual Total Time": 0.001,
              "Actual Rows": 0,
              "Actual Loops": 1,
              "Output": [
                "fof.faseof_fase_id",
                "fof.faseof_inicio"
              ],
              "One-Time Filter": "false",
              "Shared Hit Blocks": 0,
              "Shared Read Blocks": 0,
              "Shared Dirtied Blocks": 0,
              "Shared Written Blocks": 0,
              "Local Hit Blocks": 0,
              "Local Read Blocks": 0,
              "Local Dirtied Blocks": 0,
              "Local Written Blocks": 0,
              "Temp Read Blocks": 0,
              "Temp Written Blocks": 0
            }
          ]
        }
      ]
    },
    "Planning": {
      "Shared Hit Blocks": 26,
      "Shared Read Blocks": 0,
      "Shared Dirtied Blocks": 0,
      "Shared Written Blocks": 0,
      "Local Hit Blocks": 0,
      "Local Read Blocks": 0,
      "Local Dirtied Blocks": 0,
      "Local Written Blocks": 0,
      "Temp Read Blocks": 0,
      "Temp Written Blocks": 0
    },
    "Planning Time": 0.248,
    "Triggers": [],
    "Execution Time": 0.059
  }
]
```
