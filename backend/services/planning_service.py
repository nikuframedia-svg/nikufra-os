"""Service for production planning (PRODPLAN)."""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import pandas as pd

from backend.models import Order, OrderPhase, Phase, Product
from backend.features.order_features import compute_order_lead_times
from backend.features.phase_features import compute_phase_durations


class PlanningService:
    """Service for production planning and scheduling."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
    
    def get_plan(
        self,
        horizon_days: int = 30,
        use_historical_times: bool = True,
        priority_filter: Optional[int] = None
    ) -> Dict:
        """
        Generate production plan.
        
        Args:
            horizon_days: Planning horizon in days.
            use_historical_times: Whether to use historical execution times.
            priority_filter: Optional priority filter.
        
        Returns:
            Dictionary with plan operations and KPIs.
        """
        # Get orders - use all orders since status may not be set
        # Filter by horizon if needed
        query = self.session.query(Order)
        
        # Filter by creation date if horizon is specified
        if horizon_days > 0:
            from datetime import datetime, timedelta
            horizon_date = datetime.now() - timedelta(days=horizon_days)
            query = query.filter(
                or_(
                    Order.creation_date >= horizon_date,
                    Order.creation_date.is_(None)
                )
            )
        
        if priority_filter is not None:
            query = query.filter(Order.priority == priority_filter)
        
        # Limit to reasonable number for performance
        orders = query.limit(1000).all()
        
        # Get operations for these orders
        operations = []
        for order in orders:
            # Sort phases by sequence_order (from Excel) or start_date
            phases = sorted(
                order.phases,
                key=lambda p: (
                    p.sequence_order if p.sequence_order is not None else 999,
                    p.start_date if p.start_date and p.start_date.year > 1900 else datetime.max,
                    p.id or 0
                )
            )
            
            for idx, phase in enumerate(phases):
                phase_model = self.session.query(Phase).filter(
                    Phase.id == phase.phase_id
                ).first()
                
                if not phase_model:
                    continue
                
                # Calculate duration
                duration_h = self._get_phase_duration(phase, use_historical_times)
                
                # Use real dates from Excel if available
                start_time = self._estimate_start_time(order, phase, duration_h, idx)
                end_time = start_time + timedelta(hours=duration_h)
                
                # Use phase_code as rota (route identifier)
                rota = phase_model.phase_code or phase_model.name or f"R{phase.phase_id}"
                
                operations.append({
                    'order_id': f"ORD-{order.of_id}" if order.of_id else f"ORD-{order.id}",
                    'op_id': f"{order.of_id or order.id}-OP{idx+1}",
                    'rota': rota,
                    'maquina_id': phase_model.phase_code or phase.machine_id or f"MAQ{phase.phase_id}",
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'quantidade': float(order.quantity or 1),
                    'duracao_h': duration_h,
                    'family': phase_model.name or phase_model.phase_code or 'DEFAULT',
                })
        
        # Calculate KPIs
        kpis = self._calculate_plan_kpis(orders, operations)
        
        return {
            'operations': operations,
            'kpis': kpis,
            'gantt_by_machine': self._group_by_machine(operations),
            'makespan_h': self._calculate_makespan(operations),
            'total_setup_h': 0.0,  # TODO: Calculate from setup times
        }
    
    def _get_phase_duration(self, phase: OrderPhase, use_historical: bool) -> float:
        """Get phase duration in hours (use real data from Excel)."""
        # Use real dates from Excel if valid (not 1900-01-01 placeholder)
        if use_historical and phase.start_date and phase.end_date:
            if phase.start_date.year > 1900 and phase.end_date.year > 1900:
                delta = phase.end_date - phase.start_date
                hours = delta.total_seconds() / 3600.0
                if hours > 0 and hours < 10000:  # Reasonable range
                    return hours
        
        # Use duration_minutes if available
        if phase.duration_minutes:
            hours = float(phase.duration_minutes) / 60.0
            if hours > 0 and hours < 10000:
                return hours
        
        # Use standard duration from phase model
        phase_model = self.session.query(Phase).filter(
            Phase.id == phase.phase_id
        ).first()
        
        if phase_model and hasattr(phase_model, 'standard_duration_minutes') and phase_model.standard_duration_minutes:
            hours = float(phase_model.standard_duration_minutes) / 60.0
            if hours > 0:
                return hours
        
        # Default: 2 hours (reasonable default for manufacturing phases)
        return 2.0
    
    def _estimate_start_time(
        self,
        order: Order,
        phase: OrderPhase,
        duration_h: float,
        phase_index: int
    ) -> datetime:
        """Estimate start time for phase (use real data from Excel)."""
        # Use real start_date from Excel if valid (not 1900-01-01 placeholder)
        if phase.start_date and phase.start_date.year > 1900:
            return phase.start_date
        
        # Use planned_start if valid
        if phase.planned_start and phase.planned_start.year > 1900:
            return phase.planned_start
        
        # Get previous phases sorted by sequence
        previous_phases = sorted(
            [p for p in order.phases if p.sequence_order is not None and p.sequence_order < (phase.sequence_order or 999)],
            key=lambda p: p.sequence_order or 999
        )
        
        if previous_phases:
            # Start after last phase ends
            last_phase = previous_phases[-1]
            if last_phase.end_date and last_phase.end_date.year > 1900:
                return last_phase.end_date
            if last_phase.planned_end and last_phase.planned_end.year > 1900:
                return last_phase.planned_end
            # If last phase has valid start, add its duration
            if last_phase.start_date and last_phase.start_date.year > 1900:
                last_duration = self._get_phase_duration(last_phase, True)
                return last_phase.start_date + timedelta(hours=last_duration)
        
        # Start from order creation date (from Excel) or now
        if order.creation_date and order.creation_date.year > 1900:
            return order.creation_date
        
        # Fallback to now
        return datetime.now()
    
    def _calculate_plan_kpis(self, orders: List[Order], operations: List[Dict]) -> Dict:
        """Calculate plan KPIs."""
        if not orders:
            return {
                'otd_pct': 0.0,
                'lead_time_h': 0.0,
                'gargalo_ativo': 'N/A',
                'horas_setup_semana': 0.0,
            }
        
        # Calculate OTD (On-Time Delivery) - simplified
        total_orders = len(orders)
        on_time = sum(
            1 for o in orders
            if o.completion_date and o.completion_date <= (o.creation_date or datetime.now())
        )
        otd_pct = (on_time / total_orders * 100) if total_orders > 0 else 0.0
        
        # Calculate average lead time
        lead_times = compute_order_lead_times(self.session)
        avg_lead_time_h = lead_times['lead_time_days'].mean() * 24 if len(lead_times) > 0 else 0.0
        
        # Find bottleneck (phase with most operations)
        if operations:
            machine_counts = {}
            for op in operations:
                machine = op.get('maquina_id', 'UNKNOWN')
                machine_counts[machine] = machine_counts.get(machine, 0) + 1
            
            bottleneck = max(machine_counts.items(), key=lambda x: x[1])[0] if machine_counts else 'N/A'
        else:
            bottleneck = 'N/A'
        
        return {
            'otd_pct': round(otd_pct, 2),
            'lead_time_h': round(avg_lead_time_h, 2),
            'gargalo_ativo': bottleneck,
            'horas_setup_semana': 0.0,  # TODO: Calculate from setup data
        }
    
    def _group_by_machine(self, operations: List[Dict]) -> Dict[str, List[Dict]]:
        """Group operations by machine."""
        grouped = {}
        for op in operations:
            machine = op.get('maquina_id', 'UNKNOWN')
            if machine not in grouped:
                grouped[machine] = []
            grouped[machine].append(op)
        return grouped
    
    def _calculate_makespan(self, operations: List[Dict]) -> float:
        """Calculate makespan (total time from first start to last end)."""
        if not operations:
            return 0.0
        
        start_times = [datetime.fromisoformat(op['start_time']) for op in operations]
        end_times = [datetime.fromisoformat(op['end_time']) for op in operations]
        
        first_start = min(start_times)
        last_end = max(end_times)
        
        delta = last_end - first_start
        return delta.total_seconds() / 3600.0
    
    def get_plan_v2(
        self,
        batch_id: Optional[str] = None,
        horizon_hours: int = 720,
        use_historical: bool = True
    ) -> Dict:
        """
        Generate plan using V2 API format.
        
        Args:
            batch_id: Optional batch identifier.
            horizon_hours: Planning horizon in hours.
            use_historical: Whether to use historical times.
        
        Returns:
            PlanV2Response format dictionary.
        """
        plan = self.get_plan(
            horizon_days=horizon_hours // 24,
            use_historical_times=use_historical
        )
        
        all_machines = list(plan['gantt_by_machine'].keys())
        
        return {
            'batch_id': batch_id or f"batch_{datetime.now().isoformat()}",
            'horizon_hours': horizon_hours,
            'created_at': datetime.now().isoformat(),
            'baseline': None,
            'optimized': {
                'makespan_h': plan['makespan_h'],
                'total_setup_h': plan['total_setup_h'],
                'kpis': plan['kpis'],
                'operations': plan['operations'],
                'gantt_by_machine': plan['gantt_by_machine'],
                'all_machines': all_machines,
            },
            'config': {
                'use_historical_times': use_historical,
                'horizon_hours': horizon_hours,
            },
        }

