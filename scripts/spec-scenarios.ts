/**
 * Ties the scenarios of the OpenSpec specs to the tests that prove them.
 *
 * A scenario is a `#### Scenario: <title>` heading in openspec/specs/<capability>/spec.md or in the delta spec of an active change, openspec/changes/<id>/specs/<capability>/spec.md. A test proves it when its title is `Scenario: <title>`.
 *
 *   check                    exit 1 for a scenario without a running test, a test that names no scenario, or a title used twice
 *   generate <capability>    append an it.todo skeleton for every scenario of the capability that no test names
 *   generate --change <id>   the same for every capability that an active change touches
 *
 * An it.todo or it.skip counts as not covered, so a fresh skeleton keeps check red until a real test replaces it. The file runs on the TypeScript support of Node itself, so it needs no build step and no loader, and the tsconfig of this folder allows only syntax that Node can strip.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

export const SCENARIO_PREFIX = 'Scenario:';

const DEFAULT_PACKAGE = 'server';
const STEP_KEYWORDS = ['GIVEN', 'WHEN', 'THEN', 'AND', 'BUT'];
const NOT_SCANNED = new Set(['node_modules', 'dist', 'build', 'coverage', 'generated', '.git']);

export interface Scenario {
  title: string;
  capability: string;
  /** Path of the spec file, relative to the repository root */
  file: string;
  /** 1-based line of the heading */
  line: number;
  /** The id of the active change whose delta spec holds the scenario, null for openspec/specs */
  change: string | null;
  /** The WHEN, THEN and AND lines of the scenario, without the list and bold markers */
  steps: string[];
}

export type TestKind = 'test' | 'todo' | 'skip';

export interface ScenarioTest {
  /** The scenario title, without the `Scenario:` prefix */
  title: string;
  kind: TestKind;
  /** Path of the test file, relative to the repository root */
  file: string;
  line: number;
}

export type Problem =
  | { kind: 'uncovered'; scenario: Scenario; pending: ScenarioTest[] }
  | { kind: 'orphan'; test: ScenarioTest }
  | { kind: 'duplicate-scenario'; title: string; scenarios: Scenario[] }
  | { kind: 'duplicate-test'; title: string; tests: ScenarioTest[] };

export interface CapabilityRow {
  scenario: Scenario;
  tests: ScenarioTest[];
  status: 'covered' | 'todo' | 'missing';
}

export interface Report {
  capabilities: Map<string, CapabilityRow[]>;
  problems: Problem[];
}

/** Titles are compared as canonically equivalent text, so a letter typed as a base character plus a combining mark matches the single code point. */
const normalizeTitle = (text: string): string => text.normalize('NFC').trim();

const stripListMarkers = (text: string): string =>
  text
    .replace(/^\s*[-*+]\s+/, '')
    .replaceAll('**', '')
    .trim();

/**
 * The scenarios of one spec.md. Headings inside code fences are ignored, and so is everything under `## REMOVED Requirements`, because a delta lists the requirements it deletes there.
 */
