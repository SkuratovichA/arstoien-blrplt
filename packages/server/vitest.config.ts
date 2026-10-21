import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 compiles the TypeScript with Oxc, which emits the constructor parameter types that Nest injects by, so no SWC plugin is needed; the option is explicit so the specs go red if the metadata ever disappears.
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    unstubEnvs: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/main.ts', 'src/scripts/**'],
      reporter: ['text', 'lcov'],
    },
  },
});
