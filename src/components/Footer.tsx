import { Heart } from 'lucide-react';
import { useI18n } from '../i18n';
import { links } from '../content';
import { InstagramIcon, WhatsAppIcon } from './ui';
import logoWhite from '../assets/brand/logo-white.svg';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-night px-5 pt-14 pb-24 text-white sm:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <img src={logoWhite} alt="Miss Leila — English for Kids" className="h-14 w-auto" />
        <p className="max-w-md text-white/70">{t.footer.tagline}</p>
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 font-bold">
          <Heart className="size-4 fill-berry-500 text-berry-500" />
          {t.about.quote}
        </p>
        <div className="flex gap-3">
          <a href={links.whatsapp()} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-[#25D366]">
            <WhatsAppIcon />
          </a>
          <a href={links.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-[#dd2a7b]">
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
