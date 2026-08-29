import 'server-only';

/**
 * Aptitude / placement question generation.
 *
 * A tutor can build a placement CBT "with AI or manually". This module is the
 * AI-assisted path: given a subject and difficulty it returns multiple-choice
 * questions with a marked correct option.
 *
 * When ANTHROPIC_API_KEY is configured we ask a Claude model to author subject-
 * specific questions; otherwise (and on any API error) we fall back to a
 * self-contained generator so the feature works in every environment — the
 * demo included. Both paths return the same shape.
 */

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  marks: number;
}

export type GenSubject = 'maths' | 'english' | 'reasoning' | 'science';
export type GenDifficulty = 'easy' | 'medium' | 'hard';

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function shuffleWithAnswer(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = options[i]!;
    options[i] = options[j]!;
    options[j] = tmp;
  }
  return { options, correctIndex: options.indexOf(correct) };
}

function mathsQuestion(difficulty: GenDifficulty): GeneratedQuestion {
  const range = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 80 : 400;
  const kind = Math.random();
  let prompt: string;
  let answer: number;
  if (kind < 0.4) {
    const a = rand(2, range);
    const b = rand(2, range);
    prompt = `What is ${a} + ${b}?`;
    answer = a + b;
  } else if (kind < 0.7) {
    const a = rand(Math.floor(range / 2), range);
    const b = rand(2, Math.floor(range / 2));
    prompt = `What is ${a} − ${b}?`;
    answer = a - b;
  } else if (kind < 0.9) {
    const a = rand(2, difficulty === 'easy' ? 9 : 12);
    const b = rand(2, difficulty === 'easy' ? 9 : 12);
    prompt = `What is ${a} × ${b}?`;
    answer = a * b;
  } else {
    // Simple sequence: arithmetic progression, find the next term.
    const start = rand(1, 10);
    const step = rand(2, difficulty === 'hard' ? 12 : 6);
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    prompt = `What comes next: ${seq.join(', ')}, ?`;
    answer = start + 4 * step;
  }
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const delta = rand(1, Math.max(3, Math.floor(answer * 0.2) + 2)) * (Math.random() < 0.5 ? -1 : 1);
    const d = answer + delta;
    if (d !== answer && d >= 0) distractors.add(d);
  }
  const { options, correctIndex } = shuffleWithAnswer(String(answer), [...distractors].map(String));
  return { prompt, options, correctIndex, marks: 1 };
}

const SYNONYMS: [string, string, string[]][] = [
  ['Rapid', 'Quick', ['Loud', 'Heavy', 'Late']],
  ['Happy', 'Glad', ['Angry', 'Tired', 'Empty']],
  ['Begin', 'Start', ['Finish', 'Break', 'Lose']],
  ['Brave', 'Courageous', ['Fearful', 'Quiet', 'Weak']],
  ['Tiny', 'Small', ['Huge', 'Wide', 'Bright']],
  ['Enormous', 'Huge', ['Narrow', 'Gentle', 'Plain']],
  ['Clever', 'Smart', ['Slow', 'Kind', 'Rude']],
  ['Calm', 'Peaceful', ['Noisy', 'Sharp', 'Busy']],
];

function englishQuestion(): GeneratedQuestion {
  const [word, syn, distractors] = SYNONYMS[rand(0, SYNONYMS.length - 1)]!;
  const { options, correctIndex } = shuffleWithAnswer(syn, distractors);
  return { prompt: `Choose the word closest in meaning to "${word}".`, options, correctIndex, marks: 1 };
}

function reasoningQuestion(difficulty: GenDifficulty): GeneratedQuestion {
  // Odd-one-out or number analogy.
  if (Math.random() < 0.5) {
    const base = rand(2, difficulty === 'hard' ? 9 : 5);
    const multiples = [base * 2, base * 3, base * 4];
    const odd = base * 3 + 1;
    const { options, correctIndex } = shuffleWithAnswer(String(odd), multiples.map(String));
    return {
      prompt: `Which number does NOT belong with the others?`,
      options,
      correctIndex,
      marks: 1,
    };
  }
  const a = rand(2, 9);
  const b = a * a;
  const c = rand(2, 9);
  const answer = c * c;
  const distractors = shuffleWithAnswer(String(answer), [String(c * 2), String(c * c + 1), String(c + c)]);
  return {
    prompt: `${a} is to ${b} as ${c} is to ?`,
    options: distractors.options,
    correctIndex: distractors.correctIndex,
    marks: 1,
  };
}

const SCIENCE: [string, string, string[]][] = [
  ['Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Jupiter', 'Saturn']],
  ['What gas do plants absorb from the air?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen']],
  ['What is H₂O commonly known as?', 'Water', ['Salt', 'Air', 'Oil']],
  ['How many legs does an insect have?', '6', ['4', '8', '10']],
  ['Which organ pumps blood around the body?', 'Heart', ['Lungs', 'Liver', 'Brain']],
  ['What force pulls objects toward the earth?', 'Gravity', ['Friction', 'Magnetism', 'Tension']],
];

function scienceQuestion(): GeneratedQuestion {
  const [prompt, answer, distractors] = SCIENCE[rand(0, SCIENCE.length - 1)]!;
  const { options, correctIndex } = shuffleWithAnswer(answer, distractors);
  return { prompt, options, correctIndex, marks: 1 };
}

function generateLocally(subject: GenSubject, difficulty: GenDifficulty, count: number): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 12) {
    guard++;
    let q: GeneratedQuestion;
    switch (subject) {
      case 'english':
        q = englishQuestion();
        break;
      case 'reasoning':
        q = reasoningQuestion(difficulty);
        break;
      case 'science':
        q = scienceQuestion();
        break;
      default:
        q = mathsQuestion(difficulty);
    }
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

interface AnthropicBlock {
  type: string;
  text?: string;
}

/** Try Claude for richer, subject-specific questions; returns null on any failure. */
async function generateWithClaude(
  subject: GenSubject,
  difficulty: GenDifficulty,
  count: number,
  gradeBand: string | null,
): Promise<GeneratedQuestion[] | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const grade = gradeBand ? ` suitable for ${gradeBand}` : '';
  const instruction = `Generate exactly ${count} ${difficulty} multiple-choice aptitude questions on ${subject}${grade}. Each question must have exactly 4 options and one correct answer. Respond with ONLY a JSON array; each item: {"prompt": string, "options": [string, string, string, string], "correctIndex": number}. No prose, no code fences.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.PLACEMENT_MODEL ?? 'claude-sonnet-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: instruction }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: AnthropicBlock[] };
    const text = data.content?.find((b) => b.type === 'text')?.text ?? '';
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      prompt: string;
      options: string[];
      correctIndex: number;
    }[];
    const clean = parsed
      .filter(
        (q) =>
          q &&
          typeof q.prompt === 'string' &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          typeof q.correctIndex === 'number' &&
          q.correctIndex >= 0 &&
          q.correctIndex < q.options.length,
      )
      .slice(0, count)
      .map((q) => ({
        prompt: q.prompt,
        options: q.options.map(String),
        correctIndex: q.correctIndex,
        marks: 1,
      }));
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  }
}

export async function generateQuestions(
  subject: GenSubject,
  difficulty: GenDifficulty,
  count: number,
  gradeBand: string | null = null,
): Promise<GeneratedQuestion[]> {
  const n = Math.min(Math.max(count, 1), 20);
  const viaClaude = await generateWithClaude(subject, difficulty, n, gradeBand);
  if (viaClaude && viaClaude.length >= Math.min(n, 3)) return viaClaude;
  return generateLocally(subject, difficulty, n);
}
