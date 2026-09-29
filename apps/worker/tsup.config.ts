import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/replay.ts', 'src/demo/server.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  // Workspace packages ship TypeScript sources; bundle them into the output.
  noExternal: [/^@eleicoes\//],
  clean: true,
});
