import { QueryClient } from "@tanstack/react-query";

/*
 * QUERY CLIENT CONFIGURATION
 * 
 * staleTime: 2 min — data is "fresh" for 2 minutes.
 * During this window, React Query uses cached data
 * without making a network request.
 * 
 * To override per query:
 *   useQuery({ staleTime: 30 * 1000 })  ← 30 seconds
 *   useQuery({ staleTime: Infinity })   ← never refetch
 * 
 * gcTime: 5 min — unused cached data cleared after
 * 5 minutes of no subscribers.
 */

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // Never retry auth errors
                if (error?.response?.status === 401) return false;
                if (error?.response?.status === 403) return false;
                if (error?.response?.status === 404) return false;
                // Retry network errors up to 2 times
                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});

export default queryClient;
