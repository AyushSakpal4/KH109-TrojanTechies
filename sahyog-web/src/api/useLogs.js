import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '../lib/api';

export function useAdminLogs() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['admin-logs'],
        queryFn: () => apiRequest('/api/v1/logs/admin', {}, getToken),
        refetchInterval: 10000, // Poll every 10 seconds for real-time feel
    });
}

export function useOrgLogs() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-logs'],
        queryFn: () => apiRequest('/api/v1/logs/org', {}, getToken),
        refetchInterval: 10000,
    });
}
