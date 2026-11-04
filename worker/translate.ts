// Translates a parent's review between Persian and English with Workers AI (binding AI), so each side of the site
// can show every review. A chat model gives natural, warm wording; if it fails, the plain translation model is tried.
// Returns null when nothing worked: the review is then simply shown in its original language.
//
// Names get their own request that only writes them by sound (علیمردانی → Alimardani, never a word meaning),
// since a translation prompt once turned that surname into "knowledge". If the answer doesn't look like the
// target script, the names stay as typed and only the child's age is converted, by fixed rules.

export type Lang = 'fa' | 'en';
export type Fields = { name: string; child: string; text: string };

const CHAT_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const FALLBACK_MODEL = '@cf/meta/m2m100-1.2b';

// Persian/Arabic letters mean Persian; anything else is treated as English.
export const detectLang = (s: string): Lang => (/[؀-ۿ]/.test(s) ? 'fa' : 'en');

const languageName = { fa: 'Persian (Farsi)', en: 'English' };

const prompt = (from: Lang, to: Lang) =>
  `You translate parents' reviews of Miss Leila, a children's English teacher, from ${languageName[from]} to ${languageName[to]}.
Keep the meaning, warmth and conversational tone; write it the way a parent would naturally say it in ${languageName[to]}.
Do not add or remove anything. Keep emojis. People's names are never translated into words: keep their sound (e.g. میس لیلا ↔ Miss Leila).
${from === 'en' ? 'Some parents write Persian in Latin letters ("Finglish", e.g. "kelas ha aali bood"); translate that from Persian too.\n' : ''}Reply with only a JSON object with the key "text".`;

const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d))).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
const toPersianDigits = (s: string) => s.replace(/\d/g, (d) => faDigits[Number(d)]);

// "شایان - ۸ ساله" → "شایان - 8 years old"; "Ali, 7 years old" → "Ali, ۷ ساله". Names stay as written.
export function translateChild(child: string, to: Lang) {
  if (!child) return '';
  if (to === 'en') {
    return toLatinDigits(child)
      .replace(/(\d+)\s*(ساله|سالش|سال)/g, '$1 years old')
      .replace(/\s+و\s+/g, ' & ');
  }
  return toPersianDigits(
    child.replace(/(\d+)\s*(-?\s*years?[\s-]*old|yrs?|y\/?o|years?)\b/gi, '$1 ساله').replace(/\s+(and|&)\s+/gi, ' و '),
  );
}

const namesPrompt = (from: Lang, to: Lang) =>
  `You write people's names from ${languageName[from]} in ${languageName[to]} script, by how they sound.
Names are NEVER translated into words, even when they look like ordinary words: transliterate them.
Examples: علیمردانی → Alimardani, شایان → Shayan, دانش → Danesh, سمیه → Somayeh, آریا → Aria, Sarah → سارا, Leo → لئو.
Only relationship words and ages are translated: مادر → mum, پدر → dad, "۸ ساله" → "8 years old" (and back).
"name" is who wrote the review (e.g. "سارا، مادر علی" → "Sara, Ali's mum"); "child" is the child's name and age, possibly empty.
Keep punctuation and order. Reply with only a JSON object with the keys "name" and "child".`;

const persianLetters = /[\u0600-\u06FF]/;
// Looks like the target script: Persian letters for Persian, none of them for English.
const inScript = (s: string, to: Lang) =>
  to === 'fa' ? persianLetters.test(s) || !/[a-z]/i.test(s) : !persianLetters.test(s);

async function transliterateNames(ai: Ai, fields: Fields, from: Lang, to: Lang) {
  const kept = { name: fields.name, child: translateChild(fields.child, to) };
  try {
    const res = (await ai.run(
      CHAT_MODEL as Parameters<Ai['run']>[0],
      {
        messages: [
          { role: 'system', content: namesPrompt(from, to) },
          { role: 'user', content: JSON.stringify({ name: fields.name, child: fields.child }) },
        ],
        max_tokens: 200,
        temperature: 0,
      } as never,
    )) as ChatResult;
    const raw = res.choices?.[0]?.message?.content ?? res.response;
    const parsed: unknown = raw && typeof raw === 'object' ? raw : JSON.parse(raw?.match(/\{[\s\S]*\}/)?.[0] ?? 'null');
    if (!parsed || typeof parsed !== 'object') return kept;
    const { name, child } = parsed as { name?: unknown; child?: unknown };
    const good = (v: unknown, max: number): v is string =>
      typeof v === 'string' && !!v.trim() && v.length <= max && inScript(v, to);
    return {
      name: good(name, 80) ? name.trim() : kept.name,
      child: !fields.child ? '' : good(child, 60) ? translateChild(child.trim(), to) : kept.child,
    };
  } catch (err) {
    console.error('transliterate names failed', err);
    return kept;
  }
}

type ChatResult = { response?: string | object; choices?: { message?: { content?: string | null } }[] };

const textOf = (v: unknown) =>
  v && typeof v === 'object' && typeof (v as { text?: unknown }).text === 'string'
    ? (v as { text: string }).text
    : null;

async function withChatModel(ai: Ai, text: string, from: Lang, to: Lang): Promise<string | null> {
  const res = (await ai.run(
    CHAT_MODEL as Parameters<Ai['run']>[0],
    {
      messages: [
        { role: 'system', content: prompt(from, to) },
        { role: 'user', content: JSON.stringify({ text }) },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    } as never,
  )) as ChatResult;
  const raw = res.choices?.[0]?.message?.content ?? res.response;
  if (raw && typeof raw === 'object') return textOf(raw);
  const match = raw?.match(/\{[\s\S]*\}/);
  return match ? textOf(JSON.parse(match[0])) : null;
}

async function withFallbackModel(ai: Ai, text: string, from: Lang, to: Lang): Promise<string> {
  const res = (await ai.run(
    FALLBACK_MODEL as Parameters<Ai['run']>[0],
    { text, source_lang: from, target_lang: to } as never,
  )) as { translated_text?: string };
  return res.translated_text?.trim() || text;
}

export async function translateReview(ai: Ai | undefined, fields: Fields, from: Lang): Promise<Fields | null> {
  if (!ai) return null;
  const to: Lang = from === 'fa' ? 'en' : 'fa';
  const names = transliterateNames(ai, fields, from, to); // runs alongside the text translation
  const done = async (text: string): Promise<Fields> => ({ ...(await names), text });
  try {
    const text = await withChatModel(ai, fields.text, from, to);
    if (text?.trim()) return await done(text.trim());
  } catch (err) {
    console.error('translate (chat) failed', err);
  }
  try {
    return await done(await withFallbackModel(ai, fields.text, from, to));
  } catch (err) {
    console.error('translate (fallback) failed', err);
    return null;
  }
}
