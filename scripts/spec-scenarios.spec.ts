import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Scenario, ScenarioTest } from './spec-scenarios.js';
import {
  compareScenarios,
  formatReport,
  parseScenarios,
  parseScenarioTests,
  quoteLiteral,
  renderSkeleton,
  run,
} from './spec-scenarios.js';

const lines = (...parts: string[]): string => `${parts.join('\n')}\n`;

// Built from code points, so that an editor which normalizes the text cannot turn the decomposed letter into the composed one
const DECOMPOSED_Y = String.fromCodePoint(0x438, 0x306);
const COMPOSED_Y = String.fromCodePoint(0x439);
const BACKSLASH = '\\';

const origin = { file: 'openspec/specs/demo/spec.md', capability: 'demo', change: null };

const scenario = (title: string, extra: Partial<Scenario> = {}): Scenario => ({
  ...origin,
  title,
  line: 1,
  steps: [],
  ...extra,
});

const scenarioTest = (
  title: string,
  kind: ScenarioTest['kind'] = 'test',
  file = 'packages/server/test/spec/demo.spec.ts'
): ScenarioTest => ({ title, kind, file, line: 1 });

describe('parseScenarios', () => {
  it('reads the title, the line and the steps of every scenario', () => {
    const markdown = lines(
      '# demo Specification',
      '',
      '## Purpose',
      '',
      'Demo.',
      '',
      '## Requirements',
      '',
      '### Requirement: A thing works',
      '',
      'The system SHALL work.',
      '',
      '#### Scenario: First works',
      '',
      '- **WHEN** a user acts',
      '- **THEN** it works',
      '- **AND** it is logged',
      '',
      '#### Scenario: Second works',
      '',
      '- **WHEN** a user waits',
      '- **THEN** it waits'
    );

    expect(parseScenarios(markdown, origin)).toEqual([
      scenario('First works', {
        line: 13,
        steps: ['WHEN a user acts', 'THEN it works', 'AND it is logged'],
      }),
      scenario('Second works', { line: 19, steps: ['WHEN a user waits', 'THEN it waits'] }),
    ]);
  });

  it('keeps a Cyrillic title and the quotes of a title as written', () => {
    const markdown = lines(
      '#### Scenario: Вход с неверным паролем отклонён',
      `#### Scenario: The user says "hello" and it's fine`
    );

    expect(parseScenarios(markdown, origin).map((found) => found.title)).toEqual([
      'Вход с неверным паролем отклонён',
      `The user says "hello" and it's fine`,
    ]);
  });

  it('reads a title typed with a combining mark as the composed letter', () => {
    const [found] = parseScenarios(`#### Scenario: ${DECOMPOSED_Y}\n`, origin);

    expect(found.title).toBe(COMPOSED_Y);
  });

  it('counts only the headings of level four that start with Scenario:', () => {
    const markdown = lines(
      '### Scenario: level three',
      '##### Scenario: level five',
      '#### Scenarios: the wrong word',
      '#### Scenario:',
      '#### Note: Scenario: inside',
      '#### Scenario: the only one'
    );

    expect(parseScenarios(markdown, origin).map((found) => found.title)).toEqual(['the only one']);
  });

  it('ignores a heading inside a code fence', () => {
    const markdown = lines(
      '```markdown',
      '#### Scenario: in a backtick fence',
      '```',
      '~~~',
      '#### Scenario: in a tilde fence',
      '~~~',
      '#### Scenario: outside'
    );

    expect(parseScenarios(markdown, origin).map((found) => found.title)).toEqual(['outside']);
  });

  it('skips the scenarios of a REMOVED section and goes on after it', () => {
    const markdown = lines(
      '## ADDED Requirements',
      '### Requirement: New',
      '#### Scenario: added',
      '## REMOVED Requirements',
      '### Requirement: Old',
      '#### Scenario: removed',
      '## MODIFIED Requirements',
      '### Requirement: Changed',
      '#### Scenario: modified'
    );

    expect(parseScenarios(markdown, origin).map((found) => found.title)).toEqual([
      'added',
      'modified',
    ]);
  });
});

