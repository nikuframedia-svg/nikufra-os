# Migration Partitioning Fix - Relatório Final

## ✅ Status: COMPLETO

---

## Causa Exata do Bug

**Problema**: A tabela `erros_ordem_fabrico` estava sendo criada com `PARTITION BY RANGE (criado_em)` na migration 001, mas as partições estavam sendo criadas com sintaxe **HASH** (`FOR VALUES WITH (modulus 32, remainder {i})`).

**Erro PostgreSQL**:
```
psycopg2.errors.InvalidTableDefinition: invalid bound specification for a range partition
CREATE TABLE erros_ordem_fabrico_p_0 PARTITION OF erros_ordem_fabrico FOR VALUES WITH (modulus 32, remainder 0);
```

**Causa raiz**: Inconsistência entre o tipo de particionamento do PARENT (`RANGE`) e a sintaxe das partições (`HASH`).

---

## Correções Implementadas

### 1. Migration 001 (`001_initial_schema_with_partitioning.py`)

**Antes:**
```sql
CREATE TABLE erros_ordem_fabrico (
    ...
    PRIMARY KEY (erro_id, criado_em),
    ...
) PARTITION BY RANGE (criado_em);
```

**Depois:**
```sql
CREATE TABLE erros_ordem_fabrico (
    ...
    PRIMARY KEY (erro_id, erro_of_id),
    ...
) PARTITION BY HASH (erro_of_id);
```

**Mudanças:**
- ✅ `PARTITION BY RANGE (criado_em)` → `PARTITION BY HASH (erro_of_id)`
- ✅ PK ajustada: `(erro_id, criado_em)` → `(erro_id, erro_of_id)` (inclui coluna de hash)
- ✅ Índices corrigidos para usar nomes corretos (`erro_*` em vez de `ofch_*` na migration 001)
- ✅ Adicionado `IF NOT EXISTS` para tabelas staging (evita erros em re-runs)

### 2. Migration 002 (`002_materialized_views.py`)

**Correção adicional:**
- ✅ Corrigido `modelo_id` → `produto_id` nas materialized views (2 ocorrências)

### 3. Migration 003 (`003_corrected_schema_from_real_headers.py`)

**Mudanças:**
- ✅ Recriação de índices após renomeação de colunas (`erro_*` → `ofch_*`)
- ✅ Renomeações condicionais (verificam se colunas existem antes de renomear)
- ✅ Removida tentativa de renomear coluna que faz parte da partition key

### 4. Script `migrate_from_zero.py`

**Melhorias:**
- ✅ Aplica migrations até `003_corrected` (onde está o fix)
- ✅ Valida tabelas em schemas corretos (`public` e `staging`)
- ✅ Valida estratégia de particionamento (HASH vs RANGE)
- ✅ Valida número de partições (32 para erros, 16 para funcionarios, 72 para fases)
- ✅ Drop correto de schemas (`public` e `staging`)

### 5. Script `release_gate.py`

**Melhorias:**
- ✅ Mensagens de erro claras quando `alembic_version` não existe
- ✅ Validação de tabelas particionadas usando `pg_class` (não `pg_partitions` que não existe)
- ✅ Validação de número de partições HASH
- ✅ Lista de tabelas core em falta quando migrations não aplicaram

---

## Validação Completa

### Comandos Executados

```bash
# 1. Reset completo
docker compose down -v
docker compose up -d db redis

# 2. Aplicar migrations
export DATABASE_URL="postgresql://nelo_user:nelo_pass@127.0.0.1:5432/nelo_db"
export DATABASE_URL_HOST="postgresql://nelo_user:nelo_pass@127.0.0.1:5432/nelo_db"
python3 -m alembic upgrade 003_corrected

# 3. Testar script de validação
python3 scripts/migrate_from_zero.py
```

### Resultados

