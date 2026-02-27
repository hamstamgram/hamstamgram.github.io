/**
 * Positions Hook
 * TanStack Query hook for portfolio positions
 */

import { useQuery } from '@tanstack/react-query';
import { getPositions, getPortfolioSummary } from '../../services/portfolio/portfolioService';
import { QUERY_KEYS, CACHE_TIMES } from '../../utils/constants';

/**
 * Hook to fetch investor positions
 */
export function usePositions() {
  return useQuery({
    queryKey: [QUERY_KEYS.POSITIONS],
    queryFn: () => getPositions(),
    staleTime: CACHE_TIMES.POSITIONS,
  });
}

/**
 * Hook to fetch portfolio summary with aggregations
 */
export function usePortfolioSummary() {
  return useQuery({
    queryKey: [QUERY_KEYS.POSITIONS, 'summary'],
    queryFn: () => getPortfolioSummary(),
    staleTime: CACHE_TIMES.POSITIONS,
  });
}
