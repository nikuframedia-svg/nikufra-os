# Merge Hardening - Summary

## ✅ Implementado

### Fix 1: ingestion_runs sempre atualiza
- ✅ Método `_resolve_ingestion_runs_table()` para descobrir schema (public/core)
- ✅ `_update_ingestion_run_status()` usa `SET search_path` e raw connection
- ✅ Erro explícito se `ingestion_runs` não encontrado

### Fix 2: CASTS por introspeção
- ✅ Método `_get_table_column_types()` lê schema real do PostgreSQL
- ✅ Método `_build_cast_expression()` gera casts baseado em `udt_name`
- ✅ Suporta: integer, numeric, timestamptz, date, bool, text
- ✅ Trata NULL, strings vazias, e "NULL"/"NONE"/"NIL"

### Fix 3: ON CONFLICT target auto-resolvido
- ✅ Método `_resolve_conflict_target()` tenta preferred, depois PK
- ✅ Usa `actual_conflict_cols` em vez de `cfg.conflict_cols` hardcoded
- ✅ `used_conflict_target` incluído no merge_report.json

### Fix 4: Rejects completos
- ✅ Rejects dinâmicos para NOT NULL columns (do schema)
- ✅ Validação de time range para `fases_ordem_fabrico`
- ✅ Validação de FK para `ordens_fabrico` (of_produto_id, of_fase_id)
- ✅ Tabelas `*_rejects` criadas automaticamente

### Fix 5: Duplicados em staging
- ✅ `DISTINCT ON` implementado com tie-breaker temporal
- ✅ Fallback para `ctid` se não houver coluna temporal

### Fix 6: Orphans FK report
- ✅ Método `_generate_orphans_report()` implementado
- ✅ Report salvo em `docs/merge/ORPHANS_REPORT.json`
- ✅ Incluído em `merge_report.json`

### Fix 8: Erros fingerprint
- ✅ Migration `006_errors_fingerprint_pgcrypto.py` criada
- ✅ Coluna `ofch_fingerprint` e índice único implementados
- ✅ SQL-first fingerprint com pgcrypto, fallback Python

## 📋 Auditoria

- ✅ `docs/merge/AUDIT_SCHEMA.md` gerado
- ✅ `docs/merge/AUDIT_SCHEMA.json` gerado
- ✅ Script `scripts/audit_schema_for_merge.py` criado

## ⚠️ Status Atual

**Último erro:** Violação de FK em `ordens_fabrico.of_produto_id=40246` (não existe em `modelos`)

**Causa:** Dados inválidos no Excel, não código.

**Solução implementada:** Validação de FK adicionada para rejeitar essas linhas antes do INSERT.

## 📊 Próximos Passos

1. Re-executar ingestão para validar FK validation
2. Verificar idempotência (2x merge = contagens estáveis)
3. Validar `merge_report.json` contém `used_conflict_target`
4. Validar `ORPHANS_REPORT.json` gerado

