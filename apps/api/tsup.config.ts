import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  noExternal: [/^@eleicoes\//],
  clean: true,
});
