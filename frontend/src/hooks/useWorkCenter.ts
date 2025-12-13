import { useState, useEffect } from 'react';
import { WorkCenter, WorkCenterKpiBreakdown, TimeBreakdown, EquipmentSpec } from '../types/prodplan';
import { apiService } from '../services/api';

export function useWorkCenter(id: string) {
  const [workCenter, setWorkCenter] = useState<WorkCenter | null>(null);
  const [kpiBreakdown, setKpiBreakdown] = useState<WorkCenterKpiBreakdown | null>(null);
  const [timeBreakdown, setTimeBreakdown] = useState<TimeBreakdown[]>([]);
  const [equipmentSpecs, setEquipmentSpecs] = useState<EquipmentSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [wc, kpi, time, equipment] = await Promise.all([
          apiService.getWorkCenter(id),
          apiService.getWorkCenterKpiBreakdown(id),
          apiService.getTimeBreakdown(id),
          apiService.getEquipmentSpecs(id),
        ]);

        setWorkCenter(wc);
        setKpiBreakdown(kpi);
        setTimeBreakdown(time);
        setEquipmentSpecs(equipment);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch work center data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { workCenter, kpiBreakdown, timeBreakdown, equipmentSpecs, loading, error };
}


