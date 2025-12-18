"""
PRODPLAN Core Service.
Provides endpoints for orders, phases, and schedule with performance optimizations.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import redis
import json
import structlog

logger = structlog.get_logger()


class ProdplanService:
    """PRODPLAN service with caching and optimized queries."""
    
    def __init__(self, db_url: str, redis_url: str = "redis://localhost:6379/0"):
        """
        Initialize service.
        
        Args:
            db_url: Database URL
            redis_url: Redis URL for caching
        """
        if not db_url:
            raise ValueError("DATABASE_URL is required")
        try:
            self.engine = create_engine(db_url, pool_pre_ping=True)
        except Exception as e:
            logger.error("database_connection_failed", error=str(e))
            raise
        
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
            self.redis_client.ping()  # Test connection
        except Exception as e:
            self.redis_client = None
            logger.warning("redis_not_available", message=f"Redis not available (optional), caching disabled: {str(e)}")
    
    def get_orders(
        self,
        limit: int = 100,
        offset: int = 0,
        of_id: Optional[str] = None,
        modelo_id: Optional[int] = None,
        fase_id: Optional[int] = None,
        data_criacao_from: Optional[datetime] = None,
        data_criacao_to: Optional[datetime] = None,
        cursor: Optional[str] = None  # For keyset pagination
    ) -> Dict[str, Any]:
        """
        Get orders with keyset pagination.
        
        Args:
            limit: Maximum number of results
            offset: Offset for pagination (fallback if cursor not provided)
            of_id: Filter by order ID
            modelo_id: Filter by product ID
            fase_id: Filter by phase ID
            data_criacao_from: Filter orders created after this date
            data_criacao_to: Filter orders created before this date
            cursor: Cursor for keyset pagination (JSON with last_of_id and last_data_criacao)
        
        Returns:
            Dict with orders and next_cursor
        """
        # Build query
        where_clauses = []
        params = {'limit': limit}
        
        if of_id:
            where_clauses.append("of_id = :of_id")
            params['of_id'] = of_id
        
        if modelo_id:
            where_clauses.append("of_produto_id = :modelo_id")  # CORRIGIDO: usar produto_id
            params['modelo_id'] = modelo_id
        
        if fase_id:
            where_clauses.append("of_fase_id = :fase_id")
            params['fase_id'] = fase_id
        
        if data_criacao_from:
            where_clauses.append("of_data_criacao >= :data_criacao_from")
            params['data_criacao_from'] = data_criacao_from
        
        if data_criacao_to:
            where_clauses.append("of_data_criacao <= :data_criacao_to")
            params['data_criacao_to'] = data_criacao_to
        
        # Keyset pagination
        if cursor:
            try:
                cursor_data = json.loads(cursor)
                where_clauses.append(
                    "(of_data_criacao, of_id) > (:last_data_criacao, :last_of_id)"
                )
                params['last_data_criacao'] = cursor_data['last_data_criacao']
                params['last_of_id'] = cursor_data['last_of_id']
            except:
                pass  # Fallback to offset
        
        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        
        # If no cursor, use offset
        if not cursor:
            params['offset'] = offset
        
        query = f"""
            SELECT 
                of_id,
                of_data_criacao,
                of_data_acabamento,
                of_produto_id,
                of_fase_id,
                of_data_transporte
            FROM ordens_fabrico
            WHERE {where_sql}
            ORDER BY of_data_criacao DESC, of_id DESC
            LIMIT :limit
        """
        
        if not cursor:
            query += " OFFSET :offset"
        
        with self.engine.connect() as conn:
            result = conn.execute(text(query), params)
            rows = result.fetchall()
            
            orders = [
                {
                    'of_id': row[0],
                    'of_data_criacao': row[1].isoformat() if row[1] else None,
                    'of_data_acabamento': row[2].isoformat() if row[2] else None,
                    'of_produto_id': row[3],
                    'of_fase_id': row[4],
                    'of_data_transporte': row[5].isoformat() if row[5] else None,
                }
                for row in rows
            ]
            
            # Build next cursor
            next_cursor = None
            if len(orders) == limit and orders:
                last_order = orders[-1]
                next_cursor = json.dumps({
                    'last_of_id': last_order['of_id'],
                    'last_data_criacao': last_order['of_data_criacao']
                })
            
            return {
                'orders': orders,
                'count': len(orders),
                'next_cursor': next_cursor
            }
    
    def get_order(self, of_id: str) -> Optional[Dict[str, Any]]:
        """
        Get single order by ID.
        
        Args:
            of_id: Order ID
        
        Returns:
            Order dict or None
        """
        cache_key = f"order:{of_id}"
        
        # Check cache
        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        
        query = text("""
            SELECT 
                of_id,
                of_data_criacao,
                of_data_acabamento,
                of_produto_id,
                of_fase_id,
                of_data_transporte
            FROM ordens_fabrico
            WHERE of_id = :of_id
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {'of_id': of_id})
            row = result.fetchone()
            
            if not row:
                return None
            
            order = {
                'of_id': row[0],
                'of_data_criacao': row[1].isoformat() if row[1] else None,
                'of_data_acabamento': row[2].isoformat() if row[2] else None,
                'of_produto_id': row[3],
                'of_fase_id': row[4],
                'of_data_transporte': row[5].isoformat() if row[5] else None,
            }
            
            # Cache for 60 seconds
            if self.redis_client:
                self.redis_client.setex(cache_key, 60, json.dumps(order))
            
            return order
    
    def get_order_phases(self, of_id: str) -> List[Dict[str, Any]]:
        """
        Get phases for an order.
        
        Args:
            of_id: Order ID
        
        Returns:
            List of phase dicts
        """
        query = text("""
            SELECT 
                faseof_id,
                faseof_of_id,
                faseof_inicio,
                faseof_fim,
                faseof_data_prevista,
                faseof_coeficiente,
                faseof_coeficiente_x,
                faseof_fase_id,
                faseof_peso,
                faseof_retorno,
                faseof_turno,
                faseof_sequencia
            FROM fases_ordem_fabrico
            WHERE faseof_of_id = :of_id
            ORDER BY faseof_sequencia NULLS LAST, faseof_inicio NULLS LAST, faseof_id
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {'of_id': of_id})
            rows = result.fetchall()
            
            return [
                {
                    'faseof_id': row[0],
                    'faseof_of_id': row[1],
                    'faseof_inicio': row[2].isoformat() if row[2] else None,
                    'faseof_fim': row[3].isoformat() if row[3] else None,
                    'faseof_data_prevista': row[4].isoformat() if row[4] else None,
                    'faseof_coeficiente': float(row[5]) if row[5] else None,
                    'faseof_coeficiente_x': float(row[6]) if row[6] else None,
                    'faseof_fase_id': row[7],
                    'faseof_peso': float(row[8]) if row[8] else None,
                    'faseof_retorno': row[9],
                    'faseof_turno': row[10],
                    'faseof_sequencia': row[11],
                }
                for row in rows
            ]
    
    def get_schedule_current(self, fase_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get current schedule (WIP and queue).
        Uses materialized view for performance.
        
        Args:
            fase_id: Optional phase filter
        
        Returns:
            Schedule dict with WIP and queue by phase
        """
        cache_key = f"schedule:current:{fase_id or 'all'}"
        
        # Check cache (30 second TTL)
        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        
        # Query WIP from incremental aggregate table (performance-first)
        # Fallback to direct query if aggregate doesn't exist
        wip_query = text("""
            SELECT 
                fase_id,
                SUM(wip_count) as wip_count,
                AVG(sum_age_seconds / NULLIF(wip_count, 0) / 3600.0) as avg_wip_age_hours,
                MIN(min_age_seconds / 3600.0) as min_wip_age_hours,
                MAX(max_age_seconds / 3600.0) as max_wip_age_hours
            FROM agg_wip_current
            WHERE (:fase_id IS NULL OR fase_id = :fase_id)
            GROUP BY fase_id
        """)
        
        # Fallback WIP query (if agg_wip_current doesn't exist or is empty)
        wip_fallback_query = text("""
            SELECT 
                fof.faseof_fase_id AS fase_id,
                COUNT(*) as wip_count,
                AVG(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) as avg_wip_age_hours,
                MIN(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) as min_wip_age_hours,
                MAX(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) as max_wip_age_hours
            FROM fases_ordem_fabrico fof
            WHERE fof.faseof_inicio IS NOT NULL
              AND fof.faseof_fim IS NULL
              AND (:fase_id IS NULL OR fof.faseof_fase_id = :fase_id)
            GROUP BY fof.faseof_fase_id
        """)
        
        # Query queue (phases not started but in route)
        queue_query = text("""
            SELECT 
                fof.faseof_fase_id AS fase_id,
                COUNT(*) AS queue_count,
                AVG(EXTRACT(EPOCH FROM (NOW() - of.of_data_criacao)) / 3600.0) AS avg_queue_age_hours
            FROM fases_ordem_fabrico fof
            JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
            WHERE fof.faseof_inicio IS NULL
              AND fof.faseof_fim IS NULL
              AND (:fase_id IS NULL OR fof.faseof_fase_id = :fase_id)
            GROUP BY fof.faseof_fase_id
        """)
        
        wip_by_phase = {}
        queue_by_phase = {}
        
        try:
            with self.engine.connect() as conn:
                # Get WIP (try aggregate first, fallback to direct query)
                try:
                    wip_result = conn.execute(wip_query, {'fase_id': fase_id})
                    wip_rows = list(wip_result)
                    if not wip_rows:
                        # Try fallback
                        wip_result = conn.execute(wip_fallback_query, {'fase_id': fase_id})
                        wip_rows = list(wip_result)
                except Exception as e:
                    logger.warning("agg_wip_current_not_available", error=str(e))
                    # Use fallback
                    try:
                        wip_result = conn.execute(wip_fallback_query, {'fase_id': fase_id})
                        wip_rows = list(wip_result)
                    except Exception as e2:
                        logger.error("wip_fallback_query_failed", error=str(e2))
                        wip_rows = []
                
                wip_by_phase = {
                    row[0]: {
                        'wip_count': int(row[1]) if row[1] else 0,
                        'avg_wip_age_hours': float(row[2]) if row[2] else None,
                        'min_wip_age_hours': float(row[3]) if row[3] else None,
                        'max_wip_age_hours': float(row[4]) if row[4] else None,
                    }
                    for row in wip_rows
                }
                
                # Get queue
                try:
                    queue_result = conn.execute(queue_query, {'fase_id': fase_id})
                    queue_by_phase = {
                        row[0]: {
                            'queue_count': int(row[1]) if row[1] else 0,
                            'avg_queue_age_hours': float(row[2]) if row[2] else None,
                        }
                        for row in queue_result
                    }
                except Exception as e:
                    logger.error("queue_query_failed", error=str(e))
                    queue_by_phase = {}
        except Exception as e:
            logger.error("schedule_current_error", error=str(e), exc_info=True)
            # Return empty schedule on any error
            wip_by_phase = {}
            queue_by_phase = {}
        
        schedule = {
            'wip_by_phase': wip_by_phase,
            'queue_by_phase': queue_by_phase,
            'timestamp': datetime.now().isoformat()
        }
        
        # Cache for 30 seconds
        if self.redis_client:
            self.redis_client.setex(cache_key, 30, json.dumps(schedule, default=str))
        
        return schedule

