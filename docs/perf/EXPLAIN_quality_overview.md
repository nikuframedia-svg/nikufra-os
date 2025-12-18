# EXPLAIN Plan: quality_overview

**Generated**: 2025-12-18T08:56:22.484267

## Query

```sql
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
```

## Plan (Text)

```
Limit  (cost=489.72..489.84 rows=50 width=162) (actual time=0.137..0.144 rows=0 loops=1)
  Output: e.ofch_fase_avaliacao, e.ofch_faseof_culpada, (count(*)), (avg(e.ofch_gravidade))
  ->  Sort  (cost=489.72..491.15 rows=573 width=162) (actual time=0.136..0.143 rows=0 loops=1)
        Output: e.ofch_fase_avaliacao, e.ofch_faseof_culpada, (count(*)), (avg(e.ofch_gravidade))
        Sort Key: (count(*)) DESC
        Sort Method: quicksort  Memory: 25kB
        ->  HashAggregate  (cost=463.52..470.68 rows=573 width=162) (actual time=0.124..0.131 rows=0 loops=1)
              Output: e.ofch_fase_avaliacao, e.ofch_faseof_culpada, count(*), avg(e.ofch_gravidade)
              Group Key: e.ofch_fase_avaliacao, e.ofch_faseof_culpada
              Batches: 1  Memory Usage: 49kB
              ->  Append  (cost=0.00..406.24 rows=5728 width=126) (actual time=0.118..0.124 rows=0 loops=1)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_0 e_1  (cost=0.00..11.80 rows=179 width=126) (actual time=0.004..0.004 rows=0 loops=1)
                          Output: e_1.ofch_fase_avaliacao, e_1.ofch_faseof_culpada, e_1.ofch_gravidade
                          Filter: (e_1.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_1 e_2  (cost=0.00..11.80 rows=179 width=126) (actual time=0.006..0.006 rows=0 loops=1)
                          Output: e_2.ofch_fase_avaliacao, e_2.ofch_faseof_culpada, e_2.ofch_gravidade
                          Filter: (e_2.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_2 e_3  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_3.ofch_fase_avaliacao, e_3.ofch_faseof_culpada, e_3.ofch_gravidade
                          Filter: (e_3.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_3 e_4  (cost=0.00..11.80 rows=179 width=126) (actual time=0.002..0.002 rows=0 loops=1)
                          Output: e_4.ofch_fase_avaliacao, e_4.ofch_faseof_culpada, e_4.ofch_gravidade
                          Filter: (e_4.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_4 e_5  (cost=0.00..11.80 rows=179 width=126) (actual time=0.005..0.005 rows=0 loops=1)
                          Output: e_5.ofch_fase_avaliacao, e_5.ofch_faseof_culpada, e_5.ofch_gravidade
                          Filter: (e_5.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_5 e_6  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_6.ofch_fase_avaliacao, e_6.ofch_faseof_culpada, e_6.ofch_gravidade
                          Filter: (e_6.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_6 e_7  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_7.ofch_fase_avaliacao, e_7.ofch_faseof_culpada, e_7.ofch_gravidade
                          Filter: (e_7.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_7 e_8  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_8.ofch_fase_avaliacao, e_8.ofch_faseof_culpada, e_8.ofch_gravidade
                          Filter: (e_8.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_8 e_9  (cost=0.00..11.80 rows=179 width=126) (actual time=0.005..0.005 rows=0 loops=1)
                          Output: e_9.ofch_fase_avaliacao, e_9.ofch_faseof_culpada, e_9.ofch_gravidade
                          Filter: (e_9.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_9 e_10  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_10.ofch_fase_avaliacao, e_10.ofch_faseof_culpada, e_10.ofch_gravidade
                          Filter: (e_10.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_10 e_11  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_11.ofch_fase_avaliacao, e_11.ofch_faseof_culpada, e_11.ofch_gravidade
                          Filter: (e_11.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_11 e_12  (cost=0.00..11.80 rows=179 width=126) (actual time=0.004..0.004 rows=0 loops=1)
                          Output: e_12.ofch_fase_avaliacao, e_12.ofch_faseof_culpada, e_12.ofch_gravidade
                          Filter: (e_12.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_12 e_13  (cost=0.00..11.80 rows=179 width=126) (actual time=0.006..0.006 rows=0 loops=1)
                          Output: e_13.ofch_fase_avaliacao, e_13.ofch_faseof_culpada, e_13.ofch_gravidade
                          Filter: (e_13.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_13 e_14  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_14.ofch_fase_avaliacao, e_14.ofch_faseof_culpada, e_14.ofch_gravidade
                          Filter: (e_14.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_14 e_15  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_15.ofch_fase_avaliacao, e_15.ofch_faseof_culpada, e_15.ofch_gravidade
                          Filter: (e_15.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_15 e_16  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_16.ofch_fase_avaliacao, e_16.ofch_faseof_culpada, e_16.ofch_gravidade
                          Filter: (e_16.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_16 e_17  (cost=0.00..11.80 rows=179 width=126) (actual time=0.006..0.006 rows=0 loops=1)
                          Output: e_17.ofch_fase_avaliacao, e_17.ofch_faseof_culpada, e_17.ofch_gravidade
                          Filter: (e_17.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_17 e_18  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_18.ofch_fase_avaliacao, e_18.ofch_faseof_culpada, e_18.ofch_gravidade
                          Filter: (e_18.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_18 e_19  (cost=0.00..11.80 rows=179 width=126) (actual time=0.004..0.004 rows=0 loops=1)
                          Output: e_19.ofch_fase_avaliacao, e_19.ofch_faseof_culpada, e_19.ofch_gravidade
                          Filter: (e_19.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_19 e_20  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_20.ofch_fase_avaliacao, e_20.ofch_faseof_culpada, e_20.ofch_gravidade
                          Filter: (e_20.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_20 e_21  (cost=0.00..11.80 rows=179 width=126) (actual time=0.006..0.006 rows=0 loops=1)
                          Output: e_21.ofch_fase_avaliacao, e_21.ofch_faseof_culpada, e_21.ofch_gravidade
                          Filter: (e_21.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_21 e_22  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_22.ofch_fase_avaliacao, e_22.ofch_faseof_culpada, e_22.ofch_gravidade
                          Filter: (e_22.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_22 e_23  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_23.ofch_fase_avaliacao, e_23.ofch_faseof_culpada, e_23.ofch_gravidade
                          Filter: (e_23.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_23 e_24  (cost=0.00..11.80 rows=179 width=126) (actual time=0.002..0.002 rows=0 loops=1)
                          Output: e_24.ofch_fase_avaliacao, e_24.ofch_faseof_culpada, e_24.ofch_gravidade
                          Filter: (e_24.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_24 e_25  (cost=0.00..11.80 rows=179 width=126) (actual time=0.005..0.005 rows=0 loops=1)
                          Output: e_25.ofch_fase_avaliacao, e_25.ofch_faseof_culpada, e_25.ofch_gravidade
                          Filter: (e_25.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_25 e_26  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_26.ofch_fase_avaliacao, e_26.ofch_faseof_culpada, e_26.ofch_gravidade
                          Filter: (e_26.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_26 e_27  (cost=0.00..11.80 rows=179 width=126) (actual time=0.004..0.004 rows=0 loops=1)
                          Output: e_27.ofch_fase_avaliacao, e_27.ofch_faseof_culpada, e_27.ofch_gravidade
                          Filter: (e_27.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_27 e_28  (cost=0.00..11.80 rows=179 width=126) (actual time=0.004..0.004 rows=0 loops=1)
                          Output: e_28.ofch_fase_avaliacao, e_28.ofch_faseof_culpada, e_28.ofch_gravidade
                          Filter: (e_28.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_28 e_29  (cost=0.00..11.80 rows=179 width=126) (actual time=0.007..0.007 rows=0 loops=1)
                          Output: e_29.ofch_fase_avaliacao, e_29.ofch_faseof_culpada, e_29.ofch_gravidade
                          Filter: (e_29.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_29 e_30  (cost=0.00..11.80 rows=179 width=126) (actual time=0.003..0.003 rows=0 loops=1)
                          Output: e_30.ofch_fase_avaliacao, e_30.ofch_faseof_culpada, e_30.ofch_gravidade
                          Filter: (e_30.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_30 e_31  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_31.ofch_fase_avaliacao, e_31.ofch_faseof_culpada, e_31.ofch_gravidade
                          Filter: (e_31.ofch_fase_avaliacao IS NOT NULL)
                    ->  Seq Scan on public.erros_ordem_fabrico_p_31 e_32  (cost=0.00..11.80 rows=179 width=126) (actual time=0.001..0.001 rows=0 loops=1)
                          Output: e_32.ofch_fase_avaliacao, e_32.ofch_faseof_culpada, e_32.ofch_gravidade
                          Filter: (e_32.ofch_fase_avaliacao IS NOT NULL)
Planning:
  Buffers: shared hit=259
Planning Time: 2.249 ms
Execution Time: 0.441 ms
```

