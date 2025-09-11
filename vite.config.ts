import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { splitVendorChunkPlugin } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX for production
      jsxRuntime: 'automatic'
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths(),
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
  ],
  // Performance optimizations for mobile
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
          'chart-vendor': ['recharts'],
          'state-vendor': ['zustand'],
          // Utility libraries
          'utils': ['zod']
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Optimize for mobile devices
    target: ['es2020', 'chrome80', 'safari13'],
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'recharts',
      'zustand'
    ],
    // Force pre-bundling of these dependencies
    force: true
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
