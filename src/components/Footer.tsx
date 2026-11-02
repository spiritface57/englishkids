import { Heart } from 'lucide-react';
import { useI18n } from '../i18n';
import { links } from '../content';
import { InstagramIcon, WhatsAppIcon } from './ui';
import Logo from './Logo';
import { enabledSubPages, subPages } from '../navigation';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-night px-5 pt-14 pb-24 text-white sm:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <Logo onDark className="h-14" />
        <p className="max-w-md text-white/70">{t.footer.tagline}</p>
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 font-bold">
          <Heart className="size-4 fill-berry-500 text-berry-500" />
          {t.about.quote}
        </p>
        <nav aria-label={t.nav.pages} className="grid w-full max-w-xl gap-6 text-sm sm:grid-cols-2">
          {[
            {
              title: t.nav.pages,
              links: [
                { href: '/#top', label: t.nav.home },
                ...enabledSubPages.map((p) => ({ href: p as string, label: t.nav[subPages[p].navKey] })),
              ],
            },
            {
              title: t.nav.sections,
              links: (['about', 'classes', 'gallery', 'faq', 'contact'] as const).map((id) => ({
                href: `#${id}`,
                label: t.nav[id],
              })),
            },
          ].map((group) => (
            <div key={group.title}>
              <p className="mb-2 font-bold text-white/50">{group.title}</p>
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-white/80 transition hover:text-sun-500">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex gap-3">
          <a
            href={links.whatsapp()}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-[#25D366]"
          >
            <WhatsAppIcon />
          </a>
          <a
            href={links.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-[#dd2a7b]"
          >
            <InstagramIcon />
          </a>
        </div>
        <p className="text-sm text-white/50">
          © {new Date().getFullYear()} {t.about.name} — {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