export function parseScenarios(
  markdown: string,
  origin: { file: string; capability: string; change: string | null }
): Scenario[] {
  const scenarios: Scenario[] = [];
  let fence: string | null = null;
  let removed = false;
  let current: Scenario | null = null;

  for (const [index, text] of markdown.split(/\r?\n/).entries()) {
    const marker = /^\s*(```|~~~)/.exec(text)?.[1];
    if (marker !== undefined) {
      if (fence === null) {
        fence = marker;
      } else if (fence === marker) {
        fence = null;
      }
      continue;
    }
    if (fence !== null) {
      continue;
    }

    const heading = /^(#{1,6})\s+(.*?)\s*$/.exec(text);
    if (heading === null) {
      if (current !== null) {
        const step = stripListMarkers(text);
        if (STEP_KEYWORDS.some((keyword) => step.startsWith(`${keyword} `))) {
          current.steps.push(step);
        }
      }
      continue;
    }

    const level = heading[1].length;
    const content = heading[2];
    current = null;
    if (level <= 2) {
      removed = level === 2 && /^REMOVED\b/i.test(content);
    }
    if (level === 4 && !removed && content.startsWith(SCENARIO_PREFIX)) {
      const title = normalizeTitle(content.slice(SCENARIO_PREFIX.length));
      if (title !== '') {
        current = { title, ...origin, line: index + 1, steps: [] };
        scenarios.push(current);
      }
    }
  }

  return scenarios;
}

const SIMPLE_ESCAPES: Readonly<Record<string, string>> = {
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  v: '\v',
  '0': '\0',
};

/** The text that the escape sequence at `at` (a backslash) stands for, and the position after it. */
function readEscape(source: string, at: number): { text: string; end: number } {
  const kind = source[at + 1] ?? '';

  if (kind === 'u' && source[at + 2] === '{') {
    const close = source.indexOf('}', at + 3);
    const code = close < 0 ? Number.NaN : Number.parseInt(source.slice(at + 3, close), 16);
    if (Number.isNaN(code) || code > 0x10ffff) {
      return { text: kind, end: at + 2 };
    }
    return { text: String.fromCodePoint(code), end: close + 1 };
  }
  if (kind === 'u' || kind === 'x') {
    const length = kind === 'u' ? 4 : 2;
    const digits = source.slice(at + 2, at + 2 + length);
    if (digits.length !== length || !/^[0-9a-fA-F]+$/.test(digits)) {
      return { text: kind, end: at + 2 };
    }
    return { text: String.fromCharCode(Number.parseInt(digits, 16)), end: at + 2 + length };
  }
  if (kind === '\n') {
    return { text: '', end: at + 2 };
  }
  return { text: SIMPLE_ESCAPES[kind] ?? kind, end: at + 2 };
}

interface Literal {
  value: string;
  /** The position after the closing quote */
  end: number;
  /** False for a template literal that interpolates, whose value is known only at run time */
  plain: boolean;
}

/** The position after the `}` that closes a `${` whose body starts at `start`. */
function skipInterpolation(source: string, start: number): number {
  let depth = 1;
  let index = start;

  while (index < source.length) {
    const char = source[index];
    if (char === '"' || char === "'" || char === '`') {
      index = readLiteral(source, index)?.end ?? index + 1;
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return index;
}

/** Reads the string literal that starts at `start` (its opening quote). Null when a quoted string runs into a line break or the file ends first. */
function readLiteral(source: string, start: number): Literal | null {
  const quote = source[start];
  let value = '';
  let plain = true;
  let index = start + 1;

  while (index < source.length) {
    const char = source[index];
    if (char === quote) {
      return { value, end: index + 1, plain };
    }
    if (char === '\n' && quote !== '`') {
      return null;
    }
    if (quote === '`' && char === '$' && source[index + 1] === '{') {
      plain = false;
      index = skipInterpolation(source, index + 2);
    } else if (char === '\\') {
      const decoded = readEscape(source, index);
      value += decoded.text;
      index = decoded.end;
    } else {
      value += char;
      index += 1;
    }
  }
  return null;
}

const TEST_CALL =
  /(?:it|test)((?:\.(?:todo|skip|only|fails|concurrent|sequential))*)\s*\(\s*(?=['"`])/y;
const AFTER_TITLE = /\s*([,)])/y;
/** A suite that Vitest does not run, so none of the tests inside it does */
const SKIPPED_SUITE = /describe\.(?:skip|todo)\s*\(/y;
const EXPRESSION_TAIL = /[\p{L}\p{N}_$.]/u;

interface TestCall {
  kind: TestKind;
  title: string;
  end: number;
}

/** The call `it('title', ...)`, `test(...)`, `it.todo(...)` or `it.skip(...)` that starts at `at`, when its title is a literal without interpolation. */
function readTestCall(source: string, at: number): TestCall | null {
  TEST_CALL.lastIndex = at;
  const call = TEST_CALL.exec(source);
  if (call === null) {
    return null;
  }
  const literal = readLiteral(source, TEST_CALL.lastIndex);
  if (literal === null || !literal.plain) {
    return null;
  }
  AFTER_TITLE.lastIndex = literal.end;
  const afterTitle = AFTER_TITLE.exec(source);
  if (afterTitle === null) {
    return null;
  }
  const modifiers = call[1];
  // A call that closes right after the title has no function, and Vitest does not run it
  const kind: TestKind = modifiers.includes('.todo')
    ? 'todo'
    : modifiers.includes('.skip')
      ? 'skip'
      : afterTitle[1] === ')'
        ? 'todo'
        : 'test';
  return { kind, title: literal.value, end: literal.end };
}

/** The index after the comment or string literal that starts at `index`, or `index` itself when none starts there. */
function skipTrivia(source: string, index: number): number {
  const char = source[index];
  const next = source[index + 1];

  if (char === '/' && next === '/') {
    const end = source.indexOf('\n', index);
    return end < 0 ? source.length : end;
  }
  if (char === '/' && next === '*') {
    const end = source.indexOf('*/', index + 2);
    return end < 0 ? source.length : end + 2;
  }
  if (char === '"' || char === "'" || char === '`') {
    return readLiteral(source, index)?.end ?? index + 1;
  }
  return index;
}

/** The index after the parenthesis that closes the one at `open`, or the end of the source when it never closes. */
function findCallEnd(source: string, open: number): number {
  let depth = 0;
  let index = open;

  while (index < source.length) {
    const afterTrivia = skipTrivia(source, index);
    if (afterTrivia !== index) {
      index = afterTrivia;
      continue;
    }
    if (source[index] === '(') {
      depth += 1;
    } else if (source[index] === ')') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return source.length;
}

/**
 * The `Scenario: ...` titles of the it and test calls in a test file, read from the source text. Comments and strings are skipped, so a title in a comment or in a fixture string does not count, and a title is the decoded value of its literal: escapes and non-Latin letters come out as they were meant. A title that is built at run time cannot be read and is ignored.
 */
export function parseScenarioTests(source: string, file: string): ScenarioTest[] {
  const found: ScenarioTest[] = [];
  let index = 0;
  let skippedUntil = 0;

  while (index < source.length) {
    const char = source[index];
    const afterTrivia = skipTrivia(source, index);

    if (afterTrivia !== index) {
      index = afterTrivia;
    } else if (char === 'd' && !EXPRESSION_TAIL.test(source[index - 1] ?? '')) {
      SKIPPED_SUITE.lastIndex = index;
      if (SKIPPED_SUITE.test(source)) {
        skippedUntil = Math.max(skippedUntil, findCallEnd(source, SKIPPED_SUITE.lastIndex - 1));
        index = SKIPPED_SUITE.lastIndex;
      } else {
        index += 1;
      }
    } else if ((char === 'i' || char === 't') && !EXPRESSION_TAIL.test(source[index - 1] ?? '')) {
      const call = readTestCall(source, index);
      if (call === null) {
        index += 1;
        continue;
      }
      if (call.title.startsWith(SCENARIO_PREFIX)) {
        found.push({
          title: normalizeTitle(call.title.slice(SCENARIO_PREFIX.length)),
          kind: index < skippedUntil ? 'skip' : call.kind,
          file,
          line: source.slice(0, index).split('\n').length,
        });
      }
      index = call.end;
    } else {
      index += 1;
    }
  }

  return found;
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item));
    if (group === undefined) {
      groups.set(key(item), [item]);
    } else {
      group.push(item);
    }
  }
  return groups;
}

/** A title may be in the spec and again in the delta of one active change, because a MODIFIED requirement repeats its scenarios; any other repetition is two scenarios that one test title cannot tell apart. */
function isConflict(occurrences: readonly Scenario[]): boolean {
  const inSpecs = occurrences.filter((scenario) => scenario.change === null).length;
  const inChanges = groupBy(
    occurrences.filter((scenario) => scenario.change !== null),
    (scenario) => scenario.change ?? ''
  );
  return (
    inSpecs > 1 || inChanges.size > 1 || [...inChanges.values()].some((group) => group.length > 1)
  );
}

/** Compares scenarios with tests. A scenario is covered by a test that runs; an it.todo or it.skip leaves it uncovered. */
export function compareScenarios(
  scenarios: readonly Scenario[],
  tests: readonly ScenarioTest[]
): Report {
  const problems: Problem[] = [];
  const capabilities = new Map<string, CapabilityRow[]>();
  const scenariosByTitle = groupBy(scenarios, (scenario) => scenario.title);
  const testsByTitle = groupBy(tests, (test) => test.title);

  for (const [title, occurrences] of scenariosByTitle) {
    if (isConflict(occurrences)) {
      problems.push({ kind: 'duplicate-scenario', title, scenarios: occurrences });
    }
    const scenario = occurrences.find((item) => item.change === null) ?? occurrences[0];
    const named = testsByTitle.get(title) ?? [];
    const running = named.some((test) => test.kind === 'test');
    const status = running ? 'covered' : named.length > 0 ? 'todo' : 'missing';
    const rows = capabilities.get(scenario.capability) ?? [];
    rows.push({ scenario, tests: named, status });
    capabilities.set(scenario.capability, rows);
    if (!running) {
      problems.push({ kind: 'uncovered', scenario, pending: named });
    }
  }

  for (const [title, named] of testsByTitle) {
    if (!scenariosByTitle.has(title)) {
      problems.push(...named.map((test): Problem => ({ kind: 'orphan', test })));
    }
    if (named.length > 1) {
      problems.push({ kind: 'duplicate-test', title, tests: named });
    }
  }

  return { capabilities, problems };
}

const where = (item: { file: string; line: number }): string => `${item.file}:${item.line}`;

function describeProblem(problem: Problem): string {
  switch (problem.kind) {
    case 'uncovered': {
      const [pending] = problem.pending;
      const subject = `uncovered: "${problem.scenario.title}" (${where(problem.scenario)})`;
      return pending === undefined
        ? `${subject} has no test`
        : `${subject} has only ${pending.kind === 'todo' ? 'an it.todo' : 'an it.skip'} at ${where(pending)}`;
    }
    case 'orphan':
      return `orphan: ${where(problem.test)} names the scenario "${problem.test.title}", which no spec has`;
    case 'duplicate-scenario':
      return `duplicate scenario: "${problem.title}" is in ${problem.scenarios.map(where).join(' and ')}`;
    case 'duplicate-test':
      return `duplicate test: "${problem.title}" is the title of ${problem.tests.map(where).join(' and ')}`;
  }
}

/** One table per capability, then the problems, then the summary line. */
export function formatReport(report: Report): string[] {
  const lines: string[] = [];
  const total = [...report.capabilities.values()].reduce((sum, rows) => sum + rows.length, 0);
  const capabilities = [...report.capabilities].sort(([a], [b]) => a.localeCompare(b));

  for (const [capability, rows] of capabilities) {
    const covered = rows.filter((row) => row.status === 'covered').length;
    const width = Math.max(...rows.map((row) => row.scenario.title.length));
    lines.push(`${capability}: ${covered} of ${rows.length} scenarios covered`);
    for (const row of rows) {
      const origin = row.scenario.change === null ? '' : `  [change ${row.scenario.change}]`;
      const test = row.tests[0];
      lines.push(
        `  ${row.status.padEnd(7)}  ${row.scenario.title.padEnd(width)}  ${test === undefined ? '-' : where(test)}${origin}`
      );
    }
    lines.push('');
  }

  lines.push(...report.problems.map(describeProblem));
  lines.push(
    report.problems.length === 0
      ? `ok: ${total} scenarios, every one has a test`
      : `failed: ${report.problems.length} problems in ${total} scenarios`
  );
  return lines;
}

async function walk(
  directory: string,
  accept: (path: string) => boolean,
  skipped: ReadonlySet<string> = new Set()
): Promise<string[]> {
  if (!existsSync(directory)) {
    return [];
  }
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return skipped.has(entry.name) ? [] : walk(path, accept, skipped);
      }
      return accept(path) ? [path] : [];
    })
  );
  return nested.flat().sort();
}