describe('parseScenarioTests', () => {
  const titles = (source: string): string[] =>
    parseScenarioTests(source, 'a.spec.ts').map((found) => found.title);

  it('reads it, test, it.todo and it.skip with every quote style', () => {
    const source = lines(
      "it('Scenario: single quoted', () => {});",
      'test("Scenario: double quoted", () => {});',
      'it(`Scenario: template quoted`, () => {});',
      "it.todo('Scenario: planned');",
      "it.skip('Scenario: switched off', () => {});",
      "it.only('Scenario: focused', () => {});"
    );

    expect(parseScenarioTests(source, 'a.spec.ts')).toEqual([
      { title: 'single quoted', kind: 'test', file: 'a.spec.ts', line: 1 },
      { title: 'double quoted', kind: 'test', file: 'a.spec.ts', line: 2 },
      { title: 'template quoted', kind: 'test', file: 'a.spec.ts', line: 3 },
      { title: 'planned', kind: 'todo', file: 'a.spec.ts', line: 4 },
      { title: 'switched off', kind: 'skip', file: 'a.spec.ts', line: 5 },
      { title: 'focused', kind: 'test', file: 'a.spec.ts', line: 6 },
    ]);
  });

  it('decodes the escapes of a title and keeps non-Latin letters', () => {
    const source = lines(
      String.raw`it('Scenario: it\'s "quoted"', () => {});`,
      String.raw`it("Scenario: say \"hi\"", () => {});`,
      `it('Scenario: ${BACKSLASH}u0412${BACKSLASH}u0445 ${BACKSLASH}u{1F600} ${BACKSLASH}x41', () => {});`,
      String.raw`it('Scenario: tab\there', () => {});`,
      "it('Scenario: Вход с неверным паролем', () => {});"
    );

    expect(titles(source)).toEqual([
      `it's "quoted"`,
      'say "hi"',
      'Вх 😀 A',
      'tab\there',
      'Вход с неверным паролем',
    ]);
  });

  it('reads a title written with a combining mark as the composed letter', () => {
    const source = lines(
      `it('Scenario: ${DECOMPOSED_Y}', () => {});`,
      `it('Scenario: ${BACKSLASH}u0438${BACKSLASH}u0306', () => {});`
    );

    expect(titles(source)).toEqual([COMPOSED_Y, COMPOSED_Y]);
  });

  it('ignores a title in a comment and in a string that holds test code', () => {
    const source = lines(
      "// it('Scenario: in a line comment', () => {});",
      "/* it('Scenario: in a block comment', () => {}); */",
      `const fixture = "it('Scenario: in a string', () => {})";`,
      'const embedded = `',
      "  it('Scenario: in a template', () => {});",
      '`;',
      "it('Scenario: the real one', () => {});"
    );

    expect(titles(source)).toEqual(['the real one']);
  });

  it('ignores method calls named test and names that only end in it or test', () => {
    const source = lines(
      "const found = /x/.test('Scenario: a regex');",
      "submit('Scenario: ends in it');",
      "pretest('Scenario: ends in test');",
      "it('Scenario: kept', () => {});"
    );

    expect(titles(source)).toEqual(['kept']);
  });

  it('ignores a title that is built at run time', () => {
    const source = lines(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the text is test input: a title with an interpolation
      'it(`Scenario: ${name}`, () => {});',
      "it('Scenario: ' + name, () => {});",
      "it.each([1, 2])('Scenario: case %s', () => {});",
      "it('Scenario: written out', () => {});"
    );

    expect(titles(source)).toEqual(['written out']);
  });

  it('stays in step after a template literal that holds another template', () => {
    const source = lines(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the text is test input: a template literal with a nested template
      "const label = `a ${flag ? `x` : 'y'} b`;",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the text is test input: a backtick in a string inside an interpolation
      "const quoted = `a ${'`'} b`;",
      "const fixture = `it('Scenario: inside a later template', () => {});`;",
      "it('Scenario: after the template', () => {});"
    );

    expect(titles(source)).toEqual(['after the template']);
  });

  it('ignores a test whose title does not start with Scenario:', () => {
    const source = lines(
      "it('a plain test', () => {});",
      "it('scenario: in lower case', () => {});",
      "it('Scenario: the one', () => {});"
    );

    expect(titles(source)).toEqual(['the one']);
  });

  it('reports the line where the call starts', () => {
    const source = lines('', '', "it('Scenario: on the third line', () => {});");

    expect(parseScenarioTests(source, 'a.spec.ts')[0].line).toBe(3);
  });

  describe('what Vitest does not run', () => {
    const kinds = (source: string): [string, string][] =>
      parseScenarioTests(source, 'a.spec.ts').map((found) => [found.title, found.kind]);

    it('counts a test inside describe.skip or describe.todo as skipped, and not the test after the suite', () => {
      const source = lines(
        "describe.skip('suite', () => {",
        "  it('Scenario: inside skip', () => {});",
        "  it('Scenario: with parentheses', () => { expect(')').toBe(')'); });",
        '});',
        "describe.todo('planned suite', () => {",
        "  it('Scenario: inside todo', () => {});",
        '});',
        "it('Scenario: after the suites', () => {});"
      );

      expect(kinds(source)).toEqual([
        ['inside skip', 'skip'],
        ['with parentheses', 'skip'],
        ['inside todo', 'skip'],
        ['after the suites', 'test'],
      ]);
    });

    it('does not read describe.skip in a comment or a string as a suite', () => {
      const source = lines(
        "// describe.skip('old suite', () => {",
        'const note = "describe.skip(\'x\', () => {";',
        "it('Scenario: still running', () => {});"
      );

      expect(kinds(source)).toEqual([['still running', 'test']]);
    });

    it('counts a call without a function as a todo, because Vitest does not run it', () => {
      const source = lines("it('Scenario: no body');", 'test("Scenario: no body either")');

      expect(kinds(source)).toEqual([
        ['no body', 'todo'],
        ['no body either', 'todo'],
      ]);
    });
  });
});

