import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest, apiPaths } from '../lib/api';

export function useOrgProfile() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-profile'],
        queryFn: () => apiRequest(apiPaths.orgMe, {}, getToken),
    });
}

export function useOrgStats() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-stats'],
        queryFn: () => apiRequest(apiPaths.orgStats, {}, getToken),
    });
}

export function useOrgVolunteers() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-volunteers'],
        queryFn: () => apiRequest(apiPaths.orgVolunteers, {}, getToken),
    });
}

export function useOrgResources() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-resources'],
        queryFn: () => apiRequest(apiPaths.orgResources, {}, getToken),
    });
}

export function useOrgTasks(status) {
    const { getToken } = useAuth();
    const path = status ? `${apiPaths.orgTasks}?status=${status}` : apiPaths.orgTasks;
    return useQuery({
        queryKey: ['org-tasks', status],
        queryFn: () => apiRequest(path, {}, getToken),
    });
}

export function useOrgZones() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-zones'],
        queryFn: () => apiRequest(apiPaths.orgZones, {}, getToken),
    });
}

export function useRegisterOrg() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiRequest(apiPaths.orgRegister, {
            method: 'POST', body: JSON.stringify(data),
        }, getToken),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['user-me'] }); },
    });
}

export function useUpdateOrg() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiRequest(apiPaths.orgMe, {
            method: 'PUT', body: JSON.stringify(data),
        }, getToken),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-profile'] }); },
    });
}

export function useUpdateAiPreference() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ai_allocation_preference) => apiRequest(`${apiPaths.orgMe}/ai-preference`, {
            method: 'PUT', body: JSON.stringify({ ai_allocation_preference }),
        }, getToken),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-profile'] }); },
    });
}

export function useLinkVolunteer() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId) => apiRequest(apiPaths.orgLinkVolunteer(userId), {
            method: 'POST',
        }, getToken),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['org-volunteers'] });
            qc.invalidateQueries({ queryKey: ['org-stats'] });
        },
    });
}

export function useUnlinkVolunteer() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId) => apiRequest(apiPaths.orgLinkVolunteer(userId), {
            method: 'DELETE',
        }, getToken),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['org-volunteers'] });
            qc.invalidateQueries({ queryKey: ['org-stats'] });
        },
    });
}

export function useCreateOrgResource() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiRequest(apiPaths.orgResources, {
            method: 'POST', body: JSON.stringify(data),
        }, getToken),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['org-resources'] });
            qc.invalidateQueries({ queryKey: ['org-stats'] });
        },
    });
}

export function useOrgRequests() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['org-requests'],
        queryFn: () => apiRequest(apiPaths.orgRequests, {}, getToken),
    });
}

export function useAcceptOrgRequest() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ assignmentId, contributions }) =>
            apiRequest(apiPaths.orgAcceptRequest(assignmentId), {
                method: 'POST', body: JSON.stringify({ contributions }),
            }, getToken),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['org-requests'] }),
    });
}

export function useRejectOrgRequest() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (assignmentId) =>
            apiRequest(apiPaths.orgRejectRequest(assignmentId), { method: 'POST' }, getToken),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['org-requests'] }),
    });
}

export function useAssignCoordinator() {
    const { getToken } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ assignmentId, coordinator_id, zone_id }) =>
            apiRequest(apiPaths.orgAssignCoordinator(assignmentId), {
                method: 'POST', body: JSON.stringify({ coordinator_id, zone_id }),
            }, getToken),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['org-requests'] });
            qc.invalidateQueries({ queryKey: ['org-volunteers'] });
        },
    });
}

