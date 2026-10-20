import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dirname, '..');

/** `.agents/skills` is read by agents in general and `.claude/skills` by Claude Code, so the skill exists in both places and must not drift */
describe('the spec-to-tests skill', () => {
  it('is the same file under .agents/skills and .claude/skills', () => {
    const read = (folder: string): string =>
      readFileSync(join(repoRoot, folder, 'skills', 'spec-to-tests', 'SKILL.md'), 'utf8');

    expect(read('.claude')).toBe(read('.agents'));
  });
});
