// @ts-check

// Load .env file before any other imports
// Using dotenv/config for automatic .env loading on import
import 'dotenv/config';

import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import node from '@astrojs/node';

// Validate environment variables at startup
// This will throw and prevent the app from starting if required env vars are missing
import './src/lib/env.ts';

// https://astro.build/config
export default defineConfig({
  integrations: [preact()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })
});