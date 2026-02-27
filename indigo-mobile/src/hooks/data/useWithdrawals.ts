/**
 * Withdrawals Hook
 * TanStack Query hooks for withdrawal data and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWithdrawals,
  getWithdrawalById,
  getAvailableBalance,
  createWithdrawal,
  cancelWithdrawal,
  getFundsWithBalances,
} from '../../services/withdrawals/withdrawalService';
import { QUERY_KEYS, CACHE_TIMES } from '../../utils/constants';
import type { CreateWithdrawalInput } from '../../types/domains/withdrawal';

/**
 * Hook to fetch withdrawals
 */
export function useWithdrawals() {
  return useQuery({
    queryKey: [QUERY_KEYS.WITHDRAWALS],
    queryFn: () => getWithdrawals(),
    staleTime: CACHE_TIMES.WITHDRAWALS,
  });
}

/**
 * Hook to fetch a single withdrawal
 */
export function useWithdrawal(withdrawalId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.WITHDRAWALS, withdrawalId],
    queryFn: () => getWithdrawalById(withdrawalId!),
    enabled: !!withdrawalId,
    staleTime: CACHE_TIMES.WITHDRAWALS,
  });
}

/**
 * Hook to get available balance for a fund
 */
export function useAvailableBalance(fundId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.AVAILABLE_BALANCE, fundId],
    queryFn: () => getAvailableBalance(fundId!),
    enabled: !!fundId,
    staleTime: CACHE_TIMES.WITHDRAWALS,
  });
}

/**
 * Hook to get funds with available balances
 */
export function useFundsWithBalances() {
  return useQuery({
    queryKey: [QUERY_KEYS.WITHDRAWALS, 'funds-balances'],
    queryFn: () => getFundsWithBalances(),
    staleTime: CACHE_TIMES.WITHDRAWALS,
  });
}

/**
 * Hook to create a withdrawal request
 */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateWithdrawalInput) => createWithdrawal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WITHDRAWALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSITIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AVAILABLE_BALANCE] });
    },
  });
}

/**
 * Hook to cancel a withdrawal request
 */
export function useCancelWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ withdrawalId }: { withdrawalId: string }) =>
      cancelWithdrawal(withdrawalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WITHDRAWALS] });
    },
  });
}
