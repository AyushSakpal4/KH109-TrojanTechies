import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useDispatch } from 'react-redux';
import { apiRequest, apiPaths, pingBackend } from '../lib/api';
import { setProfile, clearProfile } from '../store/slices/authSlice';

export function useBackendHealth() {
  return useQuery({
    queryKey: ['backend', 'health'],
    queryFn: pingBackend,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useMe() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const token = await getToken({ skipCache: false });
      if (!token) throw new Error('No session token.');
      return apiRequest(apiPaths.me, {}, () => Promise.resolve(token));
    },
    enabled: isLoaded === true && isSignedIn === true,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => error?.status === 401 && failureCount < 2,
  });

  useEffect(() => {
    if (query.data) dispatch(setProfile(query.data));
    if (query.isError && query.error?.status === 401) dispatch(clearProfile());
  }, [query.data, query.isError, query.error?.status, dispatch]);

  return query;
}

export function useNeedsList() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['needs', 'list'],
    queryFn: () => apiRequest(apiPaths.needs, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useSosList() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['sos', 'list'],
    queryFn: () => apiRequest(apiPaths.sos, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useSosTasks(sosId) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['sos', sosId, 'tasks'],
    queryFn: () => apiRequest(apiPaths.sosTasks(sosId), {}, getToken),
    enabled: isSignedIn === true && !!sosId,
  });
}

export function useDeleteSos() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiRequest(apiPaths.sosDetail(id), { method: 'DELETE' }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos', 'list'] });
    },
  });
}

export function useUpdateSosStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolution_proof, resolution_notes }) =>
      apiRequest(apiPaths.sosDetail(id) + '/status', { 
        method: 'PATCH', 
        body: JSON.stringify({ status, resolution_proof, resolution_notes }) 
      }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos', 'list'] });
    },
    onError: (error) => {
      // Handle proof requirement error for volunteers
      if (error.status === 403 && error.message?.includes('proof')) {
        throw new Error('Resolution requires photo/video proof. Upload proof and try again.');
      }
      throw error;
    }
  });
}

export function useUpdateNeedStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, volunteer_id, resolution_proof, resolution_notes }) => {
      // action = 'resolve' or 'assign'
      const path = action === 'assign' ? apiPaths.needAssign(id) : apiPaths.needResolve(id);
      const body = action === 'assign' 
        ? { volunteer_id } 
        : { resolution_proof, resolution_notes };
      return apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }, getToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
    },
    onError: (error) => {
      // Handle proof requirement error
      if (error.status === 403 && error.message?.includes('proof')) {
        throw new Error('Resolution requires photo/video proof of fulfillment. Please upload proof and try again.');
      }
      throw error;
    }
  });
}

export function useDisastersList() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['disasters', 'list'],
    queryFn: () => apiRequest(apiPaths.disasters, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useCreateDisaster() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiPaths.disasters, { method: 'POST', body: JSON.stringify(data) }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasters'] });
    },
  });
}

export function useActivateDisaster() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiRequest(apiPaths.disasterActivate(id), { method: 'POST' }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasters'] });
    },
  });
}

export function useResolveDisaster() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiRequest(apiPaths.disasterResolve(id), { method: 'POST' }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasters'] });
    },
    onError: (error) => {
      // Handle new validation errors from backend
      if (error.status === 400 && error.details?.active_tasks !== undefined) {
        throw new Error(
          `Cannot resolve disaster with active items: ${error.details.active_tasks} tasks, ${error.details.active_sos} SOS alerts`
        );
      }
      if (error.status === 403) {
        throw new Error('Only administrators or coordinators can resolve disasters');
      }
      throw error;
    }
  });
}

export function useDisasterTasks(disasterId) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['disasters', disasterId, 'tasks'],
    queryFn: () => apiRequest(apiPaths.disasterTasks(disasterId), {}, getToken),
    enabled: isSignedIn === true && !!disasterId,
  });
}

export function useZonesList(disasterId) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['zones', 'list', disasterId],
    queryFn: () => apiRequest(apiPaths.zones + (disasterId ? `?disaster_id=${disasterId}` : ''), {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useResourcesList() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['resources', 'list'],
    queryFn: () => apiRequest(apiPaths.resources, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useMissingList() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['missing', 'list'],
    queryFn: () => apiRequest(apiPaths.missing, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useMarkFound() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiRequest(apiPaths.markFound(id), { method: 'PATCH' }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missing'] });
    },
  });
}

// ─── Volunteer Assignments ──────────────────────────────────────────

export function useMyAssignments() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => apiRequest(apiPaths.myAssignments, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useRespondAssignment() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      apiRequest(apiPaths.respondAssignment(id), {
        method: 'POST', body: JSON.stringify({ status }),
      }, getToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-assignments'] }),
  });
}

export function useServerStats() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['server', 'stats'],
    queryFn: () => apiRequest(apiPaths.serverStats, {}, getToken),
    enabled: isSignedIn === true,
    refetchInterval: 5000,
    staleTime: 4000,
    retry: 1,
  });
}

export function useUsersList() {
  const { getToken, isSignedIn } = useAuth();
  // Using users list instead of volunteers. Volunteers can be filtered on the frontend.
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => apiRequest(apiPaths.users, {}, getToken),
    enabled: isSignedIn === true,
  });
}

export function useUpdateUserRole() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, role }) =>
      apiRequest(apiPaths.userRole(uid), { method: 'PUT', body: JSON.stringify({ role }) }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCreateTask() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiPaths.createTask, { method: 'POST', body: JSON.stringify(data) }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