describe('compareScenarios', () => {
  it('finds no problem when every scenario has a running test', () => {
    const report = compareScenarios(
      [scenario('A'), scenario('B')],
      [scenarioTest('A'), scenarioTest('B')]
    );

    expect(report.problems).toEqual([]);
    expect(report.capabilities.get('demo')?.map((row) => row.status)).toEqual([
      'covered',
      'covered',
    ]);
  });

  it('reports a scenario that no test names', () => {
    const report = compareScenarios([scenario('A'), scenario('B')], [scenarioTest('A')]);

    expect(report.problems).toEqual([{ kind: 'uncovered', scenario: scenario('B'), pending: [] }]);
  });

  it('does not count an it.todo or an it.skip as covered', () => {
    const report = compareScenarios(
      [scenario('A'), scenario('B')],
      [scenarioTest('A', 'todo'), scenarioTest('B', 'skip')]
    );

    expect(report.problems.map((problem) => problem.kind)).toEqual(['uncovered', 'uncovered']);
    expect(report.capabilities.get('demo')?.map((row) => row.status)).toEqual(['todo', 'todo']);
  });

  it('counts a scenario as covered when a running test stands next to an it.todo', () => {
    const report = compareScenarios(
      [scenario('A')],
      [scenarioTest('A', 'todo', 'packages/server/test/spec/other.spec.ts'), scenarioTest('A')]
    );

    expect(report.problems.map((problem) => problem.kind)).toEqual(['duplicate-test']);
    expect(report.capabilities.get('demo')?.[0].status).toBe('covered');
  });

  it('reports a test whose scenario does not exist', () => {
    const report = compareScenarios([scenario('A')], [scenarioTest('A'), scenarioTest('Ghost')]);

    expect(report.problems).toEqual([{ kind: 'orphan', test: scenarioTest('Ghost') }]);
  });

  it('reports a title that two scenarios share', () => {
    const other = scenario('A', { capability: 'other', file: 'openspec/specs/other/spec.md' });
    const report = compareScenarios([scenario('A'), other], [scenarioTest('A')]);

    expect(report.problems).toEqual([
      { kind: 'duplicate-scenario', title: 'A', scenarios: [scenario('A'), other] },
    ]);
  });

  it('reports a title that two tests share', () => {
    const second = scenarioTest('A', 'test', 'packages/server/test/spec/second.spec.ts');
    const report = compareScenarios([scenario('A')], [scenarioTest('A'), second]);

    expect(report.problems).toEqual([
      { kind: 'duplicate-test', title: 'A', tests: [scenarioTest('A'), second] },
    ]);
  });

  it('counts a scenario that a change repeats from the spec once', () => {
    const report = compareScenarios(
      [scenario('A'), scenario('A', { change: 'edit' })],
      [scenarioTest('A')]
    );

    const reversed = compareScenarios(
      [scenario('A', { change: 'edit' }), scenario('A')],
      [scenarioTest('A')]
    );

    expect(report.problems).toEqual([]);
    expect(report.capabilities.get('demo')).toHaveLength(1);
    expect(reversed.capabilities.get('demo')?.[0].scenario.change).toBeNull();
  });

  it('wants a test for a scenario that only a change adds', () => {
    const added = scenario('B', { change: 'edit' });
    const report = compareScenarios([scenario('A'), added], [scenarioTest('A')]);

    expect(report.problems).toEqual([{ kind: 'uncovered', scenario: added, pending: [] }]);
  });

  it('reports a title that one change states twice', () => {
    const report = compareScenarios(
      [scenario('A', { change: 'one' }), scenario('A', { change: 'one' })],
      [scenarioTest('A')]
    );

    expect(report.problems.map((problem) => problem.kind)).toEqual(['duplicate-scenario']);
  });

  it('reports one title in the deltas of two changes', () => {
    const report = compareScenarios(
      [scenario('A', { change: 'one' }), scenario('A', { change: 'two' })],
      [scenarioTest('A')]
    );

    expect(report.problems.map((problem) => problem.kind)).toEqual(['duplicate-scenario']);
  });

  it('reports a title that the spec of one capability and the delta of another both state', () => {
    const report = compareScenarios(
      [scenario('A'), scenario('A', { change: 'edit', capability: 'other' })],
      [scenarioTest('A')]
    );

    expect(report.problems.map((problem) => problem.kind)).toEqual(['duplicate-scenario']);
  });
});

