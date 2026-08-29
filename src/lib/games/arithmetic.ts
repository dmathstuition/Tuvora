/**
 * Pure arithmetic question generator for the learner games (Practice & Math
 * Sprint). Client-safe — no server imports — so gameplay is instant.
 */

export type Op = '+' | '−' | '×' | '÷';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameQuestion {
  a: number;
  b: number;
  op: Op;
  answer: number;
  prompt: string;
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Generate one question for the given difficulty and allowed operations. */
export function makeQuestion(difficulty: Difficulty, ops: Op[]): GameQuestion {
  const op = pick(ops.length ? ops : (['+', '−', '×', '÷'] as Op[]));
  const cap = difficulty === 'easy' ? 12 : difficulty === 'medium' ? 25 : 99;
  const tCap = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 12 : 15;

  let a: number;
  let b: number;
  let answer: number;

  switch (op) {
    case '+':
      a = rand(2, cap);
      b = rand(2, cap);
      answer = a + b;
      break;
    case '−':
      a = rand(3, cap);
      b = rand(2, a);
      answer = a - b;
      break;
    case '×':
      a = rand(2, tCap);
      b = rand(2, tCap);
      answer = a * b;
      break;
    default: {
      // Division with a whole-number answer: build from the quotient.
      b = rand(2, tCap);
      answer = rand(2, tCap);
      a = b * answer;
      break;
    }
  }

  return { a, b, op, answer, prompt: `${a} ${op} ${b}` };
}

/** Points awarded for a finished round, capped so games can't be farmed. */
export function pointsFor(correct: number, mode: 'practice' | 'sprint'): number {
  const cap = mode === 'sprint' ? 40 : 25;
  return Math.max(0, Math.min(cap, correct));
}
