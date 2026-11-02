import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Download, ImagePlus, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { Section, SectionHeading } from '../components/ui';
import logoSvg from '../assets/brand/logo.svg?raw';
import logoWhiteSvg from '../assets/brand/logo-white.svg?raw';
import badgeSvg from '../assets/brand/logo-badge.svg?raw';
import markSvg from '../assets/brand/mark.svg?raw';
import markWhiteSvg from '../assets/brand/mark-white.svg?raw';

// /brand: the logo stamper. Put the logo on photos (posts, stories, worksheets…) and download them at full
// resolution. Everything happens in the browser; photos are never uploaded. Not linked from the site's menus.

type Style = 'badge' | 'logo' | 'logoWhite' | 'mark' | 'markWhite';
type Pos = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
type Settings = { style: Style; pos: Pos; size: number; margin: number; opacity: number };
type Photo = { id: number; name: string; type: string; img: HTMLImageElement };

const sources: Record<Style, string> = {
  badge: badgeSvg,
  logo: logoSvg,
  logoWhite: logoWhiteSvg,
  mark: markSvg,
  markWhite: markWhiteSvg,
};

const positions: Pos[] = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
const defaults: Settings = { style: 'badge', pos: 'br', size: 30, margin: 4, opacity: 100 };
const SETTINGS_KEY = 'logoStamper';
const MAX_SIDE = 6000; // keeps very large photos within what canvases allow on phones

const text = {
  fa: {
    eyebrow: 'ابزار برند',
    title: 'لوگو را روی تصویرهایتان بگذارید',
    lead: 'عکس پست، استوری، کاربرگ یا هر تصویر دیگری را انتخاب کنید، جای لوگو را تنظیم کنید و دانلود کنید.',
    pick: 'انتخاب تصویر',
    drop: 'یا تصویرها را اینجا رها کنید',
    privacy: 'تصویرها فقط در مرورگر خودتان پردازش می‌شوند و جایی آپلود نمی‌شوند.',
    style: 'نوع لوگو',
    styles: {
      badge: 'لوگو با کادر سفید',
      logo: 'لوگوی رنگی',
      logoWhite: 'لوگوی سفید',
      mark: 'نشانه‌ی رنگی',
      markWhite: 'نشانه‌ی سفید',
    },
    pos: 'جای لوگو',
    size: 'اندازه',
    margin: 'فاصله از لبه',
    opacity: 'شفافیت',
    download: 'دانلود این تصویر',
    downloadAll: (n: number) => `دانلود همه (${n.toLocaleString('fa')})`,
    remove: 'حذف',
    empty: 'هنوز تصویری انتخاب نشده است.',
    heicNote: 'اگر عکس آیفون (HEIC) باز نشد، آن را در گالری به JPG تبدیل کنید یا با سافاری باز کنید.',
    tip: 'نکته: روی عکس‌های تیره «لوگوی سفید» و روی عکس‌های شلوغ «لوگو با کادر سفید» بهتر دیده می‌شود.',
  },
  en: {
    eyebrow: 'Brand tool',
    title: 'Put the logo on your images',
    lead: 'Choose a post photo, story, worksheet or any image, place the logo and download it.',
    pick: 'Choose images',
    drop: 'or drop images here',
    privacy: 'Images are processed only in your browser and are never uploaded.',
    style: 'Logo style',
    styles: {
      badge: 'Logo on white badge',
      logo: 'Colour logo',
      logoWhite: 'White logo',
      mark: 'Colour icon',
      markWhite: 'White icon',
    },
    pos: 'Position',
    size: 'Size',
    margin: 'Margin',
    opacity: 'Opacity',
    download: 'Download this image',
    downloadAll: (n: number) => `Download all (${n})`,
    remove: 'Remove',
    empty: 'No image chosen yet.',
    heicNote: "If an iPhone photo (HEIC) doesn't open, convert it to JPG first or use Safari.",
    tip: 'Tip: use the white logo on dark photos and the white badge on busy photos.',
  },
};

