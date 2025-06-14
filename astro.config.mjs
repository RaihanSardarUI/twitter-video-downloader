// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(), 
    react({
      experimentalReactChildren: false
    })
  ],
  output: 'hybrid',
  adapter: cloudflare(),
  vite: {
    define: {
      global: 'globalThis',
    },
    ssr: {
      external: ['node:buffer', 'node:process', 'node:util']
    }
  }
});
