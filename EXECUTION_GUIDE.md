# Guia de Execução - PRODPLAN 4.0 OS

## ⚠️ PRÉ-REQUISITOS OBRIGATÓRIOS

### 1. PostgreSQL 15+

As migrations **REQUEREM PostgreSQL** (não funcionam com SQLite):
- Usam `PARTITION BY RANGE` e `PARTITION BY HASH`
- Usam índices com `INCLUDE`
- Usam `UNLOGGED` tables
- Usam `MATERIALIZED VIEW`

**Configurar DATABASE_URL:**

```bash
# Criar .env ou export
export DATABASE_URL="postgresql://user:password@localhost:5432/nelo_db"
```

Ou criar `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/nelo_db
FOLHA_IA_PATH=data/raw/Folha_IA.xlsx
```

### 2. Excel File

Colocar `Folha_IA.xlsx` em `data/raw/`:
```bash
mkdir -p data/raw
# Copiar Folha_IA.xlsx para data/raw/
```

### 3. Dependências Python

```bash
pip install -r requirements.txt
```

## 🚀 EXECUÇÃO PASSO A PASSO

### Passo 0: Validar Pré-requisitos

```bash
python scripts/validate_prerequisites.py
```

**Deve retornar:**
- ✅ DATABASE_URL configurado (PostgreSQL)
- ✅ Conexão PostgreSQL OK
- ✅ Excel file encontrado

### Passo 1: Aplicar Migrations

```bash
# Verificar se PostgreSQL está rodando
psql $DATABASE_URL -c "SELECT version();"

# Aplicar migrations
export PATH="/Users/martimnicolau/Library/Python/3.9/bin:$PATH"  # ou ajustar PATH
alembic upgrade head
```

**Se falhar:**
- Verificar se PostgreSQL está rodando
- Verificar se DATABASE_URL está correto
- Verificar se database existe: `createdb nelo_db` (se necessário)

### Passo 2: Rodar Release Gate

```bash
python scripts/release_gate.py
```

**Esperado:**
- ✅ Todas as validações passam
- Exit code 0

**Se falhar:**
- Verificar `docs/CRITICAL_MISMATCHES.md` (se existir)
- Corrigir problemas reportados

### Passo 3: Bootstrap Completo

```bash
make bootstrap
```

**Isso executa:**
1. `make migrate` → Aplica migrations
2. `make ingest` → Roda ingestão turbo
3. `make backfill` → Roda backfill jobs
4. `make aggregates` → Computa aggregates

### Passo 4: Verificar

```bash
make verify
```

**Isso executa:**
1. Verifica migrations
2. Valida contagens
3. Roda testes de integridade

## 🔧 TROUBLESHOOTING

### Erro: "DATABASE_URL está configurado para SQLite"

**Solução:**
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/nelo_db"
# ou criar .env com DATABASE_URL
```

### Erro: "PostgreSQL connection failed"

**Soluções:**
1. Verificar se PostgreSQL está rodando:
   ```bash
   pg_isready
   ```

2. Verificar se database existe:
   ```bash
   psql -l | grep nelo_db
   # Se não existir:
   createdb nelo_db
   ```

3. Verificar credenciais em DATABASE_URL

### Erro: "Excel file não encontrado"

**Solução:**
```bash
mkdir -p data/raw
# Copiar Folha_IA.xlsx para data/raw/
ls -lh data/raw/Folha_IA.xlsx
```

### Erro: "alembic: command not found"

**Soluções:**
1. Instalar alembic:
   ```bash
   pip install alembic
   ```

2. Usar caminho completo:
   ```bash
   export PATH="/Users/martimnicolau/Library/Python/3.9/bin:$PATH"
   alembic upgrade head
   ```

3. Ou usar python -m:
   ```bash
   python -m alembic upgrade head
   ```

### Erro: "CRITICAL_MISMATCHES.md encontrado"

**Ação:**
1. Ler `docs/CRITICAL_MISMATCHES.md`
2. Investigar causas
3. Corrigir problemas
4. Re-executar ingestão
5. Re-validar

## 📋 CHECKLIST RÁPIDO

Antes de executar:

- [ ] PostgreSQL 15+ instalado e rodando
- [ ] DATABASE_URL configurado (PostgreSQL, não SQLite)
- [ ] Database criado (`createdb nelo_db`)
- [ ] Excel file em `data/raw/Folha_IA.xlsx`
- [ ] Dependências instaladas (`pip install -r requirements.txt`)
- [ ] Alembic instalado (`pip install alembic`)

## 🎯 COMANDOS RÁPIDOS

```bash
# Validar pré-requisitos
python scripts/validate_prerequisites.py

# Aplicar migrations
alembic upgrade head

# Rodar release gate
python scripts/release_gate.py

# Bootstrap completo
make bootstrap

# Verificar
make verify
```

---

**Última atualização**: 2025-12-17

