// @ts-check
import { defineConfig } from 'astro/config';

// Replace with your production domain before deploying.
export default defineConfig({
  site: 'https://meotechnologies.com',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
