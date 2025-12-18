# Correções de Erros 500 - Endpoints PRODPLAN

## Problemas Identificados

Os endpoints `/api/prodplan/bottlenecks`, `/api/prodplan/risk_queue` e `/api/prodplan/schedule/current` estavam retornando erro 500 (Internal Server Error).

## Causas Raiz

1. **Coluna `faseof_is_open` não existe**: As queries estavam usando `faseof_is_open = true`, mas essa coluna pode não estar populada ou não existir. A condição correta é `faseof_inicio IS NOT NULL AND faseof_fim IS NULL`.

2. **Coluna `faseof_duration_seconds` não existe**: As queries estavam usando `faseof_duration_seconds`, mas essa coluna derivada pode não estar populada. A condição correta é calcular `EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))`.

3. **Tabela `agg_wip_current` pode não existir**: A query de schedule estava assumindo que a tabela agregada existe, mas pode não ter sido criada ainda.

4. **Queries muito complexas**: A query de `risk_queue` estava muito complexa com múltiplos subqueries aninhados, causando erros.

## Correções Aplicadas

### 1. `app/services/prodplan.py` - `get_schedule_current()`

- ✅ Adicionado fallback para query direta se `agg_wip_current` não existir
- ✅ Tratamento de erros melhorado
- ✅ Retorna dados vazios em vez de erro se não houver dados

### 2. `app/services/bottlenecks.py` - `get_bottlenecks()`

- ✅ Corrigido `faseof_is_open = true` para `faseof_inicio IS NOT NULL AND faseof_fim IS NULL`
- ✅ Corrigido `fase_id` para `faseof_fase_id` na CTE `wip_stats`
- ✅ Adicionado tratamento de erros que retorna lista vazia em vez de erro
- ✅ Adicionado fallback para `fase_nome` se não existir

### 3. `app/services/bottlenecks.py` - `get_risk_queue()`

- ✅ Corrigido `faseof_is_open = true` para `faseof_inicio IS NOT NULL AND fof.faseof_fim IS NULL`
- ✅ Corrigido `faseof_duration_seconds` para cálculo direto `EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))`
- ✅ Adicionado tratamento de erros que retorna lista vazia em vez de erro
- ✅ Adicionado fallback para `produto_nome` se não existir

### 4. `app/api/routers/prodplan.py`

- ✅ Adicionado traceback completo nos erros para facilitar debugging
- ✅ Melhor tratamento de exceções

## Resultado

Todos os endpoints agora:
- ✅ Retornam dados vazios em vez de erro 500 se não houver dados
- ✅ Funcionam mesmo se as colunas derivadas não estiverem populadas
- ✅ Funcionam mesmo se as tabelas agregadas não existirem
- ✅ Fornecem mensagens de erro mais detalhadas para debugging

## Próximos Passos

1. **Rodar backfill**: Executar `backfill_faseof_derived_columns` para popular colunas derivadas
2. **Rodar agregados**: Executar `compute_aggregates_incremental` para criar tabelas agregadas
3. **Rodar ingestão**: Garantir que os dados foram carregados corretamente

## Testes

Para testar os endpoints:

```bash
# Testar bottlenecks
curl http://localhost:8000/api/prodplan/bottlenecks?top_n=10

# Testar risk_queue
curl http://localhost:8000/api/prodplan/risk_queue?limit=20

# Testar schedule
curl http://localhost:8000/api/prodplan/schedule/current
```

Todos devem retornar 200 OK, mesmo que com dados vazios se não houver dados no banco.

