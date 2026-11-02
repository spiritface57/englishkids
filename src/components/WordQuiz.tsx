import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Delete, Flame, RotateCcw, Smile, Timer, Trophy, Volume2, X } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Word } from '../data/words';
import { canSpeak, shuffle, speak } from './wordGame';
import { awardSticker } from '../progress';
import { kidStorage } from '../profiles';

// Quiz over the selected word topic, 10 questions, two levels:
// - easy: picture → word, word → Persian meaning, listen → word (multiple choice)
// - hard: fill the blank in a sentence, Persian → English with look-alike options, and spelling with letter tiles
//   (from a picture/meaning or by ear), with a 20-second timer per question.
// Points: easy 10 per right answer (+5 from the 3rd in a row); hard 20 + seconds left (+10 from the 3rd in a row).
// The best score per level is kept per child profile (see src/profiles.ts).

const HARD_SECONDS = 20;
const TIMEOUT = '\u0000timeout';

type Level = 'easy' | 'hard';
type Kind = 'picture' | 'meaning' | 'listen' | 'blank' | 'reverse' | 'spell' | 'spellListen';
type Tile = { id: number; ch: string };
type Question = {
  kind: Kind;
  word: Word;
  answer: string;
  options: string[];
  tiles: Tile[];
  gap: [string, string] | null;
};

// The 10 questions of each level by type (shuffled per quiz).
const plan: Record<Level, Kind[]> = {
  easy: ['picture', 'picture', 'picture', 'picture', 'meaning', 'meaning', 'meaning', 'listen', 'listen', 'listen'],
  hard: ['blank', 'blank', 'blank', 'reverse', 'reverse', 'spell', 'spell', 'spell', 'spellListen', 'spellListen'],
};

const isSpelling = (k: Kind) => k === 'spell' || k === 'spellListen';
const spellable = (w: Word) => /^[a-z]{3,9}$/i.test(w.en);

