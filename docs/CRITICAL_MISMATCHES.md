# CRITICAL MISMATCHES - AÇÃO REQUERIDA

**Gerado em**: /Users/martimnicolau/nelo
**Status**: ⚠️ CONTAGENS NÃO BATERAM COM EXCEL

## Resumo

Encontradas 2 sheets com contagens que não batem com o Excel esperado.

## Mismatches Detalhados


### FasesOrdemFabrico → fases_ordem_fabrico

- **Esperado (Excel)**: 519,079
- **Core (processado)**: 458,652
- **Rejeitados**: 120,854
- **Total (core + rejects)**: 579,506
- **Diferença**: 60,427 (11.64%)

**Possíveis Causas**:
- Extra 60427 rows - possible duplicates or data corruption
- Check ingestion logs for errors
- Verify Excel file hasn't changed (check excel_sha256)


### Funcionarios → funcionarios

- **Esperado (Excel)**: 902
- **Core (processado)**: 301
- **Rejeitados**: 0
- **Total (core + rejects)**: 301
- **Diferença**: -601 (-66.63%)

**Possíveis Causas**:
- Missing 601 rows - possible ingestion errors or data quality issues
- Check ingestion logs for errors
- Verify Excel file hasn't changed (check excel_sha256)


## Ação Corretiva

1. **Verificar logs de ingestão**:
   ```bash
   # Verificar ingestion_runs
   psql $DATABASE_URL -c "SELECT * FROM ingestion_runs ORDER BY run_id DESC LIMIT 1;"
   
   # Verificar rejects
   psql $DATABASE_URL -c "SELECT reason_code, COUNT(*) FROM {table}_rejects GROUP BY reason_code;"
   ```

2. **Verificar Excel**:
   - Confirmar que excel_sha256 não mudou
   - Re-executar inspector para validar contagens atuais

3. **Re-executar ingestão se necessário**:
   ```bash
   python app/ingestion/main_turbo.py
   ```

4. **Se diferença persistir**:
   - Investigar causas específicas por sheet
   - Verificar se há filtros ou validações muito restritivas
   - Considerar ajustar tolerância se justificado

## ⚠️ BLOQUEIO DE RELEASE

**Este backend NÃO deve ser promovido para produção até que os mismatches sejam resolvidos ou justificados.**

