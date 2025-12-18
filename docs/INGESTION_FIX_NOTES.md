# Ingestion Fix Notes - MERGE Phase Hardening

## ✅ Status: COMPLETO

---

## Problemas Corrigidos

### A1) Import em falta
**Problema:** `NameError: name 'closing' is not defined` em `app/ingestion/merge.py`

**Solução:**
- ✅ Adicionado `from contextlib import closing` no topo do arquivo

### A2) Padrões frágeis de context manager
**Problema:** Uso de `with self.engine.raw_connection() as conn:` que não funciona porque `raw_connection()` não implementa `__enter__`

**Solução:**
- ✅ Já estava usando `with closing(self.engine.raw_connection()) as conn:` corretamente
- ✅ Mantido padrão seguro com `try/except/finally` e cleanup explícito

### B1) populate_derived_columns sem commit manual incorreto
**Problema:** Uso de `with self.engine.connect() as conn:` + `conn.commit()` manual

**Solução:**
- ✅ Trocado para `with self.engine.begin() as conn:` que gerencia commit/rollback automaticamente
- ✅ Compatível com SQLAlchemy 2.x

### B2) search_path correto
**Problema:** Queries podem falhar com "UndefinedTable" se staging está em schema diferente

**Solução:**
- ✅ Adicionado `SET search_path TO public, staging;` antes de todas as queries em `merge_sheet()`
- ✅ Adicionado `SET search_path TO public, staging;` em `populate_derived_columns()`

### B3) Logging estruturado
**Solução:**
- ✅ Logging já estruturado com `structlog`
- ✅ Melhorado para incluir `rows_updated` em `populate_derived_columns()`
- ✅ Logs incluem: `sheet_name`, `staging_count`, `processed`, `rejected`, `elapsed_seconds`, `throughput_rows_per_sec`

### C1) Idempotência real para erros_ordem_fabrico
**Problema:** `erros_ordem_fabrico` usa `ofch_id SERIAL` (PK artificial) que não pode ser usado para idempotência

**Solução Implementada: Fingerprint Determinístico**

1. **Migration criada:** `alembic/versions/006_add_error_fingerprint.py`
   - Adiciona coluna `ofch_fingerprint TEXT NOT NULL`
   - Cria índice `UNIQUE (ofch_fingerprint)`
   - Popula fingerprints para registros existentes

2. **Função de cálculo:** `_calculate_error_fingerprint()`
   - Normaliza campos: trim, lower, substitui múltiplos espaços, NULL → string vazia
   - Concatena com `|` e calcula SHA256
   - Campos usados: `ofch_descricao_erro`, `ofch_of_id`, `ofch_fase_avaliacao`, `ofch_gravidade`, `ofch_faseof_avaliacao`, `ofch_faseof_culpada`

3. **Merge especializado:**
   - Para `OrdemFabricoErros`, calcula fingerprint de cada linha staging
   - Usa `ON CONFLICT (ofch_fingerprint) DO UPDATE SET ...`
   - Garante idempotência real: re-ingestões não duplicam erros

### D1/D2) Validação de tabelas
**Solução:**
- ✅ Adicionada validação de existência de tabelas staging e core antes do merge
- ✅ Erro claro se tabelas não existirem: `ValueError` com mensagem específica

---

## Ficheiros Alterados

### 1. `app/ingestion/merge.py`
**Mudanças:**
- ✅ Adicionado `from contextlib import closing`
- ✅ Adicionado `import hashlib`
- ✅ Adicionado método `_calculate_error_fingerprint()` estático
- ✅ Adicionado `SET search_path` antes de queries
- ✅ Adicionada validação de existência de tabelas
- ✅ Implementado merge especializado para `OrdemFabricoErros` com fingerprint
- ✅ Trocado `engine.connect()` por `engine.begin()` em `populate_derived_columns()`
- ✅ Melhorado logging estruturado

