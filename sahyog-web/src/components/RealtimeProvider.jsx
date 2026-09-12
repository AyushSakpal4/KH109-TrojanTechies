import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

const RealtimeContext = createContext(null);

export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [toasts, setToasts] = useState([]);
    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const newSocket = io(socketUrl, {
            path: '/socket.io',
        });

        newSocket.on('connect', () => {
            console.log('Realtime System: Connected to backend socket');
        });

        newSocket.on('new_sos_alert', (data) => {
            console.log('Realtime System: EMERGENCY ALERT RECEIVED', data);

            // Add a new toast with an ID and timestamp
            const id = `toast-${Date.now()}-${data.id}`;
            const newToast = {
                id,
                alert: data,
                timestamp: new Date(),
            };

            setToasts(prev => [...prev, newToast]);

            // Auto-remove after 12 seconds
            setTimeout(() => {
                removeToast(id);
            }, 12000);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isLoaded, isSignedIn]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <RealtimeContext.Provider value={{ socket, toasts, removeToast }}>
            {children}
            {/* Global SOS Overlay */}
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '400px',
                width: '100%'
            }}>
                {toasts.map(toast => (
                    <EmergencyToast
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </RealtimeContext.Provider>
    );
}

function EmergencyToast({ toast, onClose }) {
    const { alert } = toast;
    const navigate = useNavigate();

    const handleToastClick = () => {
        const lat = alert.lat || (alert.location?.coordinates ? alert.location.coordinates[1] : null);
        const lng = alert.lng || (alert.location?.coordinates ? alert.location.coordinates[0] : null);
        if (lat && lng) {
            navigate(`/map?lat=${lat}&lng=${lng}&t=${Date.now()}`);
        } else {
            navigate('/map');
        }
        onClose();
    };

    return (
        <div
            onClick={handleToastClick}
            style={{
                background: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.3), 0 8px 10px -6px rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                animation: 'toastIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
            }}
            title="Click to view & focus emergency on Live Map"
        >
            {/* Pulsing background glow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
                animation: 'pulse 2s infinite',
                pointerEvents: 'none'
            }} />

            <div style={{
                width: '48px',
                height: '48px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <span className="material-symbols-outlined" style={{
                    color: '#ef4444',
                    fontSize: '28px',
                    fontVariationSettings: "'FILL' 1"
                }}>emergency</span>
            </div>

            <div style={{ flex: 1, zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.95 }}>
                        Emergency SOS · Click to Map
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex' }}
                        title="Dismiss notification"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                </div>
                <h4 style={{ margin: '0', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {alert.reporter_name || 'Anonymous User'}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                    {alert.type || 'Emergency Distress'} {alert.reporter_phone ? `· ${alert.reporter_phone}` : ''}
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes toastIn {
                    from { transform: translateX(100%) scale(0.9); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes pulse {
                    0% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                    100% { opacity: 0.3; transform: scale(1); }
                }
            `}} />
        </div>
    );
}