describe('formatReport', () => {
  it('shows the covered count per capability, each problem with its place, and the verdict', () => {
    const report = compareScenarios(
      [scenario('A'), scenario('B', { line: 7 })],
      [scenarioTest('A'), scenarioTest('Ghost')]
    );

    expect(formatReport(report)).toEqual([
      'demo: 1 of 2 scenarios covered',
      '  covered  A  packages/server/test/spec/demo.spec.ts:1',
      '  missing  B  -',
      '',
      'uncovered: "B" (openspec/specs/demo/spec.md:7) has no test',
      'orphan: packages/server/test/spec/demo.spec.ts:1 names the scenario "Ghost", which no spec has',
      'failed: 2 problems in 2 scenarios',
    ]);
  });

  it('lists the capabilities in alphabetical order', () => {
    const report = compareScenarios(
      [scenario('Z', { capability: 'zeta' }), scenario('A', { capability: 'alpha' })],
      [scenarioTest('Z'), scenarioTest('A')]
    );

    expect(formatReport(report).filter((line) => line.endsWith('scenarios covered'))).toEqual([
      'alpha: 1 of 1 scenarios covered',
      'zeta: 1 of 1 scenarios covered',
    ]);
  });

  it('says which kind of pending test a scenario has', () => {
    const report = compareScenarios(
      [scenario('A'), scenario('B')],
      [scenarioTest('A', 'todo'), scenarioTest('B', 'skip')]
    );

    expect(formatReport(report)).toEqual(
      expect.arrayContaining([
        'uncovered: "A" (openspec/specs/demo/spec.md:1) has only an it.todo at packages/server/test/spec/demo.spec.ts:1',
        'uncovered: "B" (openspec/specs/demo/spec.md:1) has only an it.skip at packages/server/test/spec/demo.spec.ts:1',
      ])
    );
  });

  it('ends with ok when nothing is wrong', () => {
    const report = compareScenarios([scenario('A')], [scenarioTest('A')]);

    expect(formatReport(report).at(-1)).toBe('ok: 1 scenarios, every one has a test');
  });
});

