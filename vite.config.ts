import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt', ne 'autoUpdate': aplikacija se ne sme sama zameniti usred
      // posla na gradilištu — nova verzija se javi, majstor odluči kad.
      registerType: 'prompt',
      includeAssets: ['ikona.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Krojač tabli',
        short_name: 'Krojač',
        description: 'Krojne liste i raspored rezova po tablama',
        lang: 'sr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0A0A0A',
        theme_color: '#0A0A0A',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/ikona-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/ikona-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/ikona-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Sve u keš: 3D, PDF i fontovi moraju da rade i bez mreže.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // jsPDF ove uvozi dinamički samo za doc.html() i SVG, što ne koristimo —
        // provereno u browseru da se nikad ne traže. Bez njih je instalacija
        // lakša za 389 KB.
        globIgnores: [
          '**/html2canvas.esm-*.js',
          '**/purify.es-*.js',
          '**/index.es-*.js',
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: { host: true, port: 5173 },
});
