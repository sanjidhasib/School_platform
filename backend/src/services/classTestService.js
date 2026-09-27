/**
 * Marking and finishing class-test attempts, shared by the teacher and
 * student sides so both always see the same score.
 */
const TestAttempt = require('../models/TestAttempt');

// A few seconds' allowance for the network after the timer hits zero.
const GRACE_MS = 15_000;

/** Marks MCQs automatically; keeps any marks a teacher gave short answers. */
function scoreAttempt(test, attempt) {
  const byId = new Map(attempt.answers.map((a) => [String(a.questionId), a]));
  let score = 0;
  let needsMarking = false;
  for (const q of test.questions) {
    const a = byId.get(String(q._id));
    if (q.kind === 'MCQ') {
      const awarded = a && a.option !== undefined && a.option !== null && a.option === q.correctOption ? q.marks : 0;
      if (a) a.awarded = awarded;
      score += awarded;
    } else if (a && a.text && a.text.trim()) {
      if (a.awarded === undefined || a.awarded === null) needsMarking = true;
      else score += a.awarded;
    }
  }
  attempt.score = Math.round(score * 100) / 100;
  attempt.status = needsMarking ? 'SUBMITTED' : 'GRADED';
  return attempt;
}

/** Hands in an attempt: on request, or automatically once time is up. */
async function finalize(test, attempt, { auto = false } = {}) {
  if (attempt.status !== 'IN_PROGRESS') return attempt;
  attempt.submittedAt = auto ? attempt.deadline : new Date();
  attempt.autoSubmitted = auto;
  scoreAttempt(test, attempt);
  attempt.markModified('answers');
  await attempt.save();
  return attempt;
}

/** Any attempt whose time has run out is handed in with what was saved. */
async function finalizeExpired(test) {
  const expired = await TestAttempt.find({
    testId: test._id,
    status: 'IN_PROGRESS',
    deadline: { $lt: new Date(Date.now() - GRACE_MS) }
  });
  for (const attempt of expired) await finalize(test, attempt, { auto: true });
}

const isPastDeadline = (attempt) => Date.now() > new Date(attempt.deadline).getTime() + GRACE_MS;

module.exports = { scoreAttempt, finalize, finalizeExpired, isPastDeadline, GRACE_MS };
