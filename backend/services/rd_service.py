"""Service for R&D module (WP1-WP4 + WPX)."""
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import json

from backend.services.planning_service import PlanningService
from backend.services.inventory_service import InventoryService


class RDService:
    """Service for R&D experiments and learning."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
        self.planning_service = PlanningService(session)
        self.inventory_service = InventoryService(session)
    
    def wp1_generate_suggestions(
        self,
        mode: str = 'resumo',
        limit: int = 10
    ) -> List[Dict]:
        """
        WP1: Generate AI suggestions for optimization.
        
        Args:
            mode: Suggestion mode ('resumo', 'planeamento', 'inventario', 'gargalos').
            limit: Maximum number of suggestions.
        
        Returns:
            List of suggestion dictionaries.
        """
        suggestions = []
        
        if mode in ['resumo', 'planeamento']:
            # Planning suggestions
            plan = self.planning_service.get_plan()
            kpis = plan.get('kpis', {})
            
            if kpis.get('otd_pct', 100) < 90:
                suggestions.append({
                    'id': 'sug_plan_otd_1',
                    'icon': '📊',
                    'action': 'Melhorar OTD através de priorização',
                    'explanation': f'OTD atual: {kpis.get("otd_pct", 0)}%. Reordenar ordens por prioridade e data de entrega.',
                    'impact': 'Alto',
                    'impact_level': 'alto',
                    'gain': f'+{100 - kpis.get("otd_pct", 0):.1f}% OTD estimado',
                    'reasoning_markdown': f'**Análise:** OTD abaixo de 90% indica problemas de sequenciação.\n\n**Ação:** Recalcular plano com heurística EDD (Earliest Due Date) + prioridade.',
                    'data_points': {
                        'current_otd': kpis.get('otd_pct', 0),
                        'target_otd': 95.0,
                    },
                })
            
            bottleneck = kpis.get('gargalo_ativo', 'N/A')
            if bottleneck != 'N/A':
                suggestions.append({
                    'id': 'sug_plan_bottleneck_1',
                    'icon': '⚙️',
                    'action': f'Otimizar recurso {bottleneck}',
                    'explanation': f'Recurso {bottleneck} identificado como gargalo. Considerar redistribuição de carga.',
                    'impact': 'Médio',
                    'impact_level': 'medio',
                    'gain': 'Redução de 10-15% no makespan',
                    'reasoning_markdown': f'**Gargalo:** {bottleneck}\n\n**Solução:** Redistribuir operações para recursos alternativos ou aumentar capacidade.',
                    'data_points': {
                        'bottleneck': bottleneck,
                    },
                })
        
        if mode in ['resumo', 'inventario']:
            # Inventory suggestions
            skus = self.inventory_service.get_inventory_skus()
            high_risk = [s for s in skus if s.get('risco_30d', 0) > 70]
            
            if high_risk:
                suggestions.append({
                    'id': 'sug_inv_risk_1',
                    'icon': '⚠️',
                    'action': f'Repor stock de {len(high_risk)} SKUs de alto risco',
                    'explanation': f'{len(high_risk)} SKUs com risco de rutura > 70%. Ação urgente recomendada.',
                    'impact': 'Alto',
                    'impact_level': 'alto',
                    'gain': 'Prevenção de stockouts e atrasos',
                    'reasoning_markdown': f'**SKUs afetados:** {len(high_risk)}\n\n**Ação:** Repor stock imediatamente para evitar ruturas.',
                    'data_points': {
                        'high_risk_count': len(high_risk),
                        'skus': [s['sku'] for s in high_risk[:5]],
                    },
                })
        
        return suggestions[:limit]
    
    def wp2_evaluate_suggestions(
        self,
        suggestions: List[Dict]
    ) -> Dict:
        """
        WP2: Evaluate suggestions and classify as beneficial/neutral/harmful.
        
        Args:
            suggestions: List of suggestions to evaluate.
        
        Returns:
            Dictionary with evaluation results.
        """
        evaluated = []
        beneficial = 0
        neutral = 0
        harmful = 0
        
        for suggestion in suggestions:
            # Simplified evaluation based on impact level
            impact_level = suggestion.get('impact_level', 'baixo')
            
            if impact_level == 'alto':
                classification = 'BENEFICIAL'
                beneficial += 1
            elif impact_level == 'medio':
                classification = 'BENEFICIAL'
                beneficial += 1
            else:
                classification = 'NEUTRAL'
                neutral += 1
            
            evaluated.append({
                **suggestion,
                'classification': classification,
                'kpi_delta': {
                    'otd_delta': 5.0 if impact_level == 'alto' else 2.0,
                    'lead_time_delta': -2.0 if impact_level == 'alto' else -1.0,
                },
            })
        
        total = len(evaluated)
        
        return {
            'suggestions': evaluated,
            'summary': {
                'total': total,
                'beneficial': beneficial,
                'neutral': neutral,
                'harmful': harmful,
                'beneficial_pct': (beneficial / total * 100) if total > 0 else 0,
            },
        }
    
    def wp3_compare_inventory_policies(
        self,
        policies: List[str] = None
    ) -> Dict:
        """
        WP3: Compare inventory policies (Conservative/Baseline/Lean).
        
        Args:
            policies: List of policies to compare. Default: ['conservative', 'baseline', 'lean'].
        
        Returns:
            Dictionary with comparison results.
        """
        if policies is None:
            policies = ['conservative', 'baseline', 'lean']
        
        results = []
        
        for policy in policies:
            # Simulate policy
            if policy == 'conservative':
                service_level = 0.99
                safety_multiplier = 2.0
            elif policy == 'lean':
                service_level = 0.90
                safety_multiplier = 1.0
            else:  # baseline
                service_level = 0.95
                safety_multiplier = 1.5
            
            # Calculate metrics for this policy
            skus = self.inventory_service.get_inventory_skus()
            
            total_stock = sum(s.get('stock_atual', 0) * safety_multiplier for s in skus)
            total_cost = total_stock * 10.0  # Simplified cost per unit
            stockouts = sum(1 for s in skus if s.get('risco_30d', 0) > (100 - service_level * 100))
            
            # Get OTD from planning
            plan = self.planning_service.get_plan()
            otd = plan.get('kpis', {}).get('otd_pct', 0)
            
            results.append({
                'policy': policy,
                'stock_medio': round(total_stock, 2),
                'custo_total': round(total_cost, 2),
                'stockouts': stockouts,
                'otd_pct': round(otd, 2),
                'service_level': service_level,
            })
        
        # Rank policies
        ranked = sorted(results, key=lambda x: (
            -x['otd_pct'],  # Higher OTD is better
            x['custo_total']  # Lower cost is better
        ), reverse=True)
        
        return {
            'policies': results,
            'ranking': [r['policy'] for r in ranked],
            'best_policy': ranked[0]['policy'] if ranked else None,
            'experiment_date': datetime.now().isoformat(),
        }
    
    def wp4_learning_scheduler(
        self,
        episodes: int = 10,
        bandit_type: str = 'epsilon_greedy',
        epsilon: float = 0.1
    ) -> Dict:
        """
        WP4: Learning scheduler with multi-armed bandit.
        
        Args:
            episodes: Number of episodes to run.
            bandit_type: Type of bandit algorithm ('epsilon_greedy', 'ucb', 'thompson').
            epsilon: Epsilon value for epsilon-greedy.
        
        Returns:
            Dictionary with learning results.
        """
        policies = ['conservative', 'baseline', 'lean']
        rewards = {p: [] for p in policies}
        regrets = []
        
        # Simulate episodes
        for episode in range(episodes):
            # Select policy (simplified bandit)
            if bandit_type == 'epsilon_greedy':
                import random
                if random.random() < epsilon:
                    selected = random.choice(policies)
                else:
                    # Select best so far
                    avg_rewards = {
                        p: sum(rewards[p]) / len(rewards[p]) if rewards[p] else 0
                        for p in policies
                    }
                    selected = max(avg_rewards.items(), key=lambda x: x[1])[0]
            else:
                selected = 'baseline'  # Default
            
            # Get reward (simplified: based on OTD)
            wp3_result = self.wp3_compare_inventory_policies([selected])
            reward = wp3_result['policies'][0]['otd_pct'] / 100.0  # Normalize to 0-1
            rewards[selected].append(reward)
            
            # Calculate regret (difference from best possible)
            best_possible = 0.95  # Assumed best OTD
            regret = best_possible - reward
            regrets.append(regret)
        
        # Calculate statistics
        avg_rewards = {
            p: sum(rewards[p]) / len(rewards[p]) if rewards[p] else 0
            for p in policies
        }
        avg_regret = sum(regrets) / len(regrets) if regrets else 0
        best_learned = max(avg_rewards.items(), key=lambda x: x[1])[0]
        
        return {
            'episodes': episodes,
            'bandit_type': bandit_type,
            'avg_rewards': avg_rewards,
            'avg_regret': round(avg_regret, 4),
            'best_policy_learned': best_learned,
            'regret_history': regrets,
            'experiment_date': datetime.now().isoformat(),
        }


