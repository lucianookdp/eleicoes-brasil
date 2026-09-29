import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  // Everything bundled: the container needs no node_modules.
  noExternal: [/.*/],
  external: ['pino-pretty'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  clean: true,
});
