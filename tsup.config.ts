import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react/jsx-runtime'],
    banner: {
      js: '"use client";',
    },
  },
  {
    entry: ['src/server.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react/jsx-runtime'],
  },
]);
