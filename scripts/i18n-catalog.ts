/**
 * Keeps the translation catalogs of a package in step with the code that reads them.
 *
 * A package holds one catalog per language, src/locales/<language>/translation.json, nested by feature (auth.login.title).
 * Its sources ask for a text with t('<key>'), and the key is always a string literal.
 * checkPackage lists every way in which the sources and the three catalogs disagree: a key that a catalog lacks, a key that no t() call uses, a t() call whose key is not a literal, an empty text, a Czech or Slovak text that is the English one, and an interpolation (`{{name}}`) that a translation renames.
 * Every catalog must hold exactly the keys that the code uses, so the catalogs cannot differ from each other in their keys.
 * Plural forms (title_one, title_other) and <Trans i18nKey> are not modelled, because the packages use neither.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export const LOCALES = ['en', 'cs', 'sk'] as const;

export type Locale = (typeof LOCALES)[number];

/** The text of each dotted key of one catalog, in the order of the file */
export type Catalog = Map<string, string>;

export interface PackageFacts {
  /** Every t() call with a literal key, and the file it stands in */
  calls: { key: string; file: string }[];
  /** Every t() call whose key is not a literal, as it is written, and the file it stands in */
  dynamicCalls: { text: string; file: string }[];
  catalogs: Record<Locale, Catalog>;
  /** The keys whose Czech and Slovak text may equal the English one, for a word that is spelled the same in all three languages */
  sameAsEnglish?: ReadonlySet<string>;
}

const NOT_SCANNED = new Set(['node_modules', 'gql', 'locales', 'test']);
const SOURCE = /\.tsx?$/;
const NOT_SOURCE = /\.(test|spec|gen|d)\.tsx?$/;

// A string literal comes first in the alternation, so that the // in 'http://x' is kept and only a comment is dropped
const STRING_OR_COMMENT =
  /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
const CALL = /(?<![\w$])t\(/g;
const LITERAL_CALL = /t\(\s*(['"`])((?:(?!\1)[^\\\n$])*)\1\s*[,)]/y;
const INTERPOLATION = /\{\{\s*([\w.]+)/g;

/** The dotted key of every text in a parsed catalog; anything but texts and objects of texts is an error */
export function flattenCatalog(tree: unknown, prefix = ''): Catalog {
  if (typeof tree !== 'object' || tree === null || Array.isArray(tree)) {
    throw new Error(`${prefix || 'the catalog'} must be an object of texts and objects`);
  }
  const catalog: Catalog = new Map();
  for (const [name, value] of Object.entries(tree)) {
    const key = prefix === '' ? name : `${prefix}.${name}`;
    if (typeof value === 'string') {
      catalog.set(key, value);
    } else {
      for (const [nested, text] of flattenCatalog(value, key)) {
        catalog.set(nested, text);
      }
    }
  }
  return catalog;
}

/** The t() calls of one source file: the key of each call that has a literal key, and the text of each call that has not */
export function findCalls(source: string): { keys: string[]; dynamic: string[] } {
  const code = source.replace(STRING_OR_COMMENT, '$1');
  const keys: string[] = [];
  const dynamic: string[] = [];
  for (const { index } of code.matchAll(CALL)) {
    LITERAL_CALL.lastIndex = index;
    const literal = LITERAL_CALL.exec(code);
    if (literal) {
      keys.push(literal[2]);
    } else {
      dynamic.push(code.slice(index).split('\n', 1)[0].trim());
    }
  }
  return { keys, dynamic };
}

const interpolations = (text: string): string[] => [
  ...new Set([...text.matchAll(INTERPOLATION)].map((match) => match[1])),
];

const names = (list: string[]): string => (list.length === 0 ? 'nothing' : list.join(', '));

export function checkCatalogs(facts: PackageFacts): string[] {
  const problems: string[] = [];
  const usedIn = new Map<string, Set<string>>();
  for (const { key, file } of facts.calls) {
    usedIn.set(key, (usedIn.get(key) ?? new Set()).add(file));
  }
  for (const { text, file } of facts.dynamicCalls) {
    problems.push(`${file}: ${text} does not name its key with a string literal`);
  }

  for (const locale of LOCALES) {
    const catalog = facts.catalogs[locale];
    for (const [key, files] of usedIn) {
      if (!catalog.has(key)) {
        problems.push(`${locale}: the key ${key}, used in ${[...files].join(', ')}, is missing`);
      }
    }
    for (const [key, text] of catalog) {
      if (!usedIn.has(key)) {
        problems.push(`${locale}: the key ${key} is not used by any t() call`);
      }
      if (text.trim() === '') {
        problems.push(`${locale}: the text of ${key} is empty`);
      }
    }
  }

  for (const locale of ['cs', 'sk'] as const) {
    for (const [key, text] of facts.catalogs[locale]) {
      const english = facts.catalogs.en.get(key);
      if (english === undefined) {
        continue;
      }
      if (text === english && !facts.sameAsEnglish?.has(key)) {
        problems.push(`${locale}: the text of ${key} is the English text`);
      }
      const [own, original] = [interpolations(text).sort(), interpolations(english).sort()];
      if (own.join() !== original.join()) {
        problems.push(
          `${locale}: the text of ${key} interpolates ${names(own)} where the English text interpolates ${names(original)}`
        );
      }
    }
  }
  return problems;
}

/** The source files of a package that can hold t() calls: not the tests, the generated code, the declarations and the catalogs */
export function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return NOT_SCANNED.has(entry.name) ? [] : sourceFiles(path);
      }
      return SOURCE.test(entry.name) && !NOT_SOURCE.test(entry.name) ? [path] : [];
    })
    .sort();
}

/** Every problem between the sources of the package in packageDir and its three catalogs; an empty list means they agree */
export function checkPackage(packageDir: string, sameAsEnglish?: ReadonlySet<string>): string[] {
  const calls: PackageFacts['calls'] = [];
  const dynamicCalls: PackageFacts['dynamicCalls'] = [];
  for (const path of sourceFiles(join(packageDir, 'src'))) {
    const file = relative(packageDir, path);
    const found = findCalls(readFileSync(path, 'utf8'));
    calls.push(...found.keys.map((key) => ({ key, file })));
    dynamicCalls.push(...found.dynamic.map((text) => ({ text, file })));
  }

  const read = (locale: Locale): Catalog =>
    flattenCatalog(
      JSON.parse(
        readFileSync(join(packageDir, 'src', 'locales', locale, 'translation.json'), 'utf8')
      )
    );
  return checkCatalogs({
    calls,
    dynamicCalls,
    catalogs: { en: read('en'), cs: read('cs'), sk: read('sk') },
    sameAsEnglish,
  });
}