describe('quoteLiteral', () => {
  it('writes single quotes unless the text holds more single than double quotes', () => {
    expect(quoteLiteral('plain')).toBe("'plain'");
    expect(quoteLiteral(`it's`)).toBe(`"it's"`);
    expect(quoteLiteral(`say "hi" it's`)).toBe(String.raw`'say "hi" it\'s'`);
  });

  it('escapes a backslash', () => {
    expect(quoteLiteral('a\\b')).toBe(String.raw`'a\\b'`);
  });
});

describe('renderSkeleton', () => {
  it('writes the steps as comments above an it.todo with the prefixed title', () => {
    const skeleton = renderSkeleton(
      scenario('First works', { steps: ['WHEN a user acts', 'THEN it works'] })
    );

    expect(skeleton).toBe(
      ['// WHEN a user acts', '// THEN it works', "it.todo('Scenario: First works');"].join('\n')
    );
  });

  it('puts a title that does not fit on one line on a line of its own', () => {
    const title = `A title that is so long that the it.todo call around it cannot stay within a hundred columns`;

    expect(renderSkeleton(scenario(title))).toBe(
      ['it.todo(', `  'Scenario: ${title}'`, ');'].join('\n')
    );
  });

  it('writes a title that parseScenarioTests reads back unchanged', () => {
    const awkward = [
      'Plain',
      'Вход "в" систему',
      "It's here",
      `Both ' and "`,
      'back\\slash',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the text is a scenario title that holds a placeholder-like sequence on purpose
      'dollar ${amount}',
      'tick ` tick',
    ];

    for (const title of awkward) {
      const [read] = parseScenarioTests(renderSkeleton(scenario(title)), 'a.spec.ts');
      expect(read.title).toBe(title);
    }
  });
});

