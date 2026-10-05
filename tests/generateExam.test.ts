import { describe, it, expect } from 'vitest';
import { generateExam } from '../lib/exam-generator';

function makeQuestion(id: number, difficulty: 'easy' | 'medium' | 'hard') {
  return {
    id,
    type: 'Single' as const,
    prompt: `Q${id}`,
    choices: ['A', 'B', 'C'],
    correctAnswers: ['A'],
    explanation: 'explain',
    category: 'Access Requests' as const,
    difficulty,
  };
}

describe('generateExam', () => {
  it('returns requested number of questions and respects available pool', () => {
    const pool = [
      makeQuestion(1, 'easy'),
      makeQuestion(2, 'medium'),
      makeQuestion(3, 'hard'),
      makeQuestion(4, 'medium'),
      makeQuestion(5, 'easy'),
      makeQuestion(6, 'medium'),
    ];

    const exam = generateExam(pool, 4);

    expect(exam).toHaveLength(4);
    // all returned items must be from the original pool
    for (const q of exam) {
      expect(pool.map((p) => p.id)).toContain(q.id);
    }
  });
});
