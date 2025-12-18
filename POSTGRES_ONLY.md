# PostgreSQL Only - PRODPLAN 4.0 OS

## Porquê PostgreSQL é Obrigatório

O projeto **REQUER PostgreSQL 15+** e não suporta SQLite. As migrations e features usam funcionalidades específicas do PostgreSQL:

1. **PARTITION BY RANGE / HASH**: Particionamento declarativo (PostgreSQL 10+)
2. **Índices com INCLUDE**: Para evitar heap fetches (PostgreSQL 11+)
3. **UNLOGGED tables**: Para staging tables rápidas
4. **MATERIALIZED VIEW CONCURRENTLY**: Refresh sem locks (PostgreSQL 9.4+)
5. **Features avançadas**: JSONB, arrays, window functions

## Como Correr com Docker

### Bootstrap Automatizado (Recomendado)

```bash
./scripts/bootstrap_postgres.sh
```

Este script:
- Inicia PostgreSQL via Docker Compose
- Aguarda DB ficar ready
- Aplica migrations
- Valida pré-requisitos
- Roda release gate

### Manual

```bash
# 1. Iniciar PostgreSQL
docker compose up -d db

# 2. Configurar DATABASE_URL
export DATABASE_URL="postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"

# 3. Aplicar migrations
alembic upgrade head

# 4. Validar
python scripts/validate_prerequisites.py
```

## Diagnóstico de Falhas Comuns

### Erro: "DATABASE_URL is required"

**Causa**: DATABASE_URL não está configurado

**Solução**:
```bash
export DATABASE_URL="postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"
# ou criar .env com DATABASE_URL
```

### Erro: "DATABASE_URL points to SQLite"

**Causa**: DATABASE_URL está configurado para SQLite

**Solução**: SQLite não é suportado. Configure PostgreSQL:
```bash
export DATABASE_URL="postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"
```

### Erro: "PostgreSQL versão X detectada (recomendado: 15+)"

**Causa**: Versão PostgreSQL < 15

**Solução**: Atualizar para PostgreSQL 15+:
```bash
# Docker
docker compose pull db
docker compose up -d db

# Local
# Atualizar PostgreSQL para versão 15+
```

### Erro: "PostgreSQL connection failed"

**Causa**: PostgreSQL não está rodando ou DATABASE_URL incorreto

**Solução**:
```bash
# Verificar se está rodando
docker compose ps db

# Verificar logs
docker compose logs db

# Reiniciar
docker compose restart db
```

### Erro: "Porta 5432 ocupada"

**Causa**: Outro serviço está usando a porta 5432

**Solução**:
```bash
# Verificar o que está usando a porta
lsof -i :5432

# Parar serviço conflitante ou mudar porta no docker-compose.yml
```

### Erro: "Release gate failed"

**Causa**: Validações críticas falharam

**Solução**:
1. Verificar `docs/RELEASE_BLOCKED.md`
2. Corrigir problemas reportados
3. Re-executar: `python scripts/release_gate.py`

## Validação

Para validar que tudo está OK:

```bash
# Validar pré-requisitos
python scripts/validate_prerequisites.py

# Rodar release gate
python scripts/release_gate.py

# Verificar migrations
alembic current
```

## Notas Importantes

1. **SQLite não funciona** - migrations falham imediatamente se SQLite for detectado
2. **PostgreSQL 15+ é obrigatório** - versões anteriores podem ter problemas
3. **Docker é recomendado** - facilita setup e isolamento
4. **DATABASE_URL deve ser configurado** antes de qualquer operação

---

**Última atualização**: 2025-12-17