// Loads an SVG string as an image with an explicit size (from its viewBox), so every browser draws it crisply.
const loadSvg = (svg: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const [, , w, h] = /viewBox="([\d.-]+) ([\d.-]+) ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);
    const sized = svg.replace('<svg ', `<svg width="${w * 4}" height="${h * 4}" `);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  });

const loadPhoto = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

// Draws the photo with the logo on a canvas of the photo's own size (capped at MAX_SIDE).
function render(canvas: HTMLCanvasElement, photo: HTMLImageElement, logo: HTMLImageElement, s: Settings) {
  const scale = Math.min(1, MAX_SIDE / Math.max(photo.naturalWidth, photo.naturalHeight));
  const W = Math.round(photo.naturalWidth * scale);
  const H = Math.round(photo.naturalHeight * scale);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(photo, 0, 0, W, H);

  // Size and margin are relative to the shorter side, so the logo looks the same on square, tall and wide images.
  const base = Math.min(W, H);
  const aspect = logo.naturalWidth / logo.naturalHeight;
  let lw = (base * s.size) / 100;
  let lh = lw / aspect;
  if (lh > H * 0.9) {
    lh = H * 0.9;
    lw = lh * aspect;
  }
  const m = (base * s.margin) / 100;
  const col = s.pos[1];
  const row = s.pos[0];
  const x = col === 'l' ? m : col === 'r' ? W - lw - m : (W - lw) / 2;
  const y = row === 't' ? m : row === 'b' ? H - lh - m : (H - lh) / 2;
  ctx.globalAlpha = s.opacity / 100;
  ctx.drawImage(logo, x, y, lw, lh);
  ctx.globalAlpha = 1;
}

const outputType = (type: string) => (type === 'image/png' ? 'image/png' : 'image/jpeg');
const outputName = (name: string, type: string) =>
  `${name.replace(/\.[^.]+$/, '')}-englishkids.${outputType(type) === 'image/png' ? 'png' : 'jpg'}`;