✅ **Migration 001**: Passou sem erros
✅ **Migration 002**: Passou sem erros
✅ **Migration 003**: Passou sem erros
✅ **alembic_version**: `003_corrected` confirmado
✅ **migrate_from_zero.py**: Passou completamente

### Estado das Tabelas Particionadas

**erros_ordem_fabrico:**
- ✅ Partition key: `HASH (ofch_of_id)` ✅ CORRETO
- ✅ 32 partições HASH criadas
- ✅ PK: `(erro_id, ofch_of_id)`

**funcionarios_fase_ordem_fabrico:**
- ✅ Partition key: `HASH (funcionariofaseof_faseof_id)` ✅ CORRETO
- ✅ 16 partições HASH criadas

**fases_ordem_fabrico:**
- ✅ Partition key: `RANGE (faseof_fim)` ✅ CORRETO
- ✅ 72 partições RANGE (mensais) criadas

### Tabelas Core Criadas

✅ `ordens_fabrico`
✅ `fases_ordem_fabrico` (RANGE partitioned)
✅ `funcionarios_fase_ordem_fabrico` (HASH partitioned)
✅ `erros_ordem_fabrico` (HASH partitioned) ✅ **CORRIGIDO**
✅ `ingestion_runs`
✅ `funcionarios`, `fases_catalogo`, `modelos`
✅ Tabelas staging em `staging.*`

---

## Ficheiros Alterados

1. `alembic/versions/001_initial_schema_with_partitioning.py`
   - Linha 232: `PARTITION BY RANGE` → `PARTITION BY HASH (erro_of_id)`
   - Linha 225: PK ajustada
   - Linhas 243-248: Índices corrigidos
   - Linha 348: `IF NOT EXISTS` para staging tables

2. `alembic/versions/002_materialized_views.py`
   - Linhas 24, 33, 37, 49, 61, 65: `modelo_id` → `produto_id`

3. `alembic/versions/003_corrected_schema_from_real_headers.py`
   - Linhas 130-142: Recriação de índices após renomeação
   - Linhas 39-63: Renomeações condicionais
   - Linhas 79-82: Removida tentativa de renomear partition key

4. `scripts/migrate_from_zero.py`
   - Aplica até `003_corrected`
   - Valida schemas corretos
   - Valida particionamento

5. `scripts/release_gate.py`
   - Mensagens de erro claras
   - Validação usando `pg_class`
   - Validação de partições

---

## Critérios de Aceitação

### ✅ Todos Passam

1. ✅ `python3 -m alembic upgrade 003_corrected` termina sem erro
2. ✅ `alembic_version` existe e contém `003_corrected`
3. ✅ `erros_ordem_fabrico` existe com `PARTITION BY HASH (ofch_of_id)`
4. ✅ 32 partições HASH criadas para `erros_ordem_fabrico`
5. ✅ `python3 scripts/migrate_from_zero.py` passa
6. ✅ O erro `invalid bound specification for a range partition` desapareceu completamente

---

## Comandos que Passam

```bash
# Aplicar migrations
python3 -m alembic upgrade 003_corrected
# ✅ Passa sem erros

# Validar schema
python3 scripts/migrate_from_zero.py
# ✅ Passa completamente

# Verificar estado
docker compose exec -T db psql -U nelo_user -d nelo_db -c "SELECT * FROM alembic_version;"
# ✅ Retorna: 003_corrected

docker compose exec -T db psql -U nelo_user -d nelo_db -c "\d erros_ordem_fabrico"
# ✅ Mostra: Partition key: HASH (ofch_of_id)
```

---

## Resumo

**Causa**: Inconsistência entre `PARTITION BY RANGE` no parent e `FOR VALUES WITH (modulus...)` nas partições.

**Fix**: Mudado para `PARTITION BY HASH (erro_of_id)` e ajustada PK para incluir coluna de hash.

**Resultado**: Migrations 001-003 aplicam corretamente numa base vazia, tabela `erros_ordem_fabrico` criada com 32 partições HASH, script de validação passa.