const posixPath = (root: string, path: string): string => relative(root, path).split(sep).join('/');

/** Every scenario of openspec/specs and of the active changes, openspec/changes/<id>/specs. The finished changes sit one level lower, in openspec/changes/archive/<date-and-id>/, so archive itself has no specs folder and nothing of it is read. */
export async function loadScenarios(root: string): Promise<Scenario[]> {
  const isSpec = (path: string): boolean => path.endsWith(`${sep}spec.md`);
  const changesRoot = join(root, 'openspec', 'changes');
  const sources: { directory: string; change: string | null }[] = [
    { directory: join(root, 'openspec', 'specs'), change: null },
  ];

  if (existsSync(changesRoot)) {
    for (const entry of await readdir(changesRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        sources.push({ directory: join(changesRoot, entry.name, 'specs'), change: entry.name });
      }
    }
  }

  const loaded: Scenario[] = [];
  for (const { directory, change } of sources) {
    for (const path of await walk(directory, isSpec)) {
      const capability = posixPath(directory, path).split('/')[0];
      const markdown = await readFile(path, 'utf8');
      loaded.push(...parseScenarios(markdown, { file: posixPath(root, path), capability, change }));
    }
  }
  return loaded;
}

/** Every `Scenario: ...` test title in the spec and test files under packages/. */
export async function loadScenarioTests(root: string): Promise<ScenarioTest[]> {
  const isTestFile = (path: string): boolean => /\.(spec|test)\.[cm]?tsx?$/.test(path);
  const files = await walk(join(root, 'packages'), isTestFile, NOT_SCANNED);
  const tests = await Promise.all(
    files.map(async (path) =>
      parseScenarioTests(await readFile(path, 'utf8'), posixPath(root, path))
    )
  );
  return tests.flat();
}

