import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/sql.js/dist/sql-wasm.wasm',
          dest: 'sqljs'
        },
        {
          src: 'content',
          dest: ''
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@content': path.resolve(__dirname, './src/content'),
      '@types': path.resolve(__dirname, './src/types'),
      'components': path.resolve(__dirname, './src/shared/components'),
      'util': path.resolve(__dirname, './src/shared/utils'),
      'edu': path.resolve(__dirname, './src/features/content'),
      'eduComponents': path.resolve(__dirname, './src/features/learning'),
      'content': path.resolve(__dirname, './src/content'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          sql: ['sql.js'],
          editor: ['@codemirror/lang-sql', '@uiw/react-codemirror'],
        },
      },
    },
  },
});