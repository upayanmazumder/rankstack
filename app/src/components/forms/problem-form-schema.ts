import { z } from 'zod';

const optionSchema = z.object({ value: z.string() });
const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

export const problemFormSchema = z
  .object({
    contestId: z.string().min(1, 'Choose a contest.'),
    type: z.enum(['mcq', 'coding', 'subjective']),
    title: z.string().trim().min(1, 'Problem title is required.').max(200),
    description: z.string().trim(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    points: z.number().positive('Points must be greater than zero.'),
    options: z.array(optionSchema),
    correctAnswer: z.string(),
    inputFormat: z.string(),
    constraints: z.string(),
    testCases: z.array(testCaseSchema),
    wordLimit: z.number().int(),
    evaluationRubric: z.string(),
  })
  .superRefine((values, context) => {
    if (values.type === 'mcq') {
      if (values.options.length < 2) {
        context.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Add at least two options.',
        });
      }
      values.options.forEach((option, index) => {
        if (!option.value.trim()) {
          context.addIssue({
            code: 'custom',
            path: ['options', index, 'value'],
            message: 'Option cannot be empty.',
          });
        }
      });
      if (
        !values.correctAnswer ||
        !values.options.some(option => option.value === values.correctAnswer)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['correctAnswer'],
          message: 'Choose the correct option.',
        });
      }
    }
    if (values.type === 'coding') {
      if (values.testCases.length < 1) {
        context.addIssue({
          code: 'custom',
          path: ['testCases'],
          message: 'Add at least one test case.',
        });
      }
      values.testCases.forEach((tc, index) => {
        if (!tc.output.trim()) {
          context.addIssue({
            code: 'custom',
            path: ['testCases', index, 'output'],
            message: 'Expected output is required.',
          });
        }
      });
    }
    if (values.type === 'subjective') {
      if (values.wordLimit <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['wordLimit'],
          message: 'Word limit must be greater than zero.',
        });
      }
      if (!values.evaluationRubric.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['evaluationRubric'],
          message: 'An evaluation rubric is required.',
        });
      }
    }
  });
export type ProblemFormValues = z.infer<typeof problemFormSchema>;

export const defaultProblemFormValues: ProblemFormValues = {
  contestId: '',
  type: 'mcq',
  title: '',
  description: '',
  difficulty: 'easy',
  points: 10,
  options: [{ value: '' }, { value: '' }],
  correctAnswer: '',
  inputFormat: '',
  constraints: '',
  testCases: [{ input: '', output: '' }],
  wordLimit: 500,
  evaluationRubric: '',
};
