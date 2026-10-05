import { describe, it, expect } from 'vitest';
import { validateQuestions } from '../lib/question-validator';
import type { ExamQuestion } from '@/types/question';

describe('validateQuestions', () => {
  it('detects missing prompt and invalid choices', () => {
    const questions = [
      {
        id: 1,
        type: 'Single',
        prompt: '',
        choices: ['A'],
        correctAnswers: ['A'],
        explanation: '',
        category: '',
        difficulty: 'medium',
      },
    ];

    const issues = validateQuestions(questions as unknown as ExamQuestion[]);
    expect(issues.some((i) => i.message.includes('Missing prompt'))).toBe(true);
    expect(issues.some((i) => i.message.includes('between 2 and 4 choices'))).toBe(true);
  });

  it('accepts multiple correct answers when each one matches a choice', () => {
    const questions = [
      {
        id: 1,
        type: 'Multiple',
        prompt: 'Pick the good answers',
        choices: ['A', 'B', 'C'],
        correctAnswers: ['A', 'C'],
        explanation: 'A and C are correct.',
        category: 'Access Requests',
        difficulty: 'medium',
      },
    ];

    const issues = validateQuestions(questions as unknown as ExamQuestion[]);

    expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });
});
