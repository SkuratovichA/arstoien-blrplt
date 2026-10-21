import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Catalog, PackageFacts } from './i18n-catalog.js';
import { checkCatalogs, findCalls, flattenCatalog, sourceFiles } from './i18n-catalog.js';

const catalog = (entries: Record<string, string>): Catalog => new Map(Object.entries(entries));

/** A package whose three catalogs agree with its code; each test spoils one thing */
const consistent = (): PackageFacts => ({
  calls: [
    { key: 'auth.title', file: 'src/login.tsx' },
    { key: 'auth.welcome', file: 'src/login.tsx' },
  ],
  dynamicCalls: [],
  catalogs: {
    en: catalog({ 'auth.title': 'Login', 'auth.welcome': 'Welcome, {{name}}' }),
    cs: catalog({ 'auth.title': 'Přihlášení', 'auth.welcome': 'Vítejte, {{name}}' }),
    sk: catalog({ 'auth.title': 'Prihlásenie', 'auth.welcome': 'Vitajte, {{name}}' }),
  },
});

describe('flattenCatalog', () => {
  it('turns nested objects into dotted keys, in the order of the file', () => {
    const flat = flattenCatalog({ a: { b: 'x', c: { d: 'y' } }, e: 'z' });

    expect([...flat]).toEqual([
      ['a.b', 'x'],
      ['a.c.d', 'y'],
      ['e', 'z'],
    ]);
  });

  it.each([
    ['a number', { a: { b: 1 } }, 'a.b'],
    ['a list', { a: ['x'] }, 'a'],
    ['null', { a: null }, 'a'],
  ])('refuses %s in place of a text', (_name, tree, key) => {
    expect(() => flattenCatalog(tree)).toThrow(key);
  });
});

describe('findCalls', () => {
  it('reads the key of every call whose first argument is a string literal', () => {
    const source = [
      "const a = t('one.a');",
      'const b = t("two.b");',
      'const c = t(`three.c`);',
      "const d = i18n.t('four.d');",
      "const e = t('five.e', { name });",
      'const f = t(',
      "  'six.f'",
      ');',
    ].join('\n');

    expect(findCalls(source)).toEqual({
      keys: ['one.a', 'two.b', 'three.c', 'four.d', 'five.e', 'six.f'],
      dynamic: [],
    });
  });

  it('does not take other functions that end in t for a translation call', () => {
    const source = "print('x'); Math.sqrt(4); const got = $t('y'); format('z');";

    expect(findCalls(source)).toEqual({ keys: [], dynamic: [] });
  });

  it('does not read comments, but still reads a call after a string that holds slashes', () => {
    const source = [
      "// t('in.line')",
      "/* t('in.block') */",
      "const url = 'http://example.com'; t('after.url');",
    ].join('\n');

    expect(findCalls(source)).toEqual({ keys: ['after.url'], dynamic: [] });
  });

  it('lists a call whose key is not a plain string literal', () => {
    const calls = [
      't(item.name);',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the text is test input: a template literal with an interpolation
      't(`group.${name}`);',
      "t('group.' + name);",
      't(key, { count });',
    ];

    const { keys, dynamic } = findCalls(calls.join('\n'));

    expect(keys).toEqual([]);
    expect(dynamic).toEqual(calls);
  });
});

describe('checkCatalogs', () => {
  it('accepts catalogs that agree with the code', () => {
    expect(checkCatalogs(consistent())).toEqual([]);
  });

  it('reports a key that the code uses and a catalog lacks', () => {
    const facts = consistent();
    facts.catalogs.cs = catalog({ 'auth.welcome': 'Vítejte, {{name}}' });

    expect(checkCatalogs(facts)).toEqual([
      'cs: the key auth.title, used in src/login.tsx, is missing',
    ]);
  });

  it('reports a key that one catalog holds and no code uses', () => {
    const facts = consistent();
    facts.catalogs.sk.set('auth.old', 'Staré');

    expect(checkCatalogs(facts)).toEqual(['sk: the key auth.old is not used by any t() call']);
  });

  it('reports every catalog that lacks a key which only one catalog holds', () => {
    const facts = consistent();
    facts.calls.push({ key: 'auth.extra', file: 'src/extra.tsx' });
    facts.catalogs.cs.set('auth.extra', 'Navíc');

    expect(checkCatalogs(facts)).toEqual([
      'en: the key auth.extra, used in src/extra.tsx, is missing',
      'sk: the key auth.extra, used in src/extra.tsx, is missing',
    ]);
  });

  it('reports a call whose key is not a string literal', () => {
    const facts = consistent();
    facts.dynamicCalls.push({ text: 't(item.name);', file: 'src/menu.tsx' });

    expect(checkCatalogs(facts)).toEqual([
      'src/menu.tsx: t(item.name); does not name its key with a string literal',
    ]);
  });

  it('reports a Czech or Slovak text that is the English text, unless the key is listed', () => {
    const facts = consistent();
    facts.catalogs.cs.set('auth.title', 'Login');
    facts.catalogs.sk.set('auth.title', 'Login');

    expect(checkCatalogs(facts)).toEqual([
      'cs: the text of auth.title is the English text',
      'sk: the text of auth.title is the English text',
    ]);
    expect(checkCatalogs({ ...facts, sameAsEnglish: new Set(['auth.title']) })).toEqual([]);
  });

  it('reports a text that interpolates other names than the English text does', () => {
    const facts = consistent();
    facts.catalogs.cs.set('auth.welcome', 'Vítejte, {{nmae}}');

    expect(checkCatalogs(facts)).toEqual([
      'cs: the text of auth.welcome interpolates nmae where the English text interpolates name',
    ]);
  });

  it('reports an empty text', () => {
    const facts = consistent();
    facts.catalogs.sk.set('auth.title', ' ');

    expect(checkCatalogs(facts)).toEqual(['sk: the text of auth.title is empty']);
  });
});

describe('sourceFiles', () => {
  it('lists the sources, and leaves out tests, generated files, catalogs and declarations', () => {
    const root = mkdtempSync(join(tmpdir(), 'i18n-sources-'));
    try {
      const files = [
        'main.tsx',
        'lib/format.ts',
        'lib/format.test.ts',
        'routes/login.tsx',
        'routes/login.spec.tsx',
        'routeTree.gen.ts',
        'vite-env.d.ts',
        'gql/graphql.ts',
        'locales/en/translation.json',
        'test/setup.ts',
      ];
      for (const file of files) {
        mkdirSync(join(root, file, '..'), { recursive: true });
        writeFileSync(join(root, file), '');
      }

      expect(sourceFiles(root).map((path) => path.slice(root.length + 1))).toEqual([
        'lib/format.ts',
        'main.tsx',
        'routes/login.tsx',
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