## Plan (JSON)

```json
[
  {
    "Plan": {
      "Node Type": "Limit",
      "Parallel Aware": false,
      "Async Capable": false,
      "Startup Cost": 489.72,
      "Total Cost": 489.84,
      "Plan Rows": 50,
      "Plan Width": 162,
      "Actual Startup Time": 0.131,
      "Actual Total Time": 0.137,
      "Actual Rows": 0,
      "Actual Loops": 1,
      "Output": [
        "e.ofch_fase_avaliacao",
        "e.ofch_faseof_culpada",
        "(count(*))",
        "(avg(e.ofch_gravidade))"
      ],
      "Shared Hit Blocks": 3,
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
          "Node Type": "Sort",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Async Capable": false,
          "Startup Cost": 489.72,
          "Total Cost": 491.15,
          "Plan Rows": 573,
          "Plan Width": 162,
          "Actual Startup Time": 0.127,
          "Actual Total Time": 0.133,
          "Actual Rows": 0,
          "Actual Loops": 1,
          "Output": [
            "e.ofch_fase_avaliacao",
            "e.ofch_faseof_culpada",
            "(count(*))",
            "(avg(e.ofch_gravidade))"
          ],
          "Sort Key": [
            "(count(*)) DESC"
          ],
          "Sort Method": "quicksort",
          "Sort Space Used": 25,
          "Sort Space Type": "Memory",
          "Shared Hit Blocks": 3,
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
              "Startup Cost": 463.52,
              "Total Cost": 470.68,
              "Plan Rows": 573,
              "Plan Width": 162,
              "Actual Startup Time": 0.069,
              "Actual Total Time": 0.075,
              "Actual Rows": 0,
              "Actual Loops": 1,
              "Output": [
                "e.ofch_fase_avaliacao",
                "e.ofch_faseof_culpada",
                "count(*)",
                "avg(e.ofch_gravidade)"
              ],
              "Group Key": [
                "e.ofch_fase_avaliacao",
                "e.ofch_faseof_culpada"
              ],
              "Planned Partitions": 0,
              "HashAgg Batches": 1,
              "Peak Memory Usage": 49,
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
                  "Node Type": "Append",
                  "Parent Relationship": "Outer",
                  "Parallel Aware": false,
                  "Async Capable": false,
                  "Startup Cost": 0.0,
                  "Total Cost": 406.24,
                  "Plan Rows": 5728,
                  "Plan Width": 126,
                  "Actual Startup Time": 0.063,
                  "Actual Total Time": 0.069,
                  "Actual Rows": 0,
                  "Actual Loops": 1,
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
                  "Subplans Removed": 0,
                  "Plans": [
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_0",
                      "Schema": "public",
                      "Alias": "e_1",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.006,
                      "Actual Total Time": 0.006,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_1.ofch_fase_avaliacao",
                        "e_1.ofch_faseof_culpada",
                        "e_1.ofch_gravidade"
                      ],
                      "Filter": "(e_1.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_1",
                      "Schema": "public",
                      "Alias": "e_2",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.003,
                      "Actual Total Time": 0.004,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_2.ofch_fase_avaliacao",
                        "e_2.ofch_faseof_culpada",
                        "e_2.ofch_gravidade"
                      ],
                      "Filter": "(e_2.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_2",
                      "Schema": "public",
                      "Alias": "e_3",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_3.ofch_fase_avaliacao",
                        "e_3.ofch_faseof_culpada",
                        "e_3.ofch_gravidade"
                      ],
                      "Filter": "(e_3.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_3",
                      "Schema": "public",
                      "Alias": "e_4",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_4.ofch_fase_avaliacao",
                        "e_4.ofch_faseof_culpada",
                        "e_4.ofch_gravidade"
                      ],
                      "Filter": "(e_4.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_4",
                      "Schema": "public",
                      "Alias": "e_5",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_5.ofch_fase_avaliacao",
                        "e_5.ofch_faseof_culpada",
                        "e_5.ofch_gravidade"
                      ],
                      "Filter": "(e_5.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_5",
                      "Schema": "public",
                      "Alias": "e_6",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.003,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_6.ofch_fase_avaliacao",
                        "e_6.ofch_faseof_culpada",
                        "e_6.ofch_gravidade"
                      ],
                      "Filter": "(e_6.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_6",
                      "Schema": "public",
                      "Alias": "e_7",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_7.ofch_fase_avaliacao",
                        "e_7.ofch_faseof_culpada",
                        "e_7.ofch_gravidade"
                      ],
                      "Filter": "(e_7.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_7",
                      "Schema": "public",
                      "Alias": "e_8",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_8.ofch_fase_avaliacao",
                        "e_8.ofch_faseof_culpada",
                        "e_8.ofch_gravidade"
                      ],
                      "Filter": "(e_8.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_8",
                      "Schema": "public",
                      "Alias": "e_9",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_9.ofch_fase_avaliacao",
                        "e_9.ofch_faseof_culpada",
                        "e_9.ofch_gravidade"
                      ],
                      "Filter": "(e_9.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_9",
                      "Schema": "public",
                      "Alias": "e_10",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_10.ofch_fase_avaliacao",
                        "e_10.ofch_faseof_culpada",
                        "e_10.ofch_gravidade"
                      ],
                      "Filter": "(e_10.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_10",
                      "Schema": "public",
                      "Alias": "e_11",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_11.ofch_fase_avaliacao",
                        "e_11.ofch_faseof_culpada",
                        "e_11.ofch_gravidade"
                      ],
                      "Filter": "(e_11.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_11",
                      "Schema": "public",
                      "Alias": "e_12",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_12.ofch_fase_avaliacao",
                        "e_12.ofch_faseof_culpada",
                        "e_12.ofch_gravidade"
                      ],
                      "Filter": "(e_12.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_12",
                      "Schema": "public",
                      "Alias": "e_13",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_13.ofch_fase_avaliacao",
                        "e_13.ofch_faseof_culpada",
                        "e_13.ofch_gravidade"
                      ],
                      "Filter": "(e_13.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_13",
                      "Schema": "public",
                      "Alias": "e_14",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.003,
                      "Actual Total Time": 0.003,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_14.ofch_fase_avaliacao",
                        "e_14.ofch_faseof_culpada",
                        "e_14.ofch_gravidade"
                      ],
                      "Filter": "(e_14.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_14",
                      "Schema": "public",
                      "Alias": "e_15",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_15.ofch_fase_avaliacao",
                        "e_15.ofch_faseof_culpada",
                        "e_15.ofch_gravidade"
                      ],
                      "Filter": "(e_15.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_15",
                      "Schema": "public",
                      "Alias": "e_16",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_16.ofch_fase_avaliacao",
                        "e_16.ofch_faseof_culpada",
                        "e_16.ofch_gravidade"
                      ],
                      "Filter": "(e_16.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_16",
                      "Schema": "public",
                      "Alias": "e_17",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_17.ofch_fase_avaliacao",
                        "e_17.ofch_faseof_culpada",
                        "e_17.ofch_gravidade"
                      ],
                      "Filter": "(e_17.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_17",
                      "Schema": "public",
                      "Alias": "e_18",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_18.ofch_fase_avaliacao",
                        "e_18.ofch_faseof_culpada",
                        "e_18.ofch_gravidade"
                      ],
                      "Filter": "(e_18.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_18",
                      "Schema": "public",
                      "Alias": "e_19",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_19.ofch_fase_avaliacao",
                        "e_19.ofch_faseof_culpada",
                        "e_19.ofch_gravidade"
                      ],
                      "Filter": "(e_19.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_19",
                      "Schema": "public",
                      "Alias": "e_20",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_20.ofch_fase_avaliacao",
                        "e_20.ofch_faseof_culpada",
                        "e_20.ofch_gravidade"
                      ],
                      "Filter": "(e_20.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_20",
                      "Schema": "public",
                      "Alias": "e_21",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_21.ofch_fase_avaliacao",
                        "e_21.ofch_faseof_culpada",
                        "e_21.ofch_gravidade"
                      ],
                      "Filter": "(e_21.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_21",
                      "Schema": "public",
                      "Alias": "e_22",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_22.ofch_fase_avaliacao",
                        "e_22.ofch_faseof_culpada",
                        "e_22.ofch_gravidade"
                      ],
                      "Filter": "(e_22.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_22",
                      "Schema": "public",
                      "Alias": "e_23",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_23.ofch_fase_avaliacao",
                        "e_23.ofch_faseof_culpada",
                        "e_23.ofch_gravidade"
                      ],
                      "Filter": "(e_23.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_23",
                      "Schema": "public",
                      "Alias": "e_24",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_24.ofch_fase_avaliacao",
                        "e_24.ofch_faseof_culpada",
                        "e_24.ofch_gravidade"
                      ],
                      "Filter": "(e_24.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_24",
                      "Schema": "public",
                      "Alias": "e_25",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.003,
                      "Actual Total Time": 0.003,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_25.ofch_fase_avaliacao",
                        "e_25.ofch_faseof_culpada",
                        "e_25.ofch_gravidade"
                      ],
                      "Filter": "(e_25.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_25",
                      "Schema": "public",
                      "Alias": "e_26",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_26.ofch_fase_avaliacao",
                        "e_26.ofch_faseof_culpada",
                        "e_26.ofch_gravidade"
                      ],
                      "Filter": "(e_26.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_26",
                      "Schema": "public",
                      "Alias": "e_27",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_27.ofch_fase_avaliacao",
                        "e_27.ofch_faseof_culpada",
                        "e_27.ofch_gravidade"
                      ],
                      "Filter": "(e_27.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_27",
                      "Schema": "public",
                      "Alias": "e_28",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_28.ofch_fase_avaliacao",
                        "e_28.ofch_faseof_culpada",
                        "e_28.ofch_gravidade"
                      ],
                      "Filter": "(e_28.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_28",
                      "Schema": "public",
                      "Alias": "e_29",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.002,
                      "Actual Total Time": 0.002,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_29.ofch_fase_avaliacao",
                        "e_29.ofch_faseof_culpada",
                        "e_29.ofch_gravidade"
                      ],
                      "Filter": "(e_29.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_29",
                      "Schema": "public",
                      "Alias": "e_30",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_30.ofch_fase_avaliacao",
                        "e_30.ofch_faseof_culpada",
                        "e_30.ofch_gravidade"
                      ],
                      "Filter": "(e_30.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_30",
                      "Schema": "public",
                      "Alias": "e_31",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_31.ofch_fase_avaliacao",
                        "e_31.ofch_faseof_culpada",
                        "e_31.ofch_gravidade"
                      ],
                      "Filter": "(e_31.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
                    },
                    {
                      "Node Type": "Seq Scan",
                      "Parent Relationship": "Member",
                      "Parallel Aware": false,
                      "Async Capable": false,
                      "Relation Name": "erros_ordem_fabrico_p_31",
                      "Schema": "public",
                      "Alias": "e_32",
                      "Startup Cost": 0.0,
                      "Total Cost": 11.8,
                      "Plan Rows": 179,
                      "Plan Width": 126,
                      "Actual Startup Time": 0.001,
                      "Actual Total Time": 0.001,
                      "Actual Rows": 0,
                      "Actual Loops": 1,
                      "Output": [
                        "e_32.ofch_fase_avaliacao",
                        "e_32.ofch_faseof_culpada",
                        "e_32.ofch_gravidade"
                      ],
                      "Filter": "(e_32.ofch_fase_avaliacao IS NOT NULL)",
                      "Rows Removed by Filter": 0,
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
            }
          ]
        }
      ]
    },
    "Planning": {
      "Shared Hit Blocks": 5820,
      "Shared Read Blocks": 97,
      "Shared Dirtied Blocks": 0,
      "Shared Written Blocks": 0,
      "Local Hit Blocks": 0,
      "Local Read Blocks": 0,
      "Local Dirtied Blocks": 0,
      "Local Written Blocks": 0,
      "Temp Read Blocks": 0,
      "Temp Written Blocks": 0
    },
    "Planning Time": 38.96,
    "Triggers": [],
    "Execution Time": 0.368
  }
]
```
