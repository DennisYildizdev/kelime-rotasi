const DAY = 24 * 60 * 60 * 1000;

export function normalizeAnswer(value) {
  return String(value ?? '').trim().toLocaleLowerCase('en');
}

export function gradeAnswer(answer, expected) {
  return normalizeAnswer(answer) === normalizeAnswer(expected);
}

function seededShuffle(items, seed = 1) {
  const result = [...items];
  let state = Math.abs(Number(seed) || 1);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 16807) % 2147483647;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildSession(words, { level = 'A1', size = 5, seed = Date.now(), now = Date.now(), progress = {}, reviewOnly = false } = {}) {
  const eligible = words.filter(word => word.level === level && word.eligible !== false);
  const due = eligible.filter(w => Number.isFinite(progress[w.id]?.dueAt) && progress[w.id].dueAt <= now)
    .sort((a, b) => progress[a.id].dueAt - progress[b.id].dueAt);
  const fresh = reviewOnly ? [] : seededShuffle(eligible.filter(w => !Number.isFinite(progress[w.id]?.dueAt) && progress[w.id]?.mark !== 'known'), seed).slice(0, Math.min(size, 5));
  const chosen = [...due, ...fresh].slice(0, size);
  // Challenge repetitions are from this session, never future-due words.
  if (size === 10 && chosen.length) {
    const originals = [...chosen];
    while (chosen.length < size) chosen.push(originals[(chosen.length - originals.length) % originals.length]);
  }
  return chosen;
}

export function sessionSizeForMode(mode) {
  return ({ tiny: 1, focus: 5, challenge: 10 })[mode] ?? 5;
}

export function makeChoices(answer, pool, { field = 'word', count = 4, seed = 1 } = {}) {
  const correct = answer[field];
  const alternatives = pool
    .map(item => item[field])
    .filter(value => value && value !== correct);
  const unique = [...new Set(alternatives)];
  const picked = seededShuffle(unique, seed).slice(0, Math.max(0, count - 1));
  return seededShuffle([correct, ...picked], seed + 17);
}

export function nextReview(progress = {}, correct, now = Date.now(), { hintUsed = false } = {}) {
  const currentStreak = Number(progress.streak) || 0;
  const independent = correct && !hintUsed;
  const streak = independent ? currentStreak + 1 : 0;
  const intervalDays = independent ? Math.min(30, 2 ** Math.max(0, streak - 1)) : 0.08;
  return {
    ...progress,
    attempts: (progress.attempts || 0) + 1,
    correctCount: (progress.correctCount || 0) + Number(correct),
    consecutiveCorrect: streak,
    lastSeenAt: now,
    hintUsed,
    status: independent ? 'review' : 'learning',
    streak,
    dueAt: now + intervalDays * DAY,
    lastResult: Boolean(correct)
  };
}

export function createSession(words, { mode = 'focus', level = 'A1', progress = {}, now = Date.now(), seed = now, contentVersion = '2', introductions = false, exercise = 'mixed', reviewOnly = false } = {}) {
  const queue = buildSession(words, { level, progress, size: sessionSizeForMode(mode), now, seed, reviewOnly });
  const types = ['meaning', 'reverse', 'spelling', 'listening', 'context'];
  const seen = new Map();
  const questions = queue.map((word, index) => {
    const intro = introductions && !progress[word.id]?.dueAt && !seen.has(word.id);
    const previous = seen.get(word.id);
    const typeIndex = previous === undefined ? index % types.length : (previous + 1) % types.length;
    seen.set(word.id, typeIndex);
    return { id: `${now}-${seed}-${index}`, wordId: word.id, type: exercise === 'mixed' ? types[typeIndex] : exercise, seed: seed + index, intro };
  });
  return { schemaVersion: 2, contentVersion, sessionId: `${now}-${seed}`, mode, level, questions, currentIndex: 0, score: 0, answered: false, selectedAnswer: '', correct: false, hintUsed: false, listeningFallback: false, introDismissed: false, completed: !questions.length, updatedAt: now };
}

export function recordAnswer(state, { answer, correct, now = Date.now() }) {
  const session = state.session;
  if (!session || session.completed || session.answered) return state;
  const question = session.questions[session.currentIndex];
  return { ...state, progress: { ...state.progress, [question.wordId]: nextReview(state.progress[question.wordId], correct, now, { hintUsed: session.hintUsed }) }, session: { ...session, answered: true, selectedAnswer: String(answer), correct: Boolean(correct), score: session.score + Number(correct), updatedAt: now } };
}

export function advanceSession(state, now = Date.now()) {
  const session = state.session;
  if (!session?.answered || session.completed) return state;
  const currentIndex = session.currentIndex + 1;
  return { ...state, session: { ...session, currentIndex, completed: currentIndex >= session.questions.length, answered: false, selectedAnswer: '', correct: false, hintUsed: false, listeningFallback: false, introDismissed: false, updatedAt: now } };
}
