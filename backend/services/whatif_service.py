"""Service for What-If simulations."""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.services.planning_service import PlanningService
from backend.models import Order, OrderPhase, Phase


class WhatIfService:
    """Service for What-If scenario simulations."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
        self.planning_service = PlanningService(session)
    
    def simulate_vip_order(
        self,
        sku: str,
        quantidade: int,
        prazo: str
    ) -> Dict:
        """
        Simulate VIP order scenario.
        
        Args:
            sku: Product SKU.
            quantidade: Order quantity.
            prazo: Due date (ISO format).
        
        Returns:
            Dictionary with simulation results.
        """
        # Get baseline plan
        baseline = self.planning_service.get_plan_v2(use_historical=True)
        
        # Create VIP order (simplified - would create actual order)
        due_date = datetime.fromisoformat(prazo)
        
        # Simulate: VIP orders get highest priority
        # In real implementation, would modify plan with VIP order inserted
        
        # Get optimized plan (with VIP)
        optimized = self.planning_service.get_plan_v2(use_historical=True)
        
        # Calculate impact
        impact = self._calculate_vip_impact(baseline, optimized, sku, quantidade, due_date)
        
        return {
            'baseline': baseline.get('optimized'),
            'optimized': optimized.get('optimized'),
            'impact': impact,
            'vip_order': {
                'sku': sku,
                'quantidade': quantidade,
                'prazo': prazo,
            },
        }
    
    def simulate_machine_breakdown(
        self,
        recurso: str,
        de: str,
        ate: str
    ) -> Dict:
        """
        Simulate machine breakdown scenario.
        
        Args:
            recurso: Machine/resource identifier.
            de: Breakdown start (ISO format).
            ate: Breakdown end (ISO format).
        
        Returns:
            Dictionary with simulation results.
        """
        # Get baseline plan
        baseline = self.planning_service.get_plan_v2(use_historical=True)
        
        # Simulate breakdown: remove capacity during period
        breakdown_start = datetime.fromisoformat(de)
        breakdown_end = datetime.fromisoformat(ate)
        
        # Get optimized plan (with breakdown constraint)
        optimized_plan = baseline.get('optimized', {})
        operations = optimized_plan.get('operations', [])
        
        # Filter out operations on this machine during breakdown
        affected_operations = [
            op for op in operations
            if op.get('maquina_id') == recurso
            and self._overlaps_breakdown(op, breakdown_start, breakdown_end)
        ]
        
        # Reschedule affected operations (simplified)
        rescheduled_ops = self._reschedule_operations(
            operations,
            affected_operations,
            breakdown_start,
            breakdown_end
        )
        
        optimized_plan['operations'] = rescheduled_ops
        optimized_plan['gantt_by_machine'] = self.planning_service._group_by_machine(rescheduled_ops)
        optimized_plan['makespan_h'] = self.planning_service._calculate_makespan(rescheduled_ops)
        
        # Recalculate KPIs
        optimized_plan['kpis'] = self._recalculate_kpis_after_breakdown(
            baseline.get('optimized', {}).get('kpis', {}),
            affected_operations
        )
        
        # Calculate impact
        impact = self._calculate_breakdown_impact(baseline.get('optimized', {}), optimized_plan)
        
        return {
            'baseline': baseline.get('optimized'),
            'optimized': optimized_plan,
            'impact': impact,
            'breakdown': {
                'recurso': recurso,
                'de': de,
                'ate': ate,
                'affected_operations': len(affected_operations),
            },
        }
    
    def _overlaps_breakdown(self, operation: Dict, start: datetime, end: datetime) -> bool:
        """Check if operation overlaps with breakdown period."""
        op_start = datetime.fromisoformat(operation['start_time'])
        op_end = datetime.fromisoformat(operation['end_time'])
        
        return not (op_end <= start or op_start >= end)
    
    def _reschedule_operations(
        self,
        all_operations: List[Dict],
        affected: List[Dict],
        breakdown_start: datetime,
        breakdown_end: datetime
    ) -> List[Dict]:
        """Reschedule operations affected by breakdown."""
        rescheduled = []
        breakdown_duration = (breakdown_end - breakdown_start).total_seconds() / 3600.0
        
        for op in all_operations:
            if op in affected:
                # Move operation after breakdown
                new_start = breakdown_end
                duration = op.get('duracao_h', 1.0)
                new_end = new_start + timedelta(hours=duration)
                
                op_copy = op.copy()
                op_copy['start_time'] = new_start.isoformat()
                op_copy['end_time'] = new_end.isoformat()
                rescheduled.append(op_copy)
            else:
                rescheduled.append(op)
        
        return rescheduled
    
    def _calculate_vip_impact(
        self,
        baseline: Dict,
        optimized: Dict,
        sku: str,
        quantidade: int,
        due_date: datetime
    ) -> Dict:
        """Calculate impact of VIP order."""
        baseline_kpis = baseline.get('optimized', {}).get('kpis', {})
        optimized_kpis = optimized.get('optimized', {}).get('kpis', {})
        
        return {
            'otd_delta': optimized_kpis.get('otd_pct', 0) - baseline_kpis.get('otd_pct', 0),
            'lead_time_delta_h': optimized_kpis.get('lead_time_h', 0) - baseline_kpis.get('lead_time_h', 0),
            'makespan_delta_h': optimized.get('optimized', {}).get('makespan_h', 0) - baseline.get('optimized', {}).get('makespan_h', 0),
            'orders_affected': 0,  # TODO: Calculate
        }
    
    def _calculate_breakdown_impact(self, baseline: Dict, optimized: Dict) -> Dict:
        """Calculate impact of machine breakdown."""
        baseline_kpis = baseline.get('kpis', {})
        optimized_kpis = optimized.get('kpis', {})
        
        return {
            'otd_delta': optimized_kpis.get('otd_pct', 0) - baseline_kpis.get('otd_pct', 0),
            'lead_time_delta_h': optimized_kpis.get('lead_time_h', 0) - baseline_kpis.get('lead_time_h', 0),
            'makespan_delta_h': optimized.get('makespan_h', 0) - baseline.get('makespan_h', 0),
            'operations_delayed': len(optimized.get('operations', [])) - len(baseline.get('operations', [])),
        }
    
    def _recalculate_kpis_after_breakdown(
        self,
        baseline_kpis: Dict,
        affected_operations: List[Dict]
    ) -> Dict:
        """Recalculate KPIs after breakdown."""
        # Simplified: worsen KPIs based on affected operations
        kpis = baseline_kpis.copy()
        
        if affected_operations:
            # Reduce OTD
            kpis['otd_pct'] = max(0, kpis.get('otd_pct', 100) - len(affected_operations) * 2)
            
            # Increase lead time
            kpis['lead_time_h'] = kpis.get('lead_time_h', 0) + len(affected_operations) * 0.5
        
        return kpis