export default function BrandPage() {
  const { lang } = useI18n();
  const s = text[lang];
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
    } catch {
      return defaults;
    }
  });
  const [logos, setLogos] = useState<Partial<Record<Style, HTMLImageElement>>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(1);

  // Search engines: this tool page should not be listed.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    Promise.all((Object.keys(sources) as Style[]).map(async (k) => [k, await loadSvg(sources[k])] as const)).then(
      (entries) => setLogos(Object.fromEntries(entries)),
    );
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const photo = photos[Math.min(selected, photos.length - 1)];
  const logo = logos[settings.style];

  useEffect(() => {
    if (photo && logo && canvasRef.current) render(canvasRef.current, photo.img, logo, settings);
  }, [photo, logo, settings]);

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    const loaded: Photo[] = [];
    for (const f of list) {
      try {
        loaded.push({ id: nextId.current++, name: f.name, type: f.type, img: await loadPhoto(f) });
      } catch {
        // unreadable (e.g. HEIC outside Safari): skipped; the note below explains it
      }
    }
    if (!loaded.length) return;
    setPhotos((p) => [...p, ...loaded]);
    setSelected(photos.length);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const save = (p: Photo) =>
    new Promise<void>((resolve) => {
      if (!logo) return resolve();
      const canvas = document.createElement('canvas');
      render(canvas, p.img, logo, settings);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = outputName(p.name, p.type);
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
          }
          resolve();
        },
        outputType(p.type),
        0.92,
      );
    });

  const saveAll = async () => {
    setBusy(true);
    for (const p of photos) {
      await save(p);
      await new Promise((r) => setTimeout(r, 400)); // browsers block many downloads fired at once
    }
    setBusy(false);
  };

  const remove = (id: number) => {
    setPhotos((p) => p.filter((x) => x.id !== id));
    setSelected(0);
  };

  const slider = (label: string, key: 'size' | 'margin' | 'opacity', min: number, max: number) => (
    <label className="block">
      <span className="flex justify-between text-sm font-bold text-ink/70">
        {label}
        <span dir="ltr">{settings[key]}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={settings[key]}
        onChange={(e) => update({ [key]: Number(e.target.value) })}
        className="mt-1 w-full accent-grape-500"
      />
    </label>
  );

  return (
    <div className="pt-16">
      <Section>
        <SectionHeading eyebrow={s.eyebrow} title={s.title} lead={s.lead} tone="leaf" />

        <div className="mt-10 grid gap-6 lg:grid-cols-[20rem_1fr]">
          <div className="space-y-5 rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-grape-500 px-5 py-3 font-bold text-white shadow-soft transition hover:-translate-y-0.5">
              <ImagePlus className="size-5" />
              {s.pick}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-bold text-ink/70">{s.style}</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(sources) as Style[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => update({ style: k })}
                    aria-pressed={settings.style === k}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-bold transition ${
                      settings.style === k ? 'border-grape-500 bg-grape-50' : 'border-ink/10 hover:border-grape-100'
                    }`}
                  >
                    <span
                      className={`grid h-10 w-full place-items-center rounded-xl ${k.endsWith('White') ? 'bg-night' : 'bg-cream'}`}
                    >
                      <img src={logos[k]?.src} alt="" className="max-h-8 max-w-[90%]" />
                    </span>
                    {s.styles[k]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-ink/70">{s.pos}</p>
              <div dir="ltr" className="mx-auto grid w-32 grid-cols-3 gap-1.5">
                {positions.map((p) => (
                  <button
                    key={p}
                    onClick={() => update({ pos: p })}
                    aria-label={p}
                    aria-pressed={settings.pos === p}
                    className={`aspect-square rounded-lg border-2 transition ${
                      settings.pos === p
                        ? 'border-grape-500 bg-grape-500'
                        : 'border-ink/10 bg-cream hover:border-grape-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            {slider(s.size, 'size', 8, 80)}
            {slider(s.margin, 'margin', 0, 15)}
            {slider(s.opacity, 'opacity', 20, 100)}

            <p className="text-xs leading-6 text-ink/60">{s.tip}</p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex min-h-80 flex-col gap-4 rounded-[2rem] border-4 border-dashed p-4 transition ${
              dragging ? 'border-grape-500 bg-grape-50' : 'border-ink/10 bg-surface'
            }`}
          >
            {photo ? (
              <>
                <canvas ref={canvasRef} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-2xl shadow-soft" />
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => save(photo)}
                    className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-6 py-3 font-bold text-white shadow-soft transition hover:-translate-y-0.5"
                  >
                    <Download className="size-5" />
                    {s.download}
                  </button>
                  {photos.length > 1 && (
                    <button
                      onClick={saveAll}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-grape-500 disabled:opacity-60"
                    >
                      <Download className="size-5" />
                      {s.downloadAll(photos.length)}
                    </button>
                  )}
                </div>
                {photos.length > 1 && (
                  <ul className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                      <li key={p.id} className="relative shrink-0">
                        <button
                          onClick={() => setSelected(i)}
                          className={`block overflow-hidden rounded-xl border-4 ${p === photo ? 'border-grape-500' : 'border-transparent'}`}
                        >
                          <img src={p.img.src} alt={p.name} className="size-20 object-cover" />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          aria-label={s.remove}
                          className="absolute -end-1 -top-1 grid size-7 place-items-center rounded-full bg-surface text-berry-500 shadow-soft"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="m-auto text-center text-ink/60">
                <ImagePlus className="mx-auto size-12 text-ink/30" />
                <p className="mt-3 font-bold">{s.empty}</p>
                <p className="mt-1 text-sm">{s.drop}</p>
              </div>
            )}
            <p className="mt-auto text-center text-xs text-ink/50">
              {s.privacy} {s.heicNote}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
