import { defineConfig } from 'vite';
import dcTemplates from './build/vite-plugin-dc.js';

// base './' makes the built site work from any path: a GitHub Pages project site (user.github.io/repo/),
// a custom domain, or a plain folder. The site uses #/hash routes, so no server rewrite rules are needed.
export default defineConfig({
  base: './',
  plugins: [dcTemplates()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0, // keep every image as its own cacheable file
    chunkSizeWarningLimit: 700
  }
});
