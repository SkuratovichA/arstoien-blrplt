import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names and skips falsy values', () => {
    expect(cn('flex', false, undefined, null, 'items-center')).toBe('flex items-center');
  });

  it('lets a later Tailwind utility win over a conflicting earlier one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('accepts conditional objects', () => {
    expect(cn('text-sm', { 'font-bold': true, italic: false })).toBe('text-sm font-bold');
  });
});
