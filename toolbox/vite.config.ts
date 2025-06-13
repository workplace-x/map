import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3001,
    strictPort: true, // Force port 3001, fail if occupied
    host: true, // Allow external connections
    watch: {
      // Use polling to prevent file-watching issues in some environments.
      usePolling: true,
      interval: 100, // Check for file changes every 100ms
    },
    proxy: {
      // Forward all /api requests to the local API server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path - keep /api prefix
        rewrite: undefined,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url);
          });
        }
      },
      // Forward /health and other API endpoints
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/debug-db': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // fix loading all icon chunks in dev mode
      // https://github.com/tabler/tabler-icons/issues/1233
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['@tanstack/router-devtools'],
  },
  define: {
    // Make environment variables available
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