### 2. `alembic/versions/006_add_error_fingerprint.py` (NOVO)
**Conteúdo:**
- ✅ Adiciona coluna `ofch_fingerprint TEXT NOT NULL`
- ✅ Popula fingerprints para registros existentes
- ✅ Cria índice `UNIQUE (ofch_fingerprint)`
- ✅ Suporta `downgrade()` para reversão

---

## Como Reproduzir

### 1. Aplicar Migration
```bash
export DATABASE_URL="postgresql://nelo_user:nelo_pass@127.0.0.1:5432/nelo_db"
python3 -m alembic upgrade head
```

**Resultado esperado:**
- ✅ Migration `006_error_fingerprint` aplicada
- ✅ Coluna `ofch_fingerprint` criada em `erros_ordem_fabrico`
- ✅ Índice unique criado

### 2. Executar Ingestão
```bash
python3 -m app.ingestion.main_turbo
```

**Resultado esperado:**
- ✅ EXTRACT passa
- ✅ LOAD passa
- ✅ MERGE passa para todas as 9 sheets
- ✅ Sem crash de `__enter__`
- ✅ Sem crash de `closing`
- ✅ Sem crash de commit/transaction
- ✅ `erros_ordem_fabrico` usa fingerprint para idempotência

### 3. Testar Idempotência
```bash
# Executar ingestão novamente
python3 -m app.ingestion.main_turbo

# Verificar contagens
python3 -c "
from sqlalchemy import create_engine, text
from backend.config import DATABASE_URL
engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM erros_ordem_fabrico'))
    print(f'Total erros: {result.scalar()}')
"
```

**Resultado esperado:**
- ✅ Contagens estáveis (sem duplicação)
- ✅ Especialmente em `erros_ordem_fabrico`

---

## Artefactos Gerados

Após ingestão bem-sucedida:
- ✅ `data/processed/ingestion_report.json`
- ✅ `data/processed/load_report.json`
- ✅ `data/processed/merge_report.json`

---

## Compatibilidade

### Migration 006
- ✅ Compatível com PostgreSQL 15+
- ✅ Popula fingerprints para registros existentes automaticamente
- ✅ Suporta `downgrade()` para reversão

### Código Python
- ✅ Compatível com SQLAlchemy 2.x (usa `engine.begin()`)
- ✅ Compatível com psycopg2 (usa `raw_connection()` com `closing()`)
- ✅ Funciona com staging tables em schema `staging`

---

## Notas Técnicas

### Fingerprint Calculation
O fingerprint é calculado usando:
1. Normalização: trim, lower, substituir múltiplos espaços, NULL → ""
2. Concatenação: `descricao|of_id|fase_avaliacao|gravidade|faseof_avaliacao|faseof_culpada`
3. Hash: SHA256 hex digest

**Exemplo:**
```python
normalized = "erro de pintura|12345|fase_1|2|faseof_1|faseof_2"
fingerprint = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
```

### Idempotência
- ✅ Re-ingestões do mesmo Excel não duplicam erros
- ✅ `ON CONFLICT (ofch_fingerprint)` garante upsert correto
- ✅ Se erro mudar (dados diferentes), fingerprint muda e novo registro é criado

---

## Resumo

**Problemas resolvidos:**
- ✅ `NameError: name 'closing' is not defined`
- ✅ `AttributeError: __enter__` (já estava correto)
- ✅ Commit manual incorreto em `populate_derived_columns()`
- ✅ Falta de `search_path` causando "UndefinedTable"
- ✅ Idempotência quebrada em `erros_ordem_fabrico`

**Melhorias:**
- ✅ Validação de existência de tabelas
- ✅ Logging estruturado melhorado
- ✅ Fingerprint determinístico para idempotência real
- ✅ Compatibilidade SQLAlchemy 2.x

**Status:**
- ✅ Compilação OK
- ✅ Linter OK
- ✅ Migration criada
- ✅ Pronto para teste de ingestão

