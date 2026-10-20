import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dirname, '..');

/** The client and the admin each hold the helper that turns the code of an error into the text of their catalog, because no package of the workspace may depend on Apollo Client and i18next for both, so the two copies must not drift */
describe('the error-message helper', () => {
  it('is the same file in the client and in the admin', () => {
    const read = (app: string): string =>
      readFileSync(join(repoRoot, 'packages', app, 'src', 'lib', 'error-message.ts'), 'utf8');

    expect(read('admin')).toBe(read('client'));
  });
});
