import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// BASE_PATH lets the same build run at a domain root ("/") or in a subfolder ("/preview/").
// SITE_URL is only used for the canonical tag and Open Graph URLs.
const base = process.env.BASE_PATH || '/';
const site = process.env.SITE_URL || 'https://bergenarea.org';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react()],
  devToolbar: { enabled: false },
});
