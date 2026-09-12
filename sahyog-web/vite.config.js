import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';

const isIgnoredError = (err) => {
  if (!err) return true;
  const code = err.code || (err.message && err.message.includes('ECONNRESET') ? 'ECONNRESET' : null);
  return ['ECONNRESET', 'EPIPE', 'ECONNREFUSED', 'ETIMEDOUT', 'ERR_STREAM_PREMATURE_CLOSE'].includes(code);
};

export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (isIgnoredError(err)) {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Backend server starting up, retrying...' }));
              }
              return;
            }
            console.error('[API proxy error]', err.message);
          });
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (isIgnoredError(err)) return;
            console.error('[Socket proxy error]', err.message);
          });

          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            proxyReq.on('error', (err) => {
              if (isIgnoredError(err)) return;
              console.error('[WS proxyReq error]', err.message);
            });
            socket.on('error', (err) => {
              if (isIgnoredError(err)) return;
              console.error('[WS client socket error]', err.message);
            });
          });

          proxy.on('open', (proxySocket) => {
            proxySocket.on('error', (err) => {
              if (isIgnoredError(err)) return;
              console.error('[WS backend socket error]', err.message);
            });
          });

          proxy.on('proxySocket', (proxySocket) => {
            proxySocket.on('error', (err) => {
              if (isIgnoredError(err)) return;
              console.error('[WS proxySocket error]', err.message);
            });
          });
        },
      },
    },
  },
});
