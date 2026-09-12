import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest, apiPaths } from '../lib/api';

export function useGlobalSearch(query) {
    const { getToken, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['search', query],
        queryFn: () => apiRequest(apiPaths.search(query), {}, getToken),
        enabled: isSignedIn === true && query.trim().length >= 2,
        staleTime: 60 * 1000, // 1 minute
    });
}
