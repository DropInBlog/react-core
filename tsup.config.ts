import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react/jsx-runtime'],
    banner: {
      js: '"use client";',
    },
    define: { __DIB_PACKAGE_VERSION__: JSON.stringify(pkg.version) },
  },
  {
    entry: ['src/server.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react/jsx-runtime'],
    define: { __DIB_PACKAGE_VERSION__: JSON.stringify(pkg.version) },
  },
]);
