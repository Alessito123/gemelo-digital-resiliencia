import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot),
      },
    },
    server: {
      host:'127.0.0.1',
      port:Number(process.env.GEMELO_WEB_PORT || '5178'),
      strictPort:true,
      proxy:{'/api':{target:`http://127.0.0.1:${process.env.GEMELO_API_PORT || '8010'}`,changeOrigin:false},
             '/api-docs':{target:`http://127.0.0.1:${process.env.GEMELO_API_PORT || '8010'}`,rewrite:()=>'/docs'},
             '/docs':{target:`http://127.0.0.1:${process.env.GEMELO_API_PORT || '8010'}`},
             '/openapi.json':{target:`http://127.0.0.1:${process.env.GEMELO_API_PORT || '8010'}`}},
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching can be disabled to prevent flickering during automated edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
