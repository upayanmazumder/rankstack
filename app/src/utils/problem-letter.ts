/** Contest problem label in scoreboard order: 0 → A, 25 → Z, 26 → AA. */
export function problemLetter(index: number): string {
  if (!Number.isInteger(index) || index < 0) return '?';
  let label = '';
  let remaining = index;
  do {
    label = String.fromCharCode(65 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);
  return label;
}
