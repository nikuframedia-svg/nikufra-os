"""
Validação de contagens pós-ingestão vs Excel.
Gera CRITICAL_MISMATCHES.md se contagens não baterem.
"""
from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy import create_engine, text
import json
import structlog

logger = structlog.get_logger()

# Contagens esperadas do Excel (conforme PROFILE_REPORT)
EXPECTED_COUNTS = {
    "OrdensFabrico": 27380,
    "FasesOrdemFabrico": 519079,
    "FuncionariosFaseOrdemFabrico": 423769,
    "OrdemFabricoErros": 89836,
    "Funcionarios": 902,
    "FuncionariosFasesAptos": 902,
    "Fases": 71,
    "Modelos": 894,
    "FasesStandardModelos": 15347
}

# Mapeamento sheet -> tabela
SHEET_TO_TABLE = {
    "OrdensFabrico": "ordens_fabrico",
    "FasesOrdemFabrico": "fases_ordem_fabrico",
    "FuncionariosFaseOrdemFabrico": "funcionarios_fase_ordem_fabrico",
    "OrdemFabricoErros": "erros_ordem_fabrico",
    "Funcionarios": "funcionarios",
    "FuncionariosFasesAptos": "funcionarios_fases_aptos",
    "Fases": "fases_catalogo",
    "Modelos": "modelos",
    "FasesStandardModelos": "fases_standard_modelos"
}