/** A string literal in the quote style Biome writes: single quotes, unless the text holds more single than double quotes. */
export function quoteLiteral(text: string): string {
  const singles = text.split("'").length - 1;
  const doubles = text.split('"').length - 1;
  const quote = singles > doubles ? '"' : "'";
  return `${quote}${text.replaceAll('\\', '\\\\').replaceAll(quote, `\\${quote}`)}${quote}`;
}

/** The WHEN, THEN and AND lines as comments, then the it.todo of one scenario, laid out the way Biome lays it out. */
export function renderSkeleton(scenario: Scenario): string {
  const title = quoteLiteral(`${SCENARIO_PREFIX} ${scenario.title}`);
  const call = `it.todo(${title});`;
  return [
    ...scenario.steps.map((step) => `// ${step}`),
    ...(call.length <= 100 ? [call] : ['it.todo(', `  ${title}`, ');']),
  ].join('\n');
}

export interface GenerateResult {
  file: string;
  added: string[];
}

/** Appends a skeleton for every scenario of the capability that no test names yet, to the existing test/spec/<capability>.spec.ts of a package or to a new file. Nothing that is already in the file is rewritten. */
export async function generateSkeletons(
  root: string,
  capability: string,
  packageName: string,
  scenarios: readonly Scenario[],
  tests: readonly ScenarioTest[]
): Promise<GenerateResult> {
  const named = new Set(tests.map((test) => test.title));
  const missing = scenarios.filter(
    (scenario, position) =>
      scenario.capability === capability &&
      !named.has(scenario.title) &&
      scenarios.findIndex((other) => other.title === scenario.title) === position
  );

  const [existing] = await walk(
    join(root, 'packages'),
    (path) => path.endsWith(`${sep}test${sep}spec${sep}${capability}.spec.ts`),
    NOT_SCANNED
  );
  const target =
    existing ?? join(root, 'packages', packageName, 'test', 'spec', `${capability}.spec.ts`);
  const file = posixPath(root, target);
  if (missing.length === 0) {
    return { file, added: [] };
  }

  const blocks = missing.map(renderSkeleton).join('\n\n');
  const header = `// Scenarios of openspec/specs/${capability}/spec.md. Replace each it.todo with a test and keep its title: the title names the scenario.\n\n`;
  const previous = existsSync(target) ? await readFile(target, 'utf8') : null;
  const next =
    previous === null
      ? `${header}${blocks}\n`
      : `${previous.endsWith('\n') ? previous : `${previous}\n`}\n${blocks}\n`;

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, next);
  return { file, added: missing.map((scenario) => scenario.title) };
}

