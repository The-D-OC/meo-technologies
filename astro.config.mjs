// @ts-check
import { defineConfig } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

// Replace with your production domain before deploying (also update public/robots.txt).
export default defineConfig({
  site: 'https://meotechnologies.com',
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        item.changefreq = path === '/' ? ChangeFreqEnum.WEEKLY : ChangeFreqEnum.MONTHLY;
        item.priority = path === '/' ? 1.0 : path.startsWith('/contact') ? 0.8 : 0.5;
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
});