class CountValidator:
    """Valida contagens pós-ingestão."""
    
    def __init__(self, db_url: str):
        """
        Initialize validator.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
        self.mismatches = []
    
    def validate_all(self) -> Dict[str, Any]:
        """
        Validate all table counts vs expected.
        
        Returns:
            Validation results
        """
        results = {}
        
        for sheet_name, expected_count in EXPECTED_COUNTS.items():
            table_name = SHEET_TO_TABLE.get(sheet_name)
            if not table_name:
                continue
            
            actual_count = self._get_count(table_name)
            rejected_count = self._get_rejected_count(table_name)
            
            # Data Contract: expected == core_count + rejects_count
            total_count = actual_count + rejected_count
            diff = total_count - expected_count
            diff_pct = (diff / expected_count * 100) if expected_count > 0 else 0
            
            # Tolerância: ±1% (permite pequenas diferenças de arredondamento)
            tolerance = expected_count * 0.01
            is_valid = abs(diff) <= tolerance
            
            results[sheet_name] = {
                "table": table_name,
                "expected": expected_count,
                "core_count": actual_count,
                "rejected_count": rejected_count,
                "total_count": total_count,
                "diff": diff,
                "diff_pct": round(diff_pct, 2),
                "is_valid": is_valid,
                "tolerance": tolerance
            }
            
            if not is_valid:
                self.mismatches.append({
                    "sheet": sheet_name,
                    "table": table_name,
                    "expected": expected_count,
                    "core_count": actual_count,
                    "rejected_count": rejected_count,
                    "total_count": total_count,
                    "diff": diff,
                    "diff_pct": round(diff_pct, 2),
                    "possible_causes": self._suggest_causes(sheet_name, diff, rejected_count)
                })
        
        return {
            "validated_at": str(Path.cwd()),
            "results": results,
            "mismatches": self.mismatches,
            "all_valid": len(self.mismatches) == 0
        }
    
    def _get_count(self, table_name: str) -> int:
        """Get row count from table."""
        query = text(f"SELECT COUNT(*) FROM {table_name}")
        
        with self.engine.connect() as conn:
            result = conn.execute(query)
            return result.scalar() or 0
    
    def _get_rejected_count(self, table_name: str) -> int:
        """Get rejected count for latest ingestion run."""
        reject_table = f"{table_name}_rejects"
        
        # Check if table exists
        check_query = text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = :table_name
            )
        """)
        
        with self.engine.connect() as conn:
            exists = conn.execute(check_query, {"table_name": reject_table}).scalar()
            if not exists:
                return 0
            
            # Get latest run_id from ingestion_runs
            run_id_query = text("""
                SELECT run_id FROM ingestion_runs 
                ORDER BY run_id DESC LIMIT 1
            """)
            run_id_result = conn.execute(run_id_query)
            run_id_row = run_id_result.fetchone()
            if not run_id_row:
                return 0
            latest_run_id = run_id_row[0]
            
            # Count rejects for latest run only
            count_query = text(f"SELECT COUNT(*) FROM {reject_table} WHERE run_id = :run_id")
            return conn.execute(count_query, {"run_id": latest_run_id}).scalar() or 0
    
    def _suggest_causes(self, sheet_name: str, diff: int, rejected: int) -> List[str]:
        """Suggest possible causes for mismatch."""
        causes = []
        
        if diff < 0:
            causes.append(f"Missing {abs(diff)} rows - possible ingestion errors or data quality issues")
            if rejected > 0:
                causes.append(f"{rejected} rows rejected - check {sheet_name.lower()}_rejects table")
        elif diff > 0:
            causes.append(f"Extra {diff} rows - possible duplicates or data corruption")
        
        causes.append("Check ingestion logs for errors")
        causes.append("Verify Excel file hasn't changed (check excel_sha256)")
        
        return causes
    
    def generate_critical_mismatches_report(self, output_path: Path) -> bool:
        """
        Generate CRITICAL_MISMATCHES.md if mismatches exist.
        
        Args:
            output_path: Output file path
        
        Returns:
            True if mismatches found
        """
        if not self.mismatches:
            return False
        
        report = f"""# CRITICAL MISMATCHES - AÇÃO REQUERIDA

**Gerado em**: {Path.cwd()}
**Status**: ⚠️ CONTAGENS NÃO BATERAM COM EXCEL

## Resumo

Encontradas {len(self.mismatches)} sheets com contagens que não batem com o Excel esperado.

## Mismatches Detalhados

"""
        
        for mismatch in self.mismatches:
            report += f"""
### {mismatch['sheet']} → {mismatch['table']}

- **Esperado (Excel)**: {mismatch['expected']:,}
- **Core (processado)**: {mismatch['core_count']:,}
- **Rejeitados**: {mismatch['rejected_count']:,}
- **Total (core + rejects)**: {mismatch['total_count']:,}
- **Diferença**: {mismatch['diff']:,} ({mismatch['diff_pct']:.2f}%)

**Possíveis Causas**:
"""
            for cause in mismatch['possible_causes']:
                report += f"- {cause}\n"
            
            report += "\n"
        
        report += """
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

"""
        
        output_path.write_text(report)
        logger.error("critical_mismatches_found", count=len(self.mismatches))
        
        return True


def main():
    """CLI entry point."""
    import sys
    from backend.config import DATABASE_URL
    
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
    
    validator = CountValidator(DATABASE_URL)
    results = validator.validate_all()
    
    # Generate report
    output_path = Path(__file__).parent.parent.parent / "docs" / "CRITICAL_MISMATCHES.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    has_mismatches = validator.generate_critical_mismatches_report(output_path)
    
    # Print summary
    print("\n" + "="*80)
    print("VALIDAÇÃO DE CONTAGENS")
    print("="*80)
    
    for sheet, result in results["results"].items():
        status = "✅" if result["is_valid"] else "❌"
        print(f"{status} {sheet:30s} | Esperado: {result['expected']:8,} | Obtido: {result['actual']:8,} | Diff: {result['diff']:8,} ({result['diff_pct']:+.2f}%)")
    
    if has_mismatches:
        print("\n⚠️  MISMATCHES ENCONTRADOS!")
        print(f"   Report gerado: {output_path}")
        print("\n❌ BLOQUEIO DE RELEASE: Resolver mismatches antes de promover para produção.")
        return 1
    else:
        print("\n✅ Todas as contagens batem com o Excel!")
        return 0


if __name__ == "__main__":
    sys.exit(main())

