import { useState, useEffect } from 'react';
import { 
  FactoryOverviewMetrics, 
  OperationCategoryCard, 
  GlobalIndicator, 
  ProductionEvent 
} from '../types/prodplan';
import { apiService } from '../services/api';

export function useFactoryOverview() {
  const [metrics, setMetrics] = useState<FactoryOverviewMetrics | null>(null);
  const [operationCategories, setOperationCategories] = useState<OperationCategoryCard[]>([]);
  const [globalIndicators, setGlobalIndicators] = useState<GlobalIndicator[]>([]);
  const [events, setEvents] = useState<ProductionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, categories, indicators, eventsData] = await Promise.all([
          apiService.getFactoryOverviewMetrics(),
          apiService.getOperationCategories(),
          apiService.getGlobalIndicators(),
          apiService.getProductionEvents(10),
        ]);

        setMetrics(metricsData);
        setOperationCategories(categories);
        setGlobalIndicators(indicators);
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch factory overview'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { metrics, operationCategories, globalIndicators, events, loading, error };
}