describe('run', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  async function makeRepo(files: Record<string, string>): Promise<string> {
    const root = await mkdtemp(join(tmpdir(), 'spec-scenarios-'));
    roots.push(root);
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    return root;
  }

  const specOf = (...titles: string[]): string =>
    lines(
      '# demo Specification',
      '',
      '### Requirement: A thing works',
      '',
      ...titles.flatMap((title) => [
        `#### Scenario: ${title}`,
        '',
        '- **WHEN** a',
        '- **THEN** b',
        '',
      ])
    );

  const TWO_SCENARIOS = specOf('First works', 'Second works');
  const FIRST_TEST = lines("it('Scenario: First works', () => {});");
  const BOTH_TESTS = lines(
    "it('Scenario: First works', () => {});",
    "it('Scenario: Second works', () => {});"
  );

  it('passes the check when every scenario has a running test', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': TWO_SCENARIOS,
      'packages/server/test/spec/demo.spec.ts': BOTH_TESTS,
    });

    const outcome = await run(['check'], root);

    expect(outcome.code).toBe(0);
    expect(outcome.lines.at(-1)).toBe('ok: 2 scenarios, every one has a test');
  });

  it('fails the check and names the scenario that has no test', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': TWO_SCENARIOS,
      'packages/server/test/spec/demo.spec.ts': FIRST_TEST,
    });

    const outcome = await run(['check'], root);

    expect(outcome.code).toBe(1);
    expect(outcome.lines).toContain(
      'uncovered: "Second works" (openspec/specs/demo/spec.md:10) has no test'
    );
  });

  it('reads the delta spec of an active change and leaves the archive alone', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': specOf('First works'),
      'openspec/changes/add-third/specs/demo/spec.md': specOf('Third works'),
      'openspec/changes/archive/2026-01-01-old/specs/demo/spec.md': specOf('Archived works'),
      'packages/server/test/spec/demo.spec.ts': FIRST_TEST,
    });

    const outcome = await run(['check'], root);

    expect(outcome.code).toBe(1);
    expect(outcome.lines).toContain('  missing  Third works  -  [change add-third]');
    expect(outcome.lines.join('\n')).not.toContain('Archived works');
  });

  it('reads a capability whose folder has the name of a folder that the test scan skips', async () => {
    const root = await makeRepo({
      'openspec/specs/build/spec.md': specOf('Build works'),
      'packages/server/test/spec/build.spec.ts': lines("it('Scenario: Build works', () => {});"),
    });

    const outcome = await run(['check'], root);

    expect(outcome.code).toBe(0);
    expect(outcome.lines[0]).toBe('build: 1 of 1 scenarios covered');
  });

  it('does not read tests under node_modules', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': specOf('First works'),
      'packages/server/test/spec/demo.spec.ts': FIRST_TEST,
      'packages/server/node_modules/dep/dep.spec.ts': lines(
        "it('Scenario: From a dependency', () => {});"
      ),
    });

    expect((await run(['check'], root)).code).toBe(0);
  });

  it('generates a test file with one it.todo per scenario, which the check then rejects', async () => {
    const root = await makeRepo({ 'openspec/specs/demo/spec.md': TWO_SCENARIOS });

    const generated = await run(['generate', 'demo'], root);
    const written = await readFile(join(root, 'packages/server/test/spec/demo.spec.ts'), 'utf8');
    const checked = await run(['check'], root);

    expect(generated).toEqual({
      code: 0,
      lines: [
        'demo: added 2 it.todo to packages/server/test/spec/demo.spec.ts',
        '  First works',
        '  Second works',
      ],
    });
    expect(written).toBe(
      lines(
        '// Scenarios of openspec/specs/demo/spec.md. Replace each it.todo with a test and keep its title: the title names the scenario.',
        '',
        '// WHEN a',
        '// THEN b',
        "it.todo('Scenario: First works');",
        '',
        '// WHEN a',
        '// THEN b',
        "it.todo('Scenario: Second works');"
      )
    );
    expect(checked.code).toBe(1);
    expect(checked.lines).toContain(
      'uncovered: "First works" (openspec/specs/demo/spec.md:5) has only an it.todo at packages/server/test/spec/demo.spec.ts:5'
    );
  });

  it('appends only the scenarios that no test names and keeps the rest of the file', async () => {
    const path = 'packages/server/test/spec/demo.spec.ts';
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': TWO_SCENARIOS,
      [path]: FIRST_TEST,
    });

    const first = await run(['generate', 'demo'], root);
    const written = await readFile(join(root, path), 'utf8');
    const second = await run(['generate', 'demo'], root);

    expect(first.lines[0]).toBe(`demo: added 1 it.todo to ${path}`);
    expect(written).toBe(
      lines(
        "it('Scenario: First works', () => {});",
        '',
        '// WHEN a',
        '// THEN b',
        "it.todo('Scenario: Second works');"
      )
    );
    expect(second.lines).toEqual(['demo: every scenario already has a test or a skeleton']);
    expect(await readFile(join(root, path), 'utf8')).toBe(written);
  });

  it('writes one skeleton for a title that both the spec and a change hold', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': specOf('First works'),
      'openspec/changes/grow/specs/demo/spec.md': specOf('First works', 'Second works'),
    });

    const outcome = await run(['generate', 'demo'], root);

    expect(outcome.lines).toEqual([
      'demo: added 2 it.todo to packages/server/test/spec/demo.spec.ts',
      '  First works',
      '  Second works',
    ]);
  });

  it('starts the skeleton on a new line when the file does not end with one', async () => {
    const path = 'packages/server/test/spec/demo.spec.ts';
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': TWO_SCENARIOS,
      [path]: "it('Scenario: First works', () => {});",
    });

    await run(['generate', 'demo'], root);

    expect(await readFile(join(root, path), 'utf8')).toBe(
      lines(
        "it('Scenario: First works', () => {});",
        '',
        '// WHEN a',
        '// THEN b',
        "it.todo('Scenario: Second works');"
      )
    );
  });

  it('writes the skeletons into the package that was asked for', async () => {
    const root = await makeRepo({ 'openspec/specs/demo/spec.md': specOf('First works') });

    const outcome = await run(['generate', 'demo', '--package', 'client'], root);

    expect(outcome.lines[0]).toBe(
      'demo: added 1 it.todo to packages/client/test/spec/demo.spec.ts'
    );
  });

  it('generates for every capability that a change touches', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': specOf('First works'),
      'openspec/changes/grow/specs/demo/spec.md': specOf('Second works'),
      'openspec/changes/grow/specs/extra/spec.md': specOf('Extra works'),
      'packages/server/test/spec/demo.spec.ts': FIRST_TEST,
    });

    const outcome = await run(['generate', '--change', 'grow'], root);

    expect(outcome.code).toBe(0);
    expect(outcome.lines).toEqual([
      'demo: added 1 it.todo to packages/server/test/spec/demo.spec.ts',
      '  Second works',
      'extra: added 1 it.todo to packages/server/test/spec/extra.spec.ts',
      '  Extra works',
    ]);
  });

  it('exits with 2 when generate has nothing to work on', async () => {
    const root = await makeRepo({ 'openspec/specs/demo/spec.md': specOf('First works') });

    expect((await run(['generate'], root)).code).toBe(2);
    expect(await run(['generate', 'missing'], root)).toEqual({
      code: 2,
      lines: ['no scenarios for the capability "missing"'],
    });
    expect((await run(['generate', '--change', 'nothing'], root)).lines[0]).toBe(
      'no delta specs in the change "nothing"'
    );
  });

  it('exits with 2 and prints the usage for an unknown command or option', async () => {
    const root = await makeRepo({});

    const unknownCommand = await run(['frobnicate'], root);
    const unknownOption = await run(['check', '--nope'], root);

    expect(unknownCommand.code).toBe(2);
    expect(unknownCommand.lines[0]).toBe('usage: spec-scenarios <command>');
    expect(unknownOption.code).toBe(2);
    expect(unknownOption.lines.at(-1)).toContain('generate --change <id>');
  });

  it('runs as a command and ends with the exit code of the check', async () => {
    const root = await makeRepo({
      'openspec/specs/demo/spec.md': TWO_SCENARIOS,
      'packages/server/test/spec/demo.spec.ts': FIRST_TEST,
    });
    await mkdir(join(root, 'scripts'));
    await copyFile(
      new URL('./spec-scenarios.ts', import.meta.url),
      join(root, 'scripts', 'spec-scenarios.ts')
    );

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'spec-scenarios.ts'), 'check'],
      {
        encoding: 'utf8',
      }
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('failed: 1 problems in 2 scenarios');
  });
});
