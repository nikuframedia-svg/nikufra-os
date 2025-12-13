"""Example usage of the Nelo data foundations system."""
from backend.models.database import get_session, init_db
from backend.data_ingestion.folha_ia.ingest import FolhaIAIngester
from backend.features.compute_all import compute_and_store_all_features
from backend.features.order_features import compute_order_lead_times, compute_order_statistics
from backend.features.phase_features import compute_phase_durations
from backend.features.worker_features import compute_worker_productivity
from backend.features.bottleneck_features import compute_bottlenecks
from backend.ml_hooks.prediction_services import (
    OrderDurationPredictionService,
    PhaseDurationPredictionService,
    RouteSuggestionService,
)
from backend.ml_hooks.schemas import (
    PredictOrderDurationRequest,
    PredictPhaseDurationRequest,
    SuggestRouteRequest,
)


def main():
    """Example workflow."""
    print("=" * 60)
    print("NELO DATA FOUNDATIONS - EXAMPLE USAGE")
    print("=" * 60)
    
    # Initialize database
    print("\n1. Initializing database...")
    init_db()
    session = get_session()
    
    # Ingest data from Excel
    print("\n2. Ingesting data from Folha_IA.xlsx...")
    try:
        ingester = FolhaIAIngester()
        results = ingester.ingest_all()
        print(f"Ingestion results: {results}")
    except FileNotFoundError as e:
        print(f"Warning: {e}")
        print("Please place Folha_IA.xlsx in data/raw/ directory")
        return
    
    # Compute features
    print("\n3. Computing features...")
    try:
        compute_and_store_all_features(session, recompute=True)
        print("Features computed successfully")
    except Exception as e:
        print(f"Warning: Feature computation failed: {e}")
    
    # Analyze order lead times
    print("\n4. Analyzing order lead times...")
    lead_times = compute_order_lead_times(session)
    if len(lead_times) > 0:
        print(f"Total orders with lead times: {len(lead_times)}")
        print(f"Average lead time: {lead_times['lead_time_days'].mean():.2f} days")
        print(f"Median lead time: {lead_times['lead_time_days'].median():.2f} days")
    
    # Analyze phase durations
    print("\n5. Analyzing phase durations...")
    phase_durations = compute_phase_durations(session)
    if len(phase_durations) > 0:
        print(f"Total phases analyzed: {len(phase_durations)}")
        print(f"Average duration: {phase_durations['real_duration_minutes'].mean():.2f} minutes")
    
    # Analyze worker productivity
    print("\n6. Analyzing worker productivity...")
    worker_prod = compute_worker_productivity(session)
    if len(worker_prod) > 0:
        print(f"Total workers analyzed: {len(worker_prod)}")
        print(f"Top worker by phases: {worker_prod.loc[worker_prod['total_phases_executed'].idxmax(), 'worker_name']}")
    
    # Identify bottlenecks
    print("\n7. Identifying bottlenecks...")
    bottlenecks = compute_bottlenecks(session, top_n=5)
    if len(bottlenecks) > 0:
        print("Top 5 bottlenecks:")
        for idx, row in bottlenecks.iterrows():
            print(f"  - {row['phase_name']}: Score {row['bottleneck_score']:.3f}")
    
    # Test prediction services
    print("\n8. Testing prediction services...")
    order_pred_service = OrderDurationPredictionService(session)
    request = PredictOrderDurationRequest()
    prediction = order_pred_service.predict(request)
    print(f"Order duration prediction: {prediction.predicted_duration_days:.2f} days")
    print(f"Method: {prediction.method}")
    
    phase_pred_service = PhaseDurationPredictionService(session)
    phase_request = PredictPhaseDurationRequest()
    phase_prediction = phase_pred_service.predict(phase_request)
    print(f"Phase duration prediction: {phase_prediction.predicted_duration_minutes:.2f} minutes")
    print(f"Method: {phase_prediction.method}")
    
    route_service = RouteSuggestionService(session)
    route_request = SuggestRouteRequest()
    route_suggestion = route_service.suggest(route_request)
    print(f"Route suggestion: {len(route_suggestion.suggested_sequence)} phases")
    print(f"Total estimated duration: {route_suggestion.total_estimated_duration_hours:.2f} hours")
    
    print("\n" + "=" * 60)
    print("Example completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()


