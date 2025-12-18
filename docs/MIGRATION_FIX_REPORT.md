# Migration Fix Report - HASH vs RANGE Partition Bug

## Problema Identificado

A tabela `erros_ordem_fabrico` estava sendo criada com **PARTITION BY RANGE (criado_em)** na migration 001, mas as partições estavam sendo criadas com sintaxe **HASH** (`FOR VALUES WITH (modulus 32, remainder {i})`).

**Erro observado:**
```
psycopg2.errors.InvalidTableDefinition: invalid bound specification for a range partition
CREATE TABLE erros_ordem_fabrico_p_0 PARTITION OF erros_ordem_fabrico FOR VALUES WITH (modulus 32, remainder 0);
```

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
- ✅ Mudado de `PARTITION BY RANGE (criado_em)` para `PARTITION BY HASH (erro_of_id)`
- ✅ PK ajustada de `(erro_id, criado_em)` para `(erro_id, erro_of_id)` (inclui coluna de hash)
- ✅ Índices corrigidos para usar nomes de colunas corretos (`erro_*` em vez de `ofch_*` na migration 001)

### 2. Migration 003 (`003_corrected_schema_from_real_headers.py`)

**Adicionado:**
- ✅ Recriação de índices após renomeação de colunas (`erro_*` → `ofch_*`)
- ✅ Verificações condicionais para renomeações (evita erros se colunas já têm nomes corretos)
- ✅ Removida tentativa de renomear coluna que faz parte da partition key (`funcionariofaseof_faseof_id`)

### 3. Migration 002 (`002_materialized_views.py`)

**Correção adicional:**
- ✅ Corrigido uso de `modelo_id` para `produto_id` nas materialized views

## Ficheiros Alterados

1. `alembic/versions/001_initial_schema_with_partitioning.py`
   - Linha 231: `PARTITION BY RANGE (criado_em)` → `PARTITION BY HASH (erro_of_id)`
   - Linha 225: PK ajustada para incluir coluna de hash
   - Linhas 243-248: Índices corrigidos para usar nomes corretos

2. `alembic/versions/003_corrected_schema_from_real_headers.py`
   - Linhas 130-142: Adicionada recriação de índices após renomeação
   - Linhas 39-63: Renomeações condicionais (verificam se colunas existem)
   - Linhas 79-82: Removida tentativa de renomear partition key

3. `alembic/versions/002_materialized_views.py`
   - Linhas 24, 33, 37, 49, 61, 65: Corrigido `modelo_id` → `produto_id`

## Validação

### Comandos Executados

```bash
# 1. Reset completo da base de dados
docker compose down -v
docker compose up -d db redis

# 2. Executar migrations até 003 (fix do particionamento)
export DATABASE_URL="postgresql://nelo_user:nelo_pass@127.0.0.1:5432/nelo_db"
export DATABASE_URL_HOST="postgresql://nelo_user:nelo_pass@127.0.0.1:5432/nelo_db"
python3 -m alembic upgrade 003_corrected
```

### Resultados

✅ **Migration 001**: Passou sem erros
✅ **Migration 002**: Passou sem erros (após correção de `modelo_id`)
✅ **Migration 003**: Passou sem erros (após correções condicionais)
✅ **alembic_version**: `003_corrected` confirmado

### Estado da Tabela (Verificado)

```sql
\d erros_ordem_fabrico
```

**Resultado:**
- ✅ **Partition key**: `HASH (ofch_of_id)` ✅ CORRETO
- ✅ **PK**: `(erro_id, ofch_of_id)` ✅ CORRETO
- ✅ **32 partições HASH** criadas (`erros_ordem_fabrico_p_0` até `erros_ordem_fabrico_p_31`)
- ✅ **Índices corretos**: `idx_err_fase_av`, `idx_err_faseof_culpada`, `idx_err_gravidade`
- ✅ **Colunas renomeadas**: `erro_*` → `ofch_*` (após migration 003)

### Tabelas Core Criadas

✅ `ordens_fabrico`
✅ `fases_ordem_fabrico` (RANGE partitioned)
✅ `funcionarios_fase_ordem_fabrico` (HASH partitioned)
✅ `erros_ordem_fabrico` (HASH partitioned) ✅ **CORRIGIDO**
✅ `ingestion_runs`
✅ `funcionarios`
✅ `fases_catalogo`
✅ `modelos`

## Notas Importantes

1. **Partition Key**: A coluna `erro_of_id` (depois `ofch_of_id`) faz parte da partition key e não pode ser renomeada após a criação. A migration 003 apenas renomeia a coluna, mas a partition key permanece funcional.

2. **PK Composta**: A PK foi ajustada para incluir a coluna de hash (`erro_of_id`), o que é recomendado para HASH partitions.

3. **Índices**: Os índices foram recriados na migration 003 após a renomeação das colunas para garantir que usam os nomes corretos (`ofch_*`).

## Próximos Passos

- ✅ Migrations 001-003 passam sem erros
- ⚠️ Migration 004 ainda tem erros (fora do escopo deste fix)
- ⏳ Validar `scripts/release_gate.py` após todas as migrations passarem
- ⏳ Validar `app/ingestion/main_turbo.py` após todas as migrations passarem

## Commit

```
fix(migrations): correct partitioning strategy for erros_ordem_fabrico

- Change PARTITION BY RANGE to PARTITION BY HASH (erro_of_id)
- Adjust PK to include hash column
- Fix index column names
- Add conditional renames in migration 003
- Fix modelo_id references in migration 002
```