// The example sentence split around the word, e.g. ["The cat can ", " the tree."].
const gapOf = (w: Word): [string, string] | null => {
  const m = new RegExp(`\\b${w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').exec(w.s);
  return m ? [w.s.slice(0, m.index), w.s.slice(m.index + m[0].length)] : null;
};

// Which words can be used for each question type (pictures only for words with their own emoji).
const fits: Record<Kind, (w: Word) => boolean> = {
  picture: (w) => !!w.e,
  meaning: () => true,
  listen: () => canSpeak,
  blank: (w) => gapOf(w) !== null,
  reverse: () => true,
  spell: spellable,
  spellListen: (w) => canSpeak && spellable(w),
};

// Wrong options. Hard questions prefer look-alikes: same topic, same first letter, similar length.
function distractors(kind: Kind, word: Word, source: Word[]) {
  const text = (w: Word) => (kind === 'meaning' ? w.fa : w.en);
  const likeness = (w: Word) =>
    (w.c === word.c ? 2 : 0) +
    (kind === 'reverse' && w.en[0].toLowerCase() === word.en[0].toLowerCase() ? 2 : 0) +
    (kind === 'reverse' && Math.abs(w.en.length - word.en.length) <= 1 ? 1 : 0);
  const candidates = shuffle(source).sort((a, b) => likeness(b) - likeness(a));
  const options = [text(word)];
  for (const w of candidates) {
    if (options.length === 4) break;
    const t = text(w);
    if (options.some((o) => o.toLowerCase() === t.toLowerCase())) continue;
    if (kind === 'picture' && w.e === word.e) continue;
    if (kind === 'blank' && word.s.toLowerCase().includes(t.toLowerCase())) continue;
    options.push(t);
  }
  return shuffle(options);
}

// The word's letters plus two decoys, shuffled.
const tilesFor = (w: Word): Tile[] => {
  const decoys = Array.from({ length: 2 }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
  return shuffle([...w.en.toLowerCase(), ...decoys]).map((ch, id) => ({ id, ch }));
};

function buildQuiz(pool: Word[], all: Word[], level: Level): Question[] {
  const source = pool.length >= 12 ? pool : all;
  const order = shuffle(source);
  const used = new Set<Word>();
  return shuffle(plan[level]).map((planned) => {
    let kind = planned;
    let word = order.find((w) => !used.has(w) && fits[kind](w));
    if (!word) {
      kind = level === 'easy' ? 'meaning' : 'reverse';
      word = order.find((w) => !used.has(w))!;
    }
    used.add(word);
    const spelling = isSpelling(kind);
    return {
      kind,
      word,
      answer: kind === 'meaning' ? word.fa : spelling ? word.en.toLowerCase() : word.en,
      options: spelling ? [] : distractors(kind, word, source),
      tiles: spelling ? tilesFor(word) : [],
      gap: kind === 'blank' ? gapOf(word) : null,
    };
  });
}

const bestKey = (level: Level) => `wordQuizBest-${level}`;
const readBest = (level: Level) => Number(kidStorage.getItem(bestKey(level)) ?? 0) || 0;

export default function WordQuiz({ pool, all }: { pool: Word[]; all: Word[] }) {
  const { t } = useI18n();
  const p = t.play;
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [level, setLevel] = useState<Level>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [built, setBuilt] = useState<Tile[]>([]);
  const [timeLeft, setTimeLeft] = useState(HARD_SECONDS);
  const [points, setPoints] = useState(0);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missed, setMissed] = useState<Word[]>([]);
  const [newBest, setNewBest] = useState(false);

  const q = questions[index];
  const answered = picked !== null;
  const isRight = picked !== null && picked.toLowerCase() === q.answer.toLowerCase();
  const hard = level === 'hard';

  // A new topic chosen above starts over from the intro.
  useEffect(() => setPhase('intro'), [pool]);

  // Listening questions say the word as soon as they appear.
  useEffect(() => {
    if (phase === 'playing' && (q?.kind === 'listen' || q?.kind === 'spellListen')) speak(q.word.en);
  }, [phase, q]);

  const choose = (option: string) => {
    if (answered) return;
    setPicked(option);
    if (q.kind !== 'listen' && q.kind !== 'spellListen') speak(q.word.en);
    if (option.toLowerCase() === q.answer.toLowerCase()) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setRight((r) => r + 1);
      setPoints((s) => s + (hard ? 20 + timeLeft + (nextStreak >= 3 ? 10 : 0) : 10 + (nextStreak >= 3 ? 5 : 0)));
    } else {
      setStreak(0);
      setMissed((m) => [...m, q.word]);
    }
  };

  // Hard level: one second at a time; running out counts as a wrong answer.
  useEffect(() => {
    if (phase !== 'playing' || !hard || answered) return;
    if (timeLeft <= 0) {
      choose(TIMEOUT);
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, hard, answered, timeLeft, index]);

  const addTile = (tile: Tile) => {
    if (answered || built.includes(tile)) return;
    const next = [...built, tile];
    setBuilt(next);
    if (next.length === q.answer.length) choose(next.map((x) => x.ch).join(''));
  };
  const erase = () => !answered && setBuilt((b) => b.slice(0, -1));

  // Spelling questions can also be typed on a keyboard.
  useEffect(() => {
    if (phase !== 'playing' || !q || !isSpelling(q.kind) || answered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        erase();
        return;
      }
      if (!/^[a-z]$/i.test(e.key)) return;
      const tile = q.tiles.find((x) => x.ch === e.key.toLowerCase() && !built.includes(x));
      if (tile) addTile(tile);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const start = (lvl = level) => {
    setLevel(lvl);
    setQuestions(buildQuiz(pool, all, lvl));
    setIndex(0);
    setPicked(null);
    setBuilt([]);
    setTimeLeft(HARD_SECONDS);
    setPoints(0);
    setRight(0);
    setStreak(0);
    setMissed([]);
    setNewBest(false);
    setPhase('playing');
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setBuilt([]);
      setTimeLeft(HARD_SECONDS);
      return;
    }
    awardSticker('quiz-first');
    if (right === questions.length) awardSticker('quiz-perfect');
    if (hard && right >= 7) awardSticker('quiz-hard');
    if (points > readBest(level)) {
      kidStorage.setItem(bestKey(level), String(points));
      setNewBest(true);
    }
    setPhase('result');
  };

  const card = 'mx-auto max-w-2xl rounded-[2rem] border-4 border-surface bg-surface p-6 shadow-soft sm:p-8';
  const primaryBtn =
    'inline-flex items-center gap-2 rounded-full bg-grape-500 font-bold text-white shadow-soft transition hover:-translate-y-0.5';

  if (phase === 'intro') {
    const levels = [
      { key: 'easy' as const, label: p.levelEasy, hint: p.levelEasyHint, Icon: Smile },
      { key: 'hard' as const, label: p.levelHard, hint: p.levelHardHint, Icon: Flame },
    ];
    return (
      <div className={`${card} text-center`}>
        <div className="text-6xl">🏆</div>
        <p className="mt-4 text-lg font-bold">{p.quizIntro}</p>
        <p className="mt-6 text-sm font-bold text-ink/60">{p.chooseLevel}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {levels.map(({ key, label, hint, Icon }) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              aria-pressed={level === key}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition ${
                level === key ? 'border-grape-500 bg-grape-50' : 'border-ink/10 hover:border-grape-100'
              }`}
            >
              <Icon className={`size-7 ${key === 'hard' ? 'text-berry-500' : 'text-leaf-600'}`} />
              <span className="text-lg font-black">{label}</span>
              <span className="text-sm text-ink/60">{hint}</span>
              {readBest(key) > 0 && (
                <span className="mt-1 text-xs font-bold text-grape-600">{p.best(readBest(key))}</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => start()} className={`mt-6 px-7 py-3 text-lg ${primaryBtn}`}>
          {p.quizStart}
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    const ratio = right / questions.length;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const message = p.resultMessages[ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${card} text-center`}
      >
        <p className="text-sm font-bold text-ink/60">{hard ? p.levelHard : p.levelEasy}</p>
        <div className="mt-2 flex justify-center gap-2 text-5xl" aria-label={`${stars}/3`}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
              className={i < stars ? '' : 'opacity-20 grayscale'}
            >
              ⭐
            </motion.span>
          ))}
        </div>
        <p className="mt-4 font-display text-4xl font-black text-grape-600">{p.resultScore(right, questions.length)}</p>
        <p className="mt-1 font-bold text-ink/70">{p.points(points)}</p>
        <p className="mt-3 text-lg font-bold">{message}</p>
        <p className="mt-2 text-sm font-bold text-grape-600">{newBest ? p.newBest : p.best(readBest(level))}</p>

        {missed.length > 0 && (
          <div className="mt-6 text-start">
            <p className="mb-2 text-sm font-bold text-ink/60">{p.review}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {missed.map((w) => (
                <li key={w.en}>
                  <button
                    onClick={() => speak(w.en)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-grape-50 px-3 py-2 text-start transition hover:bg-grape-100"
                  >
                    <span className="text-2xl">{w.e || '🔤'}</span>
                    <span className="flex-1">
                      <span dir="ltr" className="block font-display font-bold">
                        {w.en}
                      </span>
                      <span dir="rtl" className="block text-sm text-ink/70">
                        {w.fa}
                      </span>
                    </span>
                    <Volume2 className="size-4 text-grape-600" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => start()} className={`px-7 py-3 ${primaryBtn}`}>
            <RotateCcw className="size-4" />
            {p.again}
          </button>
          <button
            onClick={() => setPhase('intro')}
            className="rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-grape-500"
          >
            {p.changeLevel}
          </button>
        </div>
      </motion.div>
    );
  }

  const prompts: Record<Kind, string> = {
    picture: p.qPicture,
    meaning: p.qMeaning,
    listen: p.qListen,
    blank: p.qBlank,
    reverse: p.qReverse,
    spell: p.qSpell,
    spellListen: p.qSpellListen,
  };
  const speaker = (
    <button
      onClick={() => speak(q.word.en)}
      aria-label={p.playAgainSound}
      className="grid size-24 place-items-center rounded-full bg-sun-500 text-night shadow-soft transition hover:scale-105"
    >
      <Volume2 className="size-11" />
    </button>
  );

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span className="text-ink/60">{p.question(index + 1, questions.length)}</span>
        <div className="flex items-center gap-2">
          {hard && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                timeLeft <= 5 && !answered ? 'animate-pulse bg-berry-100 text-berry-500' : 'bg-sun-100 text-sun-700'
              }`}
            >
              <Timer className="size-4" />
              {p.timeLeft(timeLeft)}
            </span>
          )}
          <span className="rounded-full bg-grape-100 px-3 py-1 text-grape-600">{p.points(points)}</span>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-grape-50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-sun-500 to-grape-500"
          animate={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <p className="mt-6 text-center text-lg font-bold">{prompts[q.kind]}</p>

          <div className="mt-4 flex min-h-28 items-center justify-center text-center">
            {q.kind === 'picture' && <span className="text-7xl sm:text-8xl">{q.word.e}</span>}
            {q.kind === 'meaning' && (
              <button
                onClick={() => speak(q.word.en)}
                dir="ltr"
                className="inline-flex items-center gap-3 font-display text-4xl font-bold text-leaf-700 sm:text-5xl"
              >
                {q.word.en}
                <Volume2 className="size-6 text-grape-500" />
              </button>
            )}
            {(q.kind === 'listen' || q.kind === 'spellListen') && speaker}
            {q.kind === 'reverse' && (
              <span dir="rtl" className="text-4xl font-black sm:text-5xl">
                {q.word.fa}
              </span>
            )}
            {q.kind === 'spell' &&
              (q.word.e ? (
                <span className="text-7xl sm:text-8xl">{q.word.e}</span>
              ) : (
                <span dir="rtl" className="text-4xl font-black sm:text-5xl">
                  {q.word.fa}
                </span>
              ))}
            {q.kind === 'blank' && q.gap && (
              <p dir="ltr" className="font-display text-2xl leading-relaxed font-bold sm:text-3xl">
                {q.gap[0]}
                <span
                  className={`mx-1 inline-block min-w-20 border-b-4 px-1 ${
                    !answered
                      ? 'border-grape-500'
                      : isRight
                        ? 'border-leaf-500 text-leaf-700'
                        : 'border-berry-500 text-berry-500'
                  }`}
                >
                  {answered ? q.word.en : ' '}
                </span>
                {q.gap[1]}
              </p>
            )}
          </div>

          {isSpelling(q.kind) ? (
            <div className="mt-6" dir="ltr">
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: q.answer.length }).map((_, i) => (
                  <span
                    key={i}
                    className={`grid size-11 place-items-center rounded-xl border-2 font-display text-2xl font-bold uppercase sm:size-12 ${
                      !answered
                        ? built[i]
                          ? 'border-grape-500 bg-grape-50'
                          : 'border-dashed border-ink/20'
                        : isRight
                          ? 'border-leaf-500 bg-leaf-100 text-leaf-700'
                          : 'border-berry-500 bg-berry-100 text-berry-500'
                    }`}
                  >
                    {built[i]?.ch}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {q.tiles.map((tile) => {
                  const usedTile = built.includes(tile);
                  return (
                    <motion.button
                      key={tile.id}
                      onClick={() => addTile(tile)}
                      disabled={answered || usedTile}
                      whileTap={{ scale: 0.9 }}
                      className={`grid size-12 place-items-center rounded-xl bg-sun-100 font-display text-2xl font-bold text-ink uppercase shadow-sm transition sm:size-14 ${
                        usedTile ? 'opacity-25' : answered ? 'opacity-50' : 'hover:-translate-y-0.5 hover:bg-sun-400'
                      }`}
                    >
                      {tile.ch}
                    </motion.button>
                  );
                })}
                {!answered && (
                  <button
                    onClick={erase}
                    disabled={built.length === 0}
                    aria-label={p.erase}
                    title={p.erase}
                    className="grid size-12 place-items-center rounded-xl bg-ink/5 text-ink/60 transition hover:bg-ink/10 disabled:opacity-30 sm:size-14"
                  >
                    <Delete className="size-6" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {q.options.map((o) => {
                const isAnswer = o === q.answer;
                const state = !answered
                  ? 'border-ink/10 bg-cream hover:border-grape-500'
                  : isAnswer
                    ? 'border-leaf-500 bg-leaf-100 text-leaf-700'
                    : o === picked
                      ? 'border-berry-500 bg-berry-100 text-berry-500'
                      : 'border-ink/10 bg-cream opacity-50';
                return (
                  <motion.button
                    key={o}
                    onClick={() => choose(o)}
                    disabled={answered}
                    whileTap={answered ? undefined : { scale: 0.96 }}
                    animate={answered && o === picked && !isAnswer ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
                    dir={q.kind === 'meaning' ? 'rtl' : 'ltr'}
                    className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-center text-lg font-bold transition ${q.kind === 'meaning' ? '' : 'font-display'} ${state}`}
                  >
                    {answered && isAnswer && <Check className="size-5 shrink-0" />}
                    {answered && o === picked && !isAnswer && <X className="size-5 shrink-0" />}
                    {o}
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-3">
            <p className={`font-bold ${isRight ? 'text-leaf-700' : 'text-berry-500'}`} role="status">
              {answered &&
                (isRight ? (
                  <>
                    {p.correct}
                    {streak >= 3 && <span className="ms-2 text-sun-700">{p.streak(streak)}</span>}
                  </>
                ) : (
                  <>
                    {picked === TIMEOUT && <span className="me-2">{p.timeUp}</span>}
                    {p.wrong}{' '}
                    <span dir="ltr" className="font-display">
                      {q.word.en}
                    </span>{' '}
                    = <span dir="rtl">{q.word.fa}</span>
                  </>
                ))}
            </p>
            {answered && (
              <button onClick={next} className={`px-6 py-2.5 ${primaryBtn}`}>
                {index + 1 < questions.length ? p.next : p.finish}
                {index + 1 >= questions.length && <Trophy className="size-4" />}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
