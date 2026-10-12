export type CodingLanguage = 'python' | 'javascript' | 'cpp';

interface CodingSolutionAnswer {
  language: CodingLanguage;
  sourceCode: string;
}

export type SolutionAnswer = string | CodingSolutionAnswer;

export function countWords(value: string) {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}
