import { join } from 'node:path';
import { checkPackage } from './i18n-catalog.js';

const repoRoot = join(import.meta.dirname, '..');

/** The keys whose Czech and Slovak text is spelled like the English one, because the word is the same in all three languages */
const SPELLED_THE_SAME: Record<string, ReadonlySet<string>> = {
  client: new Set(['landing.features.graphql.title']),
  admin: new Set(['fields.role']),
};

describe.each(Object.keys(SPELLED_THE_SAME))('the catalogs of packages/%s', (name) => {
  it('hold exactly the keys that its t() calls use, in en, cs and sk, with real translations', () => {
    expect(checkPackage(join(repoRoot, 'packages', name), SPELLED_THE_SAME[name])).toEqual([]);
  });
});