const USAGE = [
  'usage: spec-scenarios <command>',
  '  check                                      fail on a scenario without a test, a test without a scenario, or a title used twice',
  '  generate <capability> [--package <name>]   append it.todo skeletons for the scenarios that no test names',
  '  generate --change <id> [--package <name>]  the same for every capability that the change touches',
];

export interface Outcome {
  code: number;
  lines: string[];
}

function parseCommand(args: readonly string[]) {
  const { positionals, values } = parseArgs({
    args: [...args],
    allowPositionals: true,
    options: { change: { type: 'string' }, package: { type: 'string' } },
  });
  return {
    command: positionals[0],
    capability: positionals[1],
    change: values.change,
    packageName: values.package ?? DEFAULT_PACKAGE,
  };
}

/** The capabilities that generate works on: the one that was named, or every capability that the delta specs of the change touch. */
function targetCapabilities(
  scenarios: readonly Scenario[],
  capability: string | undefined,
  change: string | undefined
): string[] {
  if (change !== undefined) {
    const touched = scenarios.filter((item) => item.change === change);
    return [...new Set(touched.map((item) => item.capability))];
  }
  return capability === undefined ? [] : [capability];
}

/** Runs one command against the repository at `root`. Exit codes: 0 done, 1 the check found problems, 2 the command could not run. */
export async function run(args: readonly string[], root: string): Promise<Outcome> {
  let parsed: ReturnType<typeof parseCommand>;
  try {
    parsed = parseCommand(args);
  } catch (error) {
    return { code: 2, lines: [error instanceof Error ? error.message : String(error), ...USAGE] };
  }
  const { command, capability, change, packageName } = parsed;

  if (command === 'check') {
    const report = compareScenarios(await loadScenarios(root), await loadScenarioTests(root));
    return { code: report.problems.length === 0 ? 0 : 1, lines: formatReport(report) };
  }

  if (command === 'generate') {
    const scenarios = await loadScenarios(root);
    const capabilities = targetCapabilities(scenarios, capability, change);
    if (capabilities.length === 0) {
      const reason =
        change === undefined
          ? 'generate needs a capability or --change <id>'
          : `no delta specs in the change "${change}"`;
      return { code: 2, lines: [reason, ...USAGE] };
    }

    const tests = await loadScenarioTests(root);
    const lines: string[] = [];
    for (const name of capabilities) {
      if (!scenarios.some((item) => item.capability === name)) {
        return { code: 2, lines: [`no scenarios for the capability "${name}"`] };
      }
      const result = await generateSkeletons(root, name, packageName, scenarios, tests);
      lines.push(
        result.added.length === 0
          ? `${name}: every scenario already has a test or a skeleton`
          : `${name}: added ${result.added.length} it.todo to ${result.file}`,
        ...result.added.map((title) => `  ${title}`)
      );
    }
    return { code: 0, lines };
  }

  return { code: 2, lines: USAGE };
}

if (import.meta.main) {
  run(process.argv.slice(2), resolve(import.meta.dirname, '..')).then(
    ({ code, lines }) => {
      process.stdout.write(lines.map((line) => `${line}\n`).join(''));
      process.exitCode = code;
    },
    (error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 2;
    }
  );
}
