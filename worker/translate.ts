// Translates a parent's review between Persian and English with Workers AI (binding AI), so each side of the site
// can show every review. A chat model gives natural, warm wording; if it fails, the plain translation model is tried.
// Returns null when nothing worked: the review is then simply shown in its original language.

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
Do not add or remove anything. Keep emojis. Write people's names in the script of ${languageName[to]} (e.g. سارا ↔ Sara, آریا ↔ Aria).
"name" is who wrote it (e.g. "Sara, Ali's mum"), "child" is the child's name and age, possibly empty.
${from === 'en' ? 'Some parents write Persian in Latin letters ("Finglish", e.g. "kelas ha aali bood"); translate that from Persian too.\n' : ''}Reply with only a JSON object with the keys "name", "child" and "text".`;

type ChatResult = { response?: string | object; choices?: { message?: { content?: string | null } }[] };

const isFields = (v: unknown): v is Fields =>
  !!v &&
  typeof v === 'object' &&
  ['name', 'child', 'text'].every((k) => typeof (v as Record<string, unknown>)[k] === 'string');

async function withChatModel(ai: Ai, fields: Fields, from: Lang, to: Lang): Promise<Fields | null> {
  const res = (await ai.run(
    CHAT_MODEL as Parameters<Ai['run']>[0],
    {
      messages: [
        { role: 'system', content: prompt(from, to) },
        { role: 'user', content: JSON.stringify(fields) },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    } as never,
  )) as ChatResult;
  const raw = res.choices?.[0]?.message?.content ?? res.response;
  if (raw && typeof raw === 'object') return isFields(raw) ? raw : null;
  const match = raw?.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed: unknown = JSON.parse(match[0]);
  return isFields(parsed) ? parsed : null;
}

async function withFallbackModel(ai: Ai, fields: Fields, from: Lang, to: Lang): Promise<Fields> {
  const one = async (text: string) => {
    if (!text) return '';
    const res = (await ai.run(
      FALLBACK_MODEL as Parameters<Ai['run']>[0],
      {
        text,
        source_lang: from,
        target_lang: to,
      } as never,
    )) as { translated_text?: string };
    return res.translated_text?.trim() || text;
  };
  return { name: await one(fields.name), child: await one(fields.child), text: await one(fields.text) };
}

export async function translateReview(ai: Ai | undefined, fields: Fields, from: Lang): Promise<Fields | null> {
  if (!ai) return null;
  const to: Lang = from === 'fa' ? 'en' : 'fa';
  try {
    const result = await withChatModel(ai, fields, from, to);
    if (result && result.text.trim()) {
      return {
        name: result.name.trim() || fields.name,
        child: fields.child ? result.child.trim() : '',
        text: result.text.trim(),
      };
    }
  } catch (err) {
    console.error('translate (chat) failed', err);
  }
  try {
    return await withFallbackModel(ai, fields, from, to);
  } catch (err) {
    console.error('translate (fallback) failed', err);
    return null;
  }
}
