import { useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';

export function useCommandCenterRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!enabled || !isLoaded || !isSignedIn) return;

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['zones', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'escalated'] });
      queryClient.invalidateQueries({ queryKey: ['volunteers', 'locations'] });
      queryClient.invalidateQueries({ queryKey: ['needs', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['zones', 'geojson'] });
      queryClient.invalidateQueries({ queryKey: ['coordinators', 'metrics'] });
    };

    socket.on('new_sos_alert', invalidate);
    socket.on('sos_resolved', invalidate);
    socket.on('task_escalated', invalidate);
    socket.on('task_updated', invalidate);
    socket.on('need_updated', invalidate);
    socket.on('zone_updated', invalidate);
    socket.on('volunteer_location_update', () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers', 'locations'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, isLoaded, isSignedIn, queryClient]);
}
