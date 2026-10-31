import { motion } from 'motion/react';
import { Phone } from 'lucide-react';
import { useI18n } from '../i18n';
import { contact, links } from '../content';
import { InstagramIcon, Reveal, Section, SectionHeading, WhatsAppIcon } from './ui';

export default function Contact() {
  const { t } = useI18n();
  const c = t.contactSection;
  const cards = [
    {
      href: links.whatsapp(c.waDefault),
      title: c.whatsapp,
      value: contact.phoneDisplay,
      text: c.whatsappText,
      icon: <WhatsAppIcon className="size-8" />,
      tone: 'bg-[#25D366]',
      external: true,
    },
    {
      href: links.instagram,
      title: c.instagram,
      value: `@${contact.instagram}`,
      text: c.instagramText,
      icon: <InstagramIcon className="size-8" />,
      tone: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]',
      external: true,
    },
    {
      href: links.tel,
      title: c.call,
      value: contact.phoneDisplay,
      text: '',
      icon: <Phone className="size-8" />,
      tone: 'bg-sun-500 !text-night',
      external: false,
    },
  ];

  return (
    <Section id="contact" className="bg-surface">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} lead={c.lead} tone="sun" />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <Reveal key={card.title} delay={i * 0.1}>
            <motion.a
              href={card.href}
              target={card.external ? '_blank' : undefined}
              rel={card.external ? 'noreferrer' : undefined}
              whileHover={{ y: -8 }}
              className="group flex h-full flex-col items-center rounded-[2rem] bg-cream p-8 text-center transition-shadow hover:shadow-soft"
            >
              <div className={`grid size-16 place-items-center rounded-2xl text-white ${card.tone} transition group-hover:scale-110 group-hover:rotate-6`}>
                {card.icon}
              </div>
              <h3 className="mt-5 text-xl font-black">{card.title}</h3>
              <p dir="ltr" className="mt-2 text-lg font-bold text-leaf-700">
                {card.value}
              </p>
              {card.text && <p className="mt-1 text-ink/60">{card.text}</p>}
            </motion.a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
