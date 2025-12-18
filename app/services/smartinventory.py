"""
SmartInventory Service: WIP and consumption estimates.
Only returns data-supported features.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import structlog

logger = structlog.get_logger()


class SmartInventoryService:
    """SmartInventory service (data-supported only)."""
    
    def __init__(self, db_url: str):
        """
        Initialize service.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
    
    def get_wip(
        self,
        fase_id: Optional[int] = None,
        produto_id: Optional[int] = None  # CORRIGIDO: usar produto_id
    ) -> Dict[str, Any]:
        """
        Get WIP (Work In Progress) by phase and optionally by product.
        
        Args:
            fase_id: Filter by phase
            produto_id: Filter by product (CORRIGIDO: usar produto_id)
        
        Returns:
            WIP statistics
        """
        # Use materialized view for current WIP
        if produto_id:
            # WIP by phase and product
            query = text("""
                SELECT 
                    fof.faseof_fase_id as fase_id,
                    of.of_produto_id as produto_id,
                    COUNT(*) as wip_count,
                    AVG(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) as avg_age_hours
                FROM fases_ordem_fabrico fof
                JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
                WHERE fof.faseof_inicio IS NOT NULL 
                  AND fof.faseof_fim IS NULL
                  AND (:fase_id IS NULL OR fof.faseof_fase_id = :fase_id)
                  AND (:produto_id IS NULL OR of.of_produto_id = :produto_id)
                GROUP BY fof.faseof_fase_id, of.of_produto_id
            """)
        else:
            # WIP by phase only (use MV)
            query = text("""
                SELECT 
                    fase_id,
                    wip_count,
                    avg_wip_age_hours
                FROM mv_wip_by_phase_current
                WHERE (:fase_id IS NULL OR fase_id = :fase_id)
            """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {
                "fase_id": fase_id,
                "produto_id": produto_id
            })
            rows = result.fetchall()
            
            if produto_id:
                wip_data = [
                    {
                        "fase_id": row[0],
                        "produto_id": row[1],
                        "wip_count": row[2],
                        "avg_age_hours": float(row[3]) if row[3] else None
                    }
                    for row in rows
                ]
            else:
                wip_data = [
                    {
                        "fase_id": row[0],
                        "wip_count": row[1],
                        "avg_age_hours": float(row[2]) if row[2] else None
                    }
                    for row in rows
                ]
            
            return {
                "wip_by_phase": wip_data if not produto_id else None,
                "wip_by_phase_and_product": wip_data if produto_id else None,
                "total_wip": sum(row["wip_count"] for row in wip_data),
                "timestamp": None  # Would add current timestamp
            }
    
    def get_wip_mass(
        self,
        fase_id: Optional[int] = None,
        produto_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get estimated WIP mass by phase and product.
        
        Uses faseof_peso when available, otherwise falls back to produto_peso_desmolde.
        
        Args:
            fase_id: Filter by phase
            produto_id: Filter by product
        
        Returns:
            WIP mass estimates
        """
        query = text("""
            SELECT 
                fof.faseof_fase_id as fase_id,
                of.of_produto_id as produto_id,
                COUNT(*) as wip_count,
                SUM(COALESCE(fof.faseof_peso, m.produto_peso_desmolde, 0)) as total_mass_kg
            FROM fases_ordem_fabrico fof
            JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
            LEFT JOIN modelos m ON of.of_produto_id = m.produto_id
            WHERE fof.faseof_inicio IS NOT NULL 
              AND fof.faseof_fim IS NULL
              AND (:fase_id IS NULL OR fof.faseof_fase_id = :fase_id)
              AND (:produto_id IS NULL OR of.of_produto_id = :produto_id)
            GROUP BY fof.faseof_fase_id, of.of_produto_id
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {
                "fase_id": fase_id,
                "produto_id": produto_id
            })
            rows = result.fetchall()
            
            wip_mass = [
                {
                    "fase_id": row[0],
                    "produto_id": row[1],
                    "wip_count": row[2],
                    "total_mass_kg": float(row[3]) if row[3] else 0.0
                }
                for row in rows
            ]
            
            return {
                "wip_mass_by_phase_and_product": wip_mass,
                "total_wip_mass_kg": sum(row["total_mass_kg"] for row in wip_mass),
                "timestamp": None
            }
    
    def get_consumption_estimate(
        self,
        produto_id: Optional[int] = None,
        fase_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get consumption estimates.
        
        Returns NOT_SUPPORTED_BY_DATA if Modelos table doesn't have consumption fields.
        
        Args:
            produto_id: Filter by product
            fase_id: Filter by phase
        
        Returns:
            Consumption estimates or NOT_SUPPORTED_BY_DATA
        """
        # Check if Modelos has consumption-related fields
        # Based on DATA_DICTIONARY, we have:
        # - Produto_PesoDesmolde
        # - Produto_PesoAcabamento
        # - Produto_QtdGelDeck
        # - Produto_QtdGelCasco
        
        # These are weights/quantities, not consumption rates
        # Without consumption rate data, we cannot estimate consumption
        
        return {
            "status": "NOT_SUPPORTED_BY_DATA",
            "reason": "Modelos table contains weights and quantities, but no consumption rate data. Cannot estimate consumption without consumption rates per phase.",
            "available_fields": [
                "produto_peso_desmolde",
                "produto_peso_acabamento",
                "produto_qtd_gel_deck",
                "produto_qtd_gel_casco"
            ],
            "suggestion": "Add consumption rate fields to Modelos or FasesStandardModelos if consumption estimation is needed."
        }
    
    def get_gelcoat_theoretical_usage(
        self,
        produto_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get theoretical gelcoat usage (NOT real consumption).
        
        Args:
            produto_id: Filter by product
            from_date: Start date
            to_date: End date
        
        Returns:
            Theoretical gelcoat usage or NOT_SUPPORTED_BY_DATA
        """
        # Check if gelcoat fields exist and have data
        query = text("""
            SELECT 
                COUNT(*) as total_products,
                COUNT(produto_qtd_gel_deck) as with_gel_deck,
                COUNT(produto_qtd_gel_casco) as with_gel_casco
            FROM modelos
            WHERE (:produto_id IS NULL OR produto_id = :produto_id)
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"produto_id": produto_id})
            row = result.fetchone()
            
            total = row[0]
            with_deck = row[1]
            with_casco = row[2]
            
            if with_deck == 0 and with_casco == 0:
                return {
                    "status": "NOT_SUPPORTED_BY_DATA",
                    "reason": "No gelcoat data available in Modelos table",
                    "total_products": total,
                    "with_gel_deck": with_deck,
                    "with_gel_casco": with_casco
                }
            
            # Get theoretical usage (sum of gelcoat quantities for products in orders)
            usage_query = text("""
                SELECT 
                    of.of_produto_id as produto_id,
                    m.produto_qtd_gel_deck,
                    m.produto_qtd_gel_casco,
                    COUNT(DISTINCT of.of_id) as order_count
                FROM ordens_fabrico of
                JOIN modelos m ON of.of_produto_id = m.produto_id
                WHERE (:produto_id IS NULL OR of.of_produto_id = :produto_id)
                  AND (:from_date IS NULL OR of.of_data_criacao >= :from_date::date)
                  AND (:to_date IS NULL OR of.of_data_criacao <= :to_date::date)
                GROUP BY of.of_produto_id, m.produto_qtd_gel_deck, m.produto_qtd_gel_casco
            """)
            
            result = conn.execute(usage_query, {
                "produto_id": produto_id,
                "from_date": from_date,
                "to_date": to_date
            })
            rows = result.fetchall()
            
            usage_data = [
                {
                    "produto_id": row[0],
                    "qtd_gel_deck": float(row[1]) if row[1] else None,
                    "qtd_gel_casco": float(row[2]) if row[2] else None,
                    "order_count": row[3]
                }
                for row in rows
            ]
            
            total_gel_deck = sum(row["qtd_gel_deck"] or 0 for row in usage_data)
            total_gel_casco = sum(row["qtd_gel_casco"] or 0 for row in usage_data)
            
            return {
                "status": "SUPPORTED",
                "disclaimer": "This is THEORETICAL usage based on product specifications, NOT actual consumption",
                "by_product": usage_data,
                "total_theoretical_gel_deck": total_gel_deck,
                "total_theoretical_gel_casco": total_gel_casco,
                "from_date": from_date,
                "to_date": to_date
            }
