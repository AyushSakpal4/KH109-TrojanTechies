const trimTrailingSlash = (value) => value.replace(/\/$/, '');

export function getApiBaseUrl() {
  const envBase = (import.meta.env.VITE_API_URL || '').trim();
  if (envBase) {
    return trimTrailingSlash(envBase);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname, port } = window.location;
  const isViteDevServer = port === '5173' || port === '5174';

  // In local dev, default directly to backend port so sockets/API don't depend on Vite proxy.
  if (isViteDevServer) {
    const scheme = protocol === 'https:' ? 'https:' : 'http:';
    return `${scheme}//${hostname}:3000`;
  }

  // Empty means same-origin deployment.
  return '';
}

export function getSocketBaseUrl() {
  return getApiBaseUrl();
}

export function getDefaultSocketOptions(overrides = {}) {
  return {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    timeout: 10000,
    ...overrides,
  };
}
