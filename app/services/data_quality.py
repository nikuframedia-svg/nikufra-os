"""
Data Quality Service - Verifica match rates e valida suporte de dados.
"""
from typing import Dict, Any, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import structlog

logger = structlog.get_logger()

# Match rates críticos identificados pelo inspector
CRITICAL_MATCH_RATES = {
    "FuncionarioFaseOf_FaseOfId_to_FaseOf_Id": {
        "match_rate": 0.323,
        "threshold": 0.9,
        "supported": False,
        "reason": "Match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id is 32.3%, below 90% threshold. Data quality issue: most FuncionarioFaseOf_FaseOfId values do not match FaseOf_Id"
    },
    "Produto_Id_to_Of_ProdutoId": {
        "match_rate": 0.725,
        "threshold": 0.9,
        "supported": False,
        "reason": "Match rate Produto_Id ↔ Of_ProdutoId is 72.5%, below 90% threshold. 339 orphans (produtos em OrdensFabrico que não existem em Modelos). Allowed for historical data."
    }
}


class DataQualityService:
    """Service para verificar qualidade de dados e suporte de features."""
    
    def __init__(self, db_url: str):
        """
        Initialize service.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
    
    def get_match_rate(
        self,
        from_table: str,
        from_column: str,
        to_table: str,
        to_column: str
    ) -> Dict[str, Any]:
        """
        Calcula match rate entre duas colunas.
        
        Args:
            from_table: Tabela origem (sem schema, será resolvida via search_path)
            from_column: Coluna origem
            to_table: Tabela destino (sem schema, será resolvida via search_path)
            to_column: Coluna destino
        
        Returns:
            Dict com match_rate, total_from, total_to, matches, orphans_count
            Ou dict com error se tabelas não existirem
        """
        query = text(f"""
            WITH from_data AS (
                SELECT DISTINCT {from_column} as val
                FROM {from_table}
                WHERE {from_column} IS NOT NULL
            ),
            to_data AS (
                SELECT DISTINCT {to_column} as val
                FROM {to_table}
                WHERE {to_column} IS NOT NULL
            ),
            matches AS (
                SELECT f.val
                FROM from_data f
                INNER JOIN to_data t ON f.val = t.val
            )
            SELECT 
                (SELECT COUNT(*) FROM from_data) as total_from,
                (SELECT COUNT(*) FROM to_data) as total_to,
                (SELECT COUNT(*) FROM matches) as matches
        """)
        
        try:
            with self.engine.connect() as conn:
                # Set search_path to core, public, staging (tables are in public, but core may exist)
                conn.execute(text("SET search_path TO core, public, staging;"))
                
                # Check if tables exist first
                check_query = text("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = :from_table AND table_schema IN ('core', 'public')
                    ) as from_exists,
                    EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = :to_table AND table_schema IN ('core', 'public')
                    ) as to_exists
                """)
                check_result = conn.execute(check_query, {"from_table": from_table, "to_table": to_table}).fetchone()
                
                if not check_result[0] or not check_result[1]:
                    missing = []
                    if not check_result[0]:
                        missing.append(from_table)
                    if not check_result[1]:
                        missing.append(to_table)
                    return {
                        "error": "TABLES_NOT_FOUND",
                        "missing_tables": missing,
                        "message": f"Tables not found: {', '.join(missing)}. Run migrations: python3 -m alembic upgrade head"
                    }
                
                result = conn.execute(query).fetchone()
                total_from = result[0] or 0
                total_to = result[1] or 0
                matches = result[2] or 0
                
                match_rate = matches / total_from if total_from > 0 else 0.0
                orphans_count = total_from - matches
            
            return {
                "match_rate": round(match_rate, 4),
                "total_from": total_from,
                "total_to": total_to,
                "matches": matches,
                "orphans_count": orphans_count,
                "from_table": from_table,
                "from_column": from_column,
                "to_table": to_table,
                "to_column": to_column
            }
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg.lower() or "relation" in error_msg.lower():
                return {
                    "error": "TABLES_NOT_FOUND",
                    "message": f"Tables not found or migrations not applied: {error_msg}. Run: python3 -m alembic upgrade head"
                }
            raise
    
    def check_feature_support(self, feature_name: str) -> Dict[str, Any]:
        """
        Verifica se uma feature é suportada pelos dados.
        
        Args:
            feature_name: Nome da feature (ex: "employee_productivity")
        
        Returns:
            Dict com status, reason, match_rate se aplicável
        """
        if feature_name == "employee_productivity":
            # Verificar match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id
            match_info = self.get_match_rate(
                "funcionarios_fase_ordem_fabrico",
                "funcionariofaseof_faseof_id",
                "fases_ordem_fabrico",
                "faseof_id"
            )
            
            # Check if there was an error (tables not found)
            if "error" in match_info:
                return {
                    "status": "ERROR",
                    "reason": match_info.get("message", "Tables not found"),
                    "error_type": match_info.get("error"),
                    "suggestion": "Run migrations: python3 -m alembic upgrade head"
                }
            
            # Check if tables are empty (ingestion not run)
            if match_info.get("total_from", 0) == 0:
                return {
                    "status": "SKIPPED",
                    "reason": "Tables exist but are empty. Ingestion not run yet.",
                    "suggestion": "Run ingestion: python3 -m app.ingestion.main_turbo"
                }
            
            if match_info["match_rate"] < 0.9:
                return {
                    "status": "NOT_SUPPORTED_BY_DATA",
                    "reason": f"Match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id is {match_info['match_rate']:.1%}, below 90% threshold",
                    "match_rate": match_info["match_rate"],
                    "matches": match_info["matches"],
                    "total_from": match_info["total_from"],
                    "orphans_count": match_info["orphans_count"],
                    "suggestion": "Data quality issue: most FuncionarioFaseOf_FaseOfId values do not match FaseOf_Id. Cannot reliably compute productivity per employee."
                }
        
        return {
            "status": "SUPPORTED",
            "reason": "Feature is supported by data"
        }
    
    def get_not_supported_response(self, feature_name: str, reason: str, **kwargs) -> Dict[str, Any]:
        """
        Retorna resposta padronizada para features não suportadas.
        
        Args:
            feature_name: Nome da feature
            reason: Razão do não suporte
            **kwargs: Dados adicionais (match_rate, etc.)
        
        Returns:
            Dict padronizado
        """
        return {
            "status": "NOT_SUPPORTED_BY_DATA",
            "feature": feature_name,
            "reason": reason,
            **kwargs
        }


# Singleton instance
_data_quality_service = None

def get_data_quality_service(db_url: str) -> DataQualityService:
    """Get or create singleton instance."""
    global _data_quality_service
    if _data_quality_service is None:
        _data_quality_service = DataQualityService(db_url)
    return _data_quality_service

