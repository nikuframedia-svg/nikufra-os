"""
WHAT-IF Service: Deterministic simulation engine.
Simulates production scenarios without modifying production data.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import hashlib
import json
import structlog

logger = structlog.get_logger()


class WhatIfService:
    """WHAT-IF simulation service."""
    
    def __init__(self, db_url: str):
        """
        Initialize service.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
    
    def simulate(
        self,
        capacity_overrides: Optional[Dict[int, Dict[str, Any]]] = None,
        coeficiente_overrides: Optional[Dict[str, Dict[str, float]]] = None,
        priority_rule: str = "FIFO",  # FIFO, EDD, SLACK
        order_filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run WHAT-IF simulation.
        
        Args:
            capacity_overrides: Dict mapping fase_id to capacity changes
                Example: {46: {"n_funcionarios": 10, "throughput_multiplier": 1.2}}
            coeficiente_overrides: Dict mapping faseof_id to coefficient changes
                Example: {"12345": {"coeficiente": 0.8, "coeficiente_x": 1.1}}
            priority_rule: Priority rule (FIFO, EDD, SLACK)
            order_filter: Filter orders to simulate (e.g., {"modelo_id": 123, "status": "pending"})
        
        Returns:
            Simulation results with delta KPIs
        """
        logger.info("whatif_simulation_started", priority_rule=priority_rule)
        
        # Build input hash for idempotency
        input_data = {
            "capacity_overrides": capacity_overrides or {},
            "coeficiente_overrides": coeficiente_overrides or {},
            "priority_rule": priority_rule,
            "order_filter": order_filter or {}
        }
        input_json = json.dumps(input_data, sort_keys=True)
        version_hash = hashlib.sha256(input_json.encode()).hexdigest()[:16]
        
        # Check if simulation already exists
        existing = self._get_existing_simulation(version_hash)
        if existing:
            logger.info("whatif_simulation_cache_hit", version_hash=version_hash)
            return existing
        
        # Get baseline KPIs
        baseline_kpis = self._get_baseline_kpis(order_filter)
        
        # Run simulation (in-memory, deterministic)
        simulated_kpis = self._run_simulation(
            capacity_overrides,
            coeficiente_overrides,
            priority_rule,
            order_filter
        )
        
        # Calculate deltas
        delta_kpis = {
            "on_time_rate": simulated_kpis["on_time_rate"] - baseline_kpis["on_time_rate"],
            "makespan": simulated_kpis["makespan"] - baseline_kpis["makespan"],
            "avg_leadtime": simulated_kpis["avg_leadtime"] - baseline_kpis["avg_leadtime"],
            "wip_peak": simulated_kpis["wip_peak"] - baseline_kpis["wip_peak"],
        }
        
        # Get top affected orders
        top_affected = self._get_top_affected_orders(
            simulated_kpis.get("order_delays", {})
        )
        
        output_data = {
            "baseline_kpis": baseline_kpis,
            "simulated_kpis": simulated_kpis,
            "delta_kpis": delta_kpis,
            "top_affected_orders": top_affected,
            "version_hash": version_hash
        }
        
        # Persist simulation
        self._persist_simulation(input_json, json.dumps(output_data), version_hash)
        
        logger.info("whatif_simulation_completed", version_hash=version_hash)
        
        return output_data
    
    def _get_baseline_kpis(self, order_filter: Optional[Dict[str, Any]]) -> Dict[str, float]:
        """Get baseline KPIs from materialized views."""
        # Use materialized views for performance
        query = text("""
            SELECT 
                AVG(avg_leadtime_hours) as avg_leadtime,
                AVG(on_time_rate) as on_time_rate
            FROM mv_order_leadtime_by_model
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query)
            row = result.fetchone()
            
            if row and row[0]:
                return {
                    "avg_leadtime": float(row[0]),
                    "on_time_rate": float(row[1]) if row[1] else 0.0,
                    "makespan": 0.0,  # Would need to compute from actual data
                    "wip_peak": 0.0   # Would need to compute from actual data
                }
        
        return {
            "avg_leadtime": 0.0,
            "on_time_rate": 0.0,
            "makespan": 0.0,
            "wip_peak": 0.0
        }
    
    def _run_simulation(
        self,
        capacity_overrides: Optional[Dict[int, Dict[str, Any]]],
        coeficiente_overrides: Optional[Dict[str, Dict[str, float]]],
        priority_rule: str,
        order_filter: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Run deterministic simulation.
        
        This is a simplified simulation engine. For production, you'd want:
        - Discrete event simulation
        - Resource constraints
        - Queue management
        - Priority scheduling
        """
        # Simplified simulation: adjust durations based on overrides
        
        # Get current WIP and queue
        wip_query = text("""
            SELECT 
                faseof_fase_id,
                COUNT(*) as wip_count,
                AVG(EXTRACT(EPOCH FROM (NOW() - faseof_inicio)) / 3600.0) as avg_age
            FROM fases_ordem_fabrico
            WHERE faseof_inicio IS NOT NULL AND faseof_fim IS NULL
            GROUP BY faseof_fase_id
        """)
        
        queue_query = text("""
            SELECT 
                faseof_fase_id,
                COUNT(*) as queue_count
            FROM fases_ordem_fabrico
            WHERE faseof_inicio IS NULL AND faseof_fim IS NULL
            GROUP BY faseof_fase_id
        """)
        
        with self.engine.connect() as conn:
            wip_result = conn.execute(wip_query)
            queue_result = conn.execute(queue_query)
            
            wip_by_phase = {row[0]: {"count": row[1], "avg_age": float(row[2]) if row[2] else 0} 
                          for row in wip_result}
            queue_by_phase = {row[0]: row[1] for row in queue_result}
        
        # Apply capacity overrides (simplified: reduce processing time)
        simulated_durations = {}
        for fase_id, overrides in (capacity_overrides or {}).items():
            multiplier = 1.0 / overrides.get("throughput_multiplier", 1.0)
            if fase_id in wip_by_phase:
                simulated_durations[fase_id] = wip_by_phase[fase_id]["avg_age"] * multiplier
        
        # Calculate simulated KPIs (simplified)
        # In production, this would be a full discrete event simulation
        simulated_on_time = 0.85  # Placeholder - would compute from simulation
        simulated_leadtime = 120.0  # Placeholder - would compute from simulation
        
        return {
            "on_time_rate": simulated_on_time,
            "avg_leadtime": simulated_leadtime,
            "makespan": simulated_leadtime * 1.1,  # Simplified
            "wip_peak": max([w["count"] for w in wip_by_phase.values()] + [0]),
            "order_delays": {}  # Would contain actual delays per order
        }
    
    def _get_top_affected_orders(self, order_delays: Dict[str, float]) -> List[Dict[str, Any]]:
        """Get top N orders most affected by simulation."""
        if not order_delays:
            return []
        
        sorted_orders = sorted(order_delays.items(), key=lambda x: x[1], reverse=True)
        return [
            {"of_id": of_id, "delay_hours": delay}
            for of_id, delay in sorted_orders[:10]
        ]
    
    def _get_existing_simulation(self, version_hash: str) -> Optional[Dict[str, Any]]:
        """Check if simulation with this hash already exists."""
        query = text("""
            SELECT output_json
            FROM whatif_runs
            WHERE version_hash = :version_hash
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"version_hash": version_hash})
            row = result.fetchone()
            
            if row and row[0]:
                return json.loads(row[0])
        
        return None
    
    def _persist_simulation(self, input_json: str, output_json: str, version_hash: str):
        """Persist simulation run."""
        query = text("""
            INSERT INTO whatif_runs (input_json, output_json, version_hash)
            VALUES (:input_json, :output_json, :version_hash)
        """)
        
        with self.engine.connect() as conn:
            conn.execute(query, {
                "input_json": input_json,
                "output_json": output_json,
                "version_hash": version_hash
            })
            conn.commit()

