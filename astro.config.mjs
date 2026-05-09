import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kodi-blog.pages.dev',
  trailingSlash: 'never',
  build: {
    assets: '_assets',
  },
  experimental: {
    contentLayer: true,
  },
});
