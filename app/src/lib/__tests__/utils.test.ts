import { describe, expect, it } from 'vitest';

import { cn, mergeClassName } from '../utils';

describe('cn', () => {
  it('concatenates class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('merges conflicting tailwind classes — last wins', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles arrays', () => {
    expect(cn(['a', 'b'])).toBe('a b');
  });

  it('handles conditional objects', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });
});

describe('mergeClassName', () => {
  it('merges a static class with caller classes', () => {
    expect(mergeClassName('p-2 text-sm', 'p-4')).toBe('p-2 text-sm');
  });

  it('passes component state to a dynamic class callback', () => {
    const classes = mergeClassName(
      (state: { selected: boolean }) => (state.selected ? 'text-red-500' : 'text-blue-500'),
      'text-sm'
    );
    expect(typeof classes).toBe('function');
    if (typeof classes === 'function') {
      expect(classes({ selected: true })).toBe('text-sm text-red-500');
      expect(classes({ selected: false })).toBe('text-sm text-blue-500');
    }
  });
});
