import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest, apiPaths } from '../lib/api';

export function useZonesSummary() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['zones', 'summary'],
    queryFn: () => apiRequest(apiPaths.zonesSummary, {}, getToken),
    enabled: isSignedIn === true,
    refetchInterval: 20000,
  });
}

export function useEscalatedTasks({ zone, coordinator, sort = 'delay_desc' } = {}) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['tasks', 'escalated', { zone, coordinator, sort }],
    queryFn: () =>
      apiRequest(
        apiPaths.tasksEscalated,
        {
          query: {
            ...(zone ? { zone } : {}),
            ...(coordinator ? { coordinator } : {}),
            sort,
          },
        },
        getToken,
      ),
    enabled: isSignedIn === true,
    refetchInterval: 15000,
  });
}

export function useVolunteerLocations() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['volunteers', 'locations'],
    queryFn: () => apiRequest(apiPaths.volunteerLocations, {}, getToken),
    enabled: isSignedIn === true,
    refetchInterval: 10000,
  });
}

export function useActiveNeeds() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['needs', 'active'],
    queryFn: () => apiRequest(apiPaths.activeNeeds, {}, getToken),
    enabled: isSignedIn === true,
    refetchInterval: 12000,
  });
}

export function useZonesGeoJson() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['zones', 'geojson'],
    queryFn: () => apiRequest(apiPaths.zonesGeojson, {}, getToken),
    enabled: isSignedIn === true,
    refetchInterval: 30000,
  });
}

export function useCoordinatorMetrics() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['coordinators', 'metrics'],
    queryFn: () => apiRequest(apiPaths.coordinatorsMetrics, {}, getToken),
    enabled: isSignedIn === true,
    refetchInterval: 20000,
  });
}

export function useDisasterReport(disasterId) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['disasters', 'report', disasterId],
    queryFn: () => apiRequest(apiPaths.disasterReport(disasterId), {}, getToken),
    enabled: isSignedIn === true && !!disasterId,
  });
}

export function useReassignTasksFromInactiveCoordinator() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) =>
      apiRequest(
        apiPaths.adminReassignTasks,
        { method: 'POST', body: JSON.stringify(body) },
        getToken,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'escalated'] });
      queryClient.invalidateQueries({ queryKey: ['coordinators', 'metrics'] });
    },
  });
}

export function useDeactivateVolunteer() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ volunteerId, reason }) =>
      apiRequest(
        apiPaths.adminDeactivateVolunteer(volunteerId),
        { method: 'PATCH', body: JSON.stringify({ reason }) },
        getToken,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['volunteers', 'locations'] });
    },
  });
}

export function useCloseDisaster() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disasterId) =>
      apiRequest(apiPaths.disasterResolve(disasterId), { method: 'POST' }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasters'] });
      queryClient.invalidateQueries({ queryKey: ['zones', 'summary'] });
    },
  });
}

export function useFreezeZone() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ zoneId, note }) =>
      apiRequest(
        apiPaths.adminFreezeZone(zoneId),
        { method: 'PATCH', body: JSON.stringify({ note, is_frozen: true }) },
        getToken,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['zones', 'geojson'] });
    },
  });
}
