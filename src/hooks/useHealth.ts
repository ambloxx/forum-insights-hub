import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '@/lib/api';
import type { HealthData } from '@/types';

export function useHealth() {
  return useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
    retry: 1,
  });
}
