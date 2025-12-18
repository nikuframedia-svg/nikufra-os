"""
QUALITY Service: Quality metrics and risk prediction.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import structlog

logger = structlog.get_logger()


class QualityService:
    """Quality service with baseline predictions."""
    
    def __init__(self, db_url: str):
        """
        Initialize service.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
    
    def get_overview(
        self,
        fase_avaliacao_id: Optional[int] = None,
        fase_culpada_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get quality overview.
        
        Args:
            fase_avaliacao_id: Filter by evaluation phase
            fase_culpada_id: Filter by culprit phase
        
        Returns:
            Quality overview with error rates and severity
        """
        # Use materialized view for performance
        # Nota: MV usa fase_avaliacao_id e fase_culpada_id (nomes genéricos)
        # Mas na tabela core usamos ofch_fase_avaliacao e ofch_faseof_culpada
        query = text("""
            SELECT 
                fase_avaliacao_id,
                fase_culpada_id,
                error_count,
                avg_gravidade,
                affected_orders_count
            FROM mv_quality_by_phase
            WHERE (:fase_avaliacao_id IS NULL OR fase_avaliacao_id = :fase_avaliacao_id)
              AND (:fase_culpada_id IS NULL OR fase_culpada_id = :fase_culpada_id)
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {
                "fase_avaliacao_id": fase_avaliacao_id,
                "fase_culpada_id": fase_culpada_id
            })
            rows = result.fetchall()
            
            overview = {
                "by_phase_pair": [
                    {
                        "fase_avaliacao_id": row[0],
                        "fase_culpada_id": row[1],
                        "error_count": row[2],
                        "avg_gravidade": float(row[3]) if row[3] else None,
                        "affected_orders_count": row[4]
                    }
                    for row in rows
                ],
                "total_errors": sum(row[2] for row in rows),
                "total_affected_orders": sum(row[4] for row in rows)
            }
            
            # Aggregate by culprit phase
            culprit_stats = {}
            for row in rows:
                culp_id = row[1]
                if culp_id not in culprit_stats:
                    culprit_stats[culp_id] = {
                        "error_count": 0,
                        "avg_gravidade": 0.0,
                        "affected_orders": 0
                    }
                culprit_stats[culp_id]["error_count"] += row[2]
                if row[3]:
                    culprit_stats[culp_id]["avg_gravidade"] = max(
                        culprit_stats[culp_id]["avg_gravidade"],
                        float(row[3])
                    )
                culprit_stats[culp_id]["affected_orders"] += row[4]
            
            overview["by_culprit_phase"] = [
                {
                    "fase_id": fase_id,
                    **stats
                }
                for fase_id, stats in culprit_stats.items()
            ]
            
            return overview
    
    def get_risk(
        self,
        modelo_id: Optional[int] = None,
        fase_culpada_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get defect risk prediction (baseline: historical probability).
        
        Args:
            modelo_id: Product model ID
            fase_culpada_id: Phase ID that causes defects
        
        Returns:
            Risk prediction with baseline probability
        """
        # Baseline: historical probability of defects
        # This is deterministic, no ML required
        
        if modelo_id and fase_culpada_id:
            # Specific model + phase combination
            query = text("""
                SELECT 
                    COUNT(DISTINCT e.ofch_of_id)::FLOAT / NULLIF(COUNT(DISTINCT of.of_id), 0) as defect_rate,
                    AVG(e.ofch_gravidade) as avg_gravidade,  # CORRIGIDO: usar ofch_gravidade
                    COUNT(*) as total_errors
                FROM erros_ordem_fabrico e
                JOIN ordens_fabrico of ON e.ofch_of_id = of.of_id  # CORRIGIDO: usar ofch_of_id
                WHERE of.of_produto_id = :modelo_id
                  AND e.ofch_faseof_culpada IS NOT NULL  # CORRIGIDO: usar ofch_faseof_culpada
                  AND EXISTS (
                      SELECT 1 FROM fases_ordem_fabrico fof
                      WHERE fof.faseof_of_id = of.of_id
                        AND fof.faseof_fase_id = :fase_culpada_id
                  )
            """)
            params = {"modelo_id": modelo_id, "fase_culpada_id": fase_culpada_id}
        elif modelo_id:
            # By model only
            query = text("""
                SELECT 
                    COUNT(DISTINCT e.ofch_of_id)::FLOAT / NULLIF(COUNT(DISTINCT of.of_id), 0) as defect_rate,
                    AVG(e.ofch_gravidade) as avg_gravidade,  # CORRIGIDO: usar ofch_gravidade
                    COUNT(*) as total_errors
                FROM erros_ordem_fabrico e
                JOIN ordens_fabrico of ON e.erro_of_id = of.of_id
                WHERE of.of_produto_id = :modelo_id
            """)
            params = {"modelo_id": modelo_id}
        elif fase_culpada_id:
            # By phase only
            query = text("""
                SELECT 
                    COUNT(DISTINCT e.erro_of_id)::FLOAT / NULLIF(
                        (SELECT COUNT(DISTINCT faseof_of_id) 
                         FROM fases_ordem_fabrico 
                         WHERE faseof_fase_id = :fase_culpada_id), 0
                    ) as defect_rate,
                    AVG(e.erro_gravidade) as avg_gravidade,
                    COUNT(*) as total_errors
                FROM erros_ordem_fabrico e
                WHERE e.ofch_faseof_culpada IS NOT NULL  # CORRIGIDO: usar ofch_faseof_culpada
            """)
            params = {"fase_culpada_id": fase_culpada_id}
        else:
            # Overall
            query = text("""
                SELECT 
                    COUNT(DISTINCT ofch_of_id)::FLOAT / NULLIF(  # CORRIGIDO: usar ofch_of_id
                        (SELECT COUNT(*) FROM ordens_fabrico), 0
                    ) as defect_rate,
                    AVG(ofch_gravidade) as avg_gravidade,  # CORRIGIDO: usar ofch_gravidade
                    COUNT(*) as total_errors
                FROM erros_ordem_fabrico
            """)
            params = {}
        
        with self.engine.connect() as conn:
            result = conn.execute(query, params)
            row = result.fetchone()
            
            if row and row[0] is not None:
                defect_rate = float(row[0])
                avg_gravidade = float(row[1]) if row[1] else None
                total_errors = row[2]
                
                # Risk level based on defect rate and severity
                if defect_rate > 0.3 or (avg_gravidade and avg_gravidade >= 2.5):
                    risk_level = "HIGH"
                elif defect_rate > 0.1 or (avg_gravidade and avg_gravidade >= 2.0):
                    risk_level = "MEDIUM"
                else:
                    risk_level = "LOW"
                
                return {
                    "defect_rate": defect_rate,
                    "avg_gravidade": avg_gravidade,
                    "total_errors": total_errors,
                    "risk_level": risk_level,
                    "prediction_method": "baseline_historical",
                    "modelo_id": modelo_id,
                    "fase_culpada_id": fase_culpada_id
                }
        
        return {
            "defect_rate": 0.0,
            "avg_gravidade": None,
            "total_errors": 0,
            "risk_level": "LOW",
            "prediction_method": "baseline_historical"
        }

