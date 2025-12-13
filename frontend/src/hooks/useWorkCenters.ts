import { useState, useEffect } from 'react';
import { WorkCenter } from '../types/prodplan';
import { apiService } from '../services/api';

export function useWorkCenters() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWorkCenters = async () => {
      try {
        setLoading(true);
        const data = await apiService.getWorkCenters();
        setWorkCenters(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch work centers'));
        // Fallback to mock data on error
        setWorkCenters([
          { 
            id: "MC-01", 
            name: "Linha de Corte 1", 
            factory: "Planta Porto", 
            area: "Corte", 
            floor: "Piso 1", 
            status: "running", 
            oee: 87, 
            currentOrder: "OP-2025-001" 
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkCenters();
  }, []);

  return { workCenters, loading, error };
}


