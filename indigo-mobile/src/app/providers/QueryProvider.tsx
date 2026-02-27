/**
 * TanStack Query Provider
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with sensible defaults for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on error by default
      retry: 1,
      // Consider data stale after 1 minute
      staleTime: 60 * 1000,
      // Keep data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Refetch on mount if stale
      refetchOnMount: true,
      // Don't refetch on window focus (mobile doesn't have window focus)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Export the query client for imperative use
export { queryClient };
