import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/replay.ts', 'src/demo/server.ts', 'src/history/import.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  // Workspace packages ship TypeScript sources; bundle them into the output.
  // Everything bundled: the container needs no node_modules.
  noExternal: [/.*/],
  external: ['pino-pretty'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  clean: true,
});
