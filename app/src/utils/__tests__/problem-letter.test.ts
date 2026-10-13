import { describe, expect, it } from 'vitest';

import { problemLetter } from '../problem-letter';

describe('problemLetter', () => {
  it('labels problems in spreadsheet column order', () => {
    expect(problemLetter(0)).toBe('A');
    expect(problemLetter(25)).toBe('Z');
    expect(problemLetter(26)).toBe('AA');
    expect(problemLetter(27)).toBe('AB');
    expect(problemLetter(701)).toBe('ZZ');
    expect(problemLetter(702)).toBe('AAA');
  });

  it('rejects positions outside the contest order', () => {
    expect(problemLetter(-1)).toBe('?');
    expect(problemLetter(1.5)).toBe('?');
  });
});
