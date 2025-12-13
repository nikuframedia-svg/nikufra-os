"""Service for bottleneck identification and analysis."""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from backend.features.bottleneck_features import compute_bottlenecks
from backend.models import Phase


class BottleneckService:
    """Service for identifying and analyzing production bottlenecks."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
    
    def get_current_bottlenecks(self, top_n: int = 5) -> List[Dict]:
        """
        Get current bottlenecks.
        
        Args:
            top_n: Number of top bottlenecks to return.
        
        Returns:
            List of bottleneck dictionaries with phase info and metrics.
        """
        bottlenecks_df = compute_bottlenecks(self.session, top_n=top_n)
        
        if len(bottlenecks_df) == 0:
            return []
        
        results = []
        for _, row in bottlenecks_df.iterrows():
            phase = self.session.query(Phase).filter(
                Phase.id == row["phase_id"]
            ).first()
            
            results.append({
                "phase_id": row["phase_id"],
                "phase_code": row["phase_code"],
                "phase_name": row["phase_name"],
                "center": row.get("center"),
                "bottleneck_score": float(row["bottleneck_score"]),
                "total_minutes": float(row["total_minutes"]),
                "avg_minutes": float(row["avg_minutes"]),
                "phase_count": int(row["phase_count"]),
                "avg_queue_minutes": float(row["avg_queue_minutes"]),
                "error_count": int(row["error_count"]),
            })
        
        return results
    
    def get_bottleneck_for_machine(self, machine_id: str) -> Optional[Dict]:
        """
        Get bottleneck information for a specific machine.
        
        Args:
            machine_id: Machine identifier.
        
        Returns:
            Bottleneck information or None.
        """
        # TODO: Implement machine-specific bottleneck analysis
        # This will require additional data about machine assignments
        pass
    
    def get_bottleneck_summary(self) -> Dict:
        """
        Get summary of bottleneck situation.
        
        Returns:
            Summary dictionary with key metrics.
        """
        bottlenecks = self.get_current_bottlenecks(top_n=10)
        
        if not bottlenecks:
            return {
                "total_bottlenecks": 0,
                "critical_bottlenecks": 0,
                "avg_bottleneck_score": 0.0,
            }
        
        critical_threshold = 0.7
        critical_bottlenecks = [
            b for b in bottlenecks if b["bottleneck_score"] >= critical_threshold
        ]
        
        avg_score = sum(b["bottleneck_score"] for b in bottlenecks) / len(bottlenecks)
        
        return {
            "total_bottlenecks": len(bottlenecks),
            "critical_bottlenecks": len(critical_bottlenecks),
            "avg_bottleneck_score": avg_score,
            "top_bottleneck": bottlenecks[0] if bottlenecks else None,
        }


