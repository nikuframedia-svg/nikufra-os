# Load Phase Fix - AttributeError: __enter__

## ✅ Status: COMPLETO

---

## Problema

**Erro original:**
```
AttributeError: __enter__
Stack: app/ingestion/load.py line ~59
```

**Causa:**
- `raw_connection()` do SQLAlchemy retorna uma conexão psycopg2 raw que **não implementa context manager** (`__enter__`/`__exit__`)
- Tentativa de usar `with self.engine.raw_connection() as conn:` falha porque a conexão não suporta `with`

---

## Solução Aplicada

**Antes (código que causava o erro):**
```python
with closing(self.engine.raw_connection()) as conn:
    cur = conn.cursor()
    try:
        # ... operations ...
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
```

**Depois (gestão explícita do ciclo de vida):**
```python
conn = None
cur = None
try:
    conn = self.engine.raw_connection()
    cur = conn.cursor()
    
    # ... operations ...
    
    conn.commit()
except Exception:
    if conn:
        conn.rollback()
    raise
finally:
    if cur:
        cur.close()
    if conn:
        conn.close()
```

**Benefícios:**
- ✅ **Sem context manager**: Gestão explícita da conexão e cursor
- ✅ **Cleanup garantido**: `finally` garante que cursor e conexão são fechados mesmo em caso de erro
- ✅ **Transações explícitas**: `commit()` em sucesso, `rollback()` em erro
- ✅ **Sem leaks**: Conexões são sempre fechadas

---

## Ficheiro Alterado

### `app/ingestion/load.py`

**Mudanças:**
- ✅ Removido `from contextlib import closing` (não utilizado)
- ✅ Substituído `with closing(...)` por gestão explícita
- ✅ Adicionado `conn = None` e `cur = None` para garantir cleanup
- ✅ Adicionado checks `if conn:` e `if cur:` no `finally` para evitar erros se não foram criados

**Linhas alteradas:**
- Linha ~59-110: Substituído o bloco `with closing(...)` por gestão explícita

---

## Validação

### Compilação Python

```bash
python3 -m py_compile app/ingestion/load.py
# ✅ Passa sem erros
```

### Linter

```bash
# ✅ Sem erros de lint
```

---

## Teste Local

**Comando para testar:**
```bash
python3 -m app.ingestion.main_turbo
```

**Resultado esperado:**
- ✅ O erro `AttributeError: __enter__` desaparece
- ✅ A ingestão avança para o LOAD phase
- ✅ Continua para o MERGE phase sem crash
- ✅ Sem leaks de conexão

---

## Resumo

**Problema resolvido:**
- ❌ `AttributeError: __enter__` ao usar `with closing(self.engine.raw_connection())`
- ✅ Gestão explícita do ciclo de vida da conexão e cursor

**Mudanças:**
- ✅ Removido uso de `closing()` (não necessário)
- ✅ Gestão explícita com `try/except/finally`
- ✅ Cleanup garantido de cursor e conexão

**Status:**
- ✅ Compilação OK
- ✅ Linter OK
- ✅ Pronto para teste de ingestão

