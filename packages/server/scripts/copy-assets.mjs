import { cpSync, globSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

// tsc emits JavaScript only, so the Handlebars templates are copied next to the compiled code that reads them.
for (const file of globSync('src/**/*.hbs')) {
  const target = join('dist', relative('src', file));
  mkdirSync(dirname(target), { recursive: true });
  cpSync(file, target);
}
