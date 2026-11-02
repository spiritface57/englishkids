import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  addProfile,
  avatars,
  MAX_PROFILES,
  removeProfile,
  switchProfile,
  updateProfile,
  useProfiles,
  type Profile,
} from '../profiles';

// "Who's playing?": choose, add, rename or remove the children who play on this device. Each child keeps their own
// stickers, best scores and streaks (stored only in this browser).

const text = {
  fa: {
    who: 'چه کسی بازی می‌کند؟',
    player: (n: number) => `بازیکن ${n.toLocaleString('fa')}`,
    add: 'بچه‌ی جدید',
    edit: 'ویرایش',
    name: 'اسم (برای گواهی‌نامه بهتر است انگلیسی باشد)',
    avatar: 'یک شکلک انتخاب کن',
    save: 'ذخیره',
    cancel: 'انصراف',
    remove: 'حذف این بچه',
    confirmRemove: (name: string) => `همه‌ی برچسب‌ها و امتیازهای «${name}» پاک شود؟`,
    note: 'پیشرفت هر بچه جدا و فقط روی همین دستگاه ذخیره می‌شود.',
  },
  en: {
    who: "Who's playing?",
    player: (n: number) => `Player ${n}`,
    add: 'Add a child',
    edit: 'Edit',
    name: 'Name',
    avatar: 'Choose an avatar',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Remove this child',
    confirmRemove: (name: string) => `Delete all of ${name}'s stickers and scores?`,
    note: "Each child's progress is saved separately, only on this device.",
  },
};

type Draft = { id: string | null; name: string; avatar: string }; // id null = a new child

export default function ProfileBar() {
  const { lang } = useI18n();
  const s = text[lang];
  const { profiles, active } = useProfiles();
  const [draft, setDraft] = useState<Draft | null>(null);

  const label = (p: Profile, i: number) => p.name || s.player(i + 1);
  const unusedAvatar = avatars.find((a) => !profiles.some((p) => p.avatar === a)) ?? avatars[0];

  const save = () => {
    if (!draft) return;
    if (draft.id === null) addProfile(draft.name, draft.avatar);
    else updateProfile(draft.id, { name: draft.name.trim(), avatar: draft.avatar });
    setDraft(null);
  };

  const remove = (p: Profile, i: number) => {
    if (!window.confirm(s.confirmRemove(label(p, i)))) return;
    removeProfile(p.id);
    setDraft(null);
  };

  return (
    <div className="px-5 pt-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border-4 border-surface bg-surface p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="me-1 font-black">{s.who}</span>
          {profiles.map((p, i) => {
            const isActive = p.id === active;
            return (
              <div key={p.id || 'first'} className="flex items-center">
                <motion.button
                  onClick={() => switchProfile(p.id)}
                  whileTap={{ scale: 0.95 }}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 rounded-full border-2 py-1.5 ps-1.5 pe-4 font-bold transition ${
                    isActive ? 'border-grape-500 bg-grape-50 text-grape-600' : 'border-ink/10 hover:border-grape-100'
                  }`}
                >
                  <span className="grid size-9 place-items-center rounded-full bg-cream text-2xl">{p.avatar}</span>
                  <span dir="auto">{label(p, i)}</span>
                </motion.button>
                {isActive && (
                  <button
                    onClick={() => setDraft({ id: p.id, name: p.name, avatar: p.avatar })}
                    aria-label={s.edit}
                    title={s.edit}
                    className="ms-1 grid size-9 place-items-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-grape-600"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
          {profiles.length < MAX_PROFILES && (
            <button
              onClick={() => setDraft({ id: null, name: '', avatar: unusedAvatar })}
              className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-ink/20 px-4 py-2.5 text-sm font-bold text-ink/60 transition hover:border-grape-500 hover:text-grape-600"
            >
              <Plus className="size-4" />
              {s.add}
            </button>
          )}
        </div>

        <AnimatePresence>
          {draft && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-ink/10 pt-4">
                <label className="block text-sm font-bold text-ink/70">
                  {s.name}
                  <input
                    dir="auto"
                    autoFocus
                    value={draft.name}
                    maxLength={30}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    className="mt-1 w-full max-w-sm rounded-2xl border-2 border-ink/10 bg-cream px-4 py-2.5 text-lg outline-none focus:border-grape-500"
                  />
                </label>
                <p className="mt-3 text-sm font-bold text-ink/70">{s.avatar}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {avatars.map((a) => (
                    <button
                      key={a}
                      onClick={() => setDraft({ ...draft, avatar: a })}
                      aria-pressed={draft.avatar === a}
                      className={`grid size-11 place-items-center rounded-full text-2xl transition ${
                        draft.avatar === a ? 'bg-grape-100 ring-2 ring-grape-500' : 'bg-cream hover:bg-grape-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={save}
                    className="inline-flex items-center gap-1.5 rounded-full bg-grape-500 px-5 py-2 font-bold text-white transition hover:-translate-y-0.5"
                  >
                    <Check className="size-4" />
                    {s.save}
                  </button>
                  <button
                    onClick={() => setDraft(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/10 px-5 py-2 font-bold transition hover:border-grape-500"
                  >
                    <X className="size-4" />
                    {s.cancel}
                  </button>
                  {draft.id && (
                    <button
                      onClick={() => {
                        const i = profiles.findIndex((p) => p.id === draft.id);
                        remove(profiles[i], i);
                      }}
                      className="ms-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-berry-500 hover:bg-berry-100"
                    >
                      <Trash2 className="size-4" />
                      {s.remove}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-3 text-xs text-ink/50">{s.note}</p>
      </div>
    </div>
  );
}
