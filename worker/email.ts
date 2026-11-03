// Booking notification email, in the language of the site side the parent used (Persian RTL or English LTR).
// Table layout with inline styles so it renders the same in Gmail, Outlook and phones.

export type BookingEmail = {
  parentName: string;
  phone: string;
  details: [string, string][];
  notes: string;
  createdAt: Date;
  lang: string;
  country: string;
};

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Iranian local numbers (09…) become 989… for WhatsApp; others are used as entered, without '+'.
const whatsappNumber = (phone: string) => phone.replace(/^\+/, '').replace(/^0/, '98');

const timeParts = (d: Date, locale: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  return (type: Intl.DateTimeFormatPartTypes) => parts.find((x) => x.type === type)?.value ?? '';
};

const strings = {
  fa: {
    dir: 'rtl',
    align: 'right',
    // IRANSans is used when installed on the reader's device (most mail apps don't load web fonts); otherwise Vazirmatn/Tahoma.
    font: "font-family:IRANSansX,IRANSans,Vazirmatn,Tahoma,'Segoe UI',Arial,sans-serif;",
    brand: 'میس لیلا · آموزش زبان انگلیسی کودکان',
    title: 'درخواست مشاوره و ثبت‌نام جدید',
    subject: (name: string) => `درخواست ثبت‌نام جدید: ${name}`,
    parentName: 'نام والد',
    phone: 'شماره تماس',
    call: 'تماس تلفنی',
    whatsapp: 'پیام در واتساپ',
    details: 'جزئیات کلاس',
    notes: 'توضیحات والد',
    sentFrom: 'ارسال‌شده از فرم رزرو englishkids.ir',
    sentAt: 'زمان ارسال',
    tehran: '(به وقت تهران)',
    side: 'زبان سایت: فارسی',
    country: 'کشور',
    // e.g. "دوشنبه ۱۱ آبان ۱۴۰۵، ساعت ۱۴:۳۰" (ICU's default fa-IR order puts the year first).
    time: (d: Date) => {
      const p = timeParts(d, 'fa-IR');
      return `${p('weekday')} ${p('day')} ${p('month')} ${p('year')}، ساعت ${p('hour')}:${p('minute')}`;
    },
  },
  en: {
    dir: 'ltr',
    align: 'left',
    font: "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
    brand: 'Miss Leila · English for Kids',
    title: 'New consultation & enrolment request',
    subject: (name: string) => `New booking request: ${name}`,
    parentName: 'Parent’s name',
    phone: 'Phone',
    call: 'Call',
    whatsapp: 'Message on WhatsApp',
    details: 'Class details',
    notes: 'Parent’s notes',
    sentFrom: 'Sent from the booking form on englishkids.ir',
    sentAt: 'Sent',
    tehran: '(Tehran time)',
    side: 'Site language: English',
    country: 'Country',
    // e.g. "Monday, 2 November 2026 at 14:30"
    time: (d: Date) => {
      const p = timeParts(d, 'en-GB');
      return `${p('weekday')}, ${p('day')} ${p('month')} ${p('year')} at ${p('hour')}:${p('minute')}`;
    },
  },
};

const t = (b: BookingEmail) => (b.lang === 'en' ? strings.en : strings.fa);

const colors = { green: '#009B4D', greenDark: '#00703A', yellow: '#FFCC00', ivory: '#FAF5E9', ink: '#1F2A37', muted: '#6B7280', line: '#ECE6D6' };

export function bookingSubject(b: BookingEmail) {
  return t(b).subject(b.parentName);
}

export function bookingText(b: BookingEmail) {
  const s = t(b);
  const lines = [
    s.title,
    '',
    `${s.parentName}: ${b.parentName}`,
    `${s.phone}: ${b.phone}`,
    ...b.details.map(([k, v]) => `${k}: ${v}`),
    ...(b.notes ? ['', `${s.notes}: ${b.notes}`] : []),
    '',
    `${s.sentAt}: ${s.time(b.createdAt)} ${s.tehran}`,
    `WhatsApp: https://wa.me/${whatsappNumber(b.phone)}`,
  ];
  return lines.join('\n');
}

export function bookingHtml(b: BookingEmail) {
  const e = escapeHtml;
  const s = t(b);
  const { font, dir, align } = s;
  const start = align; // the side text starts on: right for Persian, left for English
  const button = (href: string, label: string, bg: string, fg: string) =>
    `<a href="${e(href)}" style="${font}display:inline-block;background:${bg};color:${fg};text-decoration:none;font-weight:bold;font-size:14px;padding:10px 22px;border-radius:999px;margin:4px;">${label}</a>`;

  const rows = b.details
    .map(
      ([k, v], i) => `
        <tr>
          <td style="${font}padding:12px 16px;width:38%;color:${colors.muted};font-size:14px;text-align:${align};${i ? `border-top:1px solid ${colors.line};` : ''}">${e(k)}</td>
          <td style="${font}padding:12px 16px;color:${colors.ink};font-size:15px;font-weight:bold;text-align:${align};${i ? `border-top:1px solid ${colors.line};` : ''}">${e(v)}</td>
        </tr>`,
    )
    .join('');

  const notes = b.notes
    ? `
      <tr><td style="padding:0 28px 8px;text-align:${align};">
        <p style="${font}margin:0 0 8px;color:${colors.muted};font-size:14px;">${s.notes}</p>
        <div dir="auto" style="${font}background:${colors.ivory};border-${start}:4px solid ${colors.yellow};border-radius:12px;padding:14px 16px;color:${colors.ink};font-size:15px;line-height:1.9;white-space:pre-wrap;word-break:break-word;">${e(b.notes)}</div>
      </td></tr>`
    : '';

  return `<!doctype html>
<html lang="${b.lang === 'en' ? 'en' : 'fa'}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(bookingSubject(b))}</title></head>
<body style="margin:0;padding:0;background:${colors.ivory};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.ivory};padding:24px 12px;" dir="${dir}">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 18px rgba(31,42,55,0.08);" dir="${dir}">

        <tr><td style="background:${colors.green};padding:24px 28px;text-align:${align};">
          <p style="${font}margin:0;color:${colors.yellow};font-size:13px;font-weight:bold;">${s.brand}</p>
          <h1 style="${font}margin:6px 0 0;color:#ffffff;font-size:22px;line-height:1.5;">${e(s.title)}</h1>
        </td></tr>

        <tr><td style="padding:24px 28px 8px;text-align:${align};">
          <p style="${font}margin:0;color:${colors.muted};font-size:14px;">${s.parentName}</p>
          <p dir="auto" style="${font}margin:4px 0 0;color:${colors.ink};font-size:20px;font-weight:bold;text-align:${align};">${e(b.parentName)}</p>
          <p style="${font}margin:14px 0 0;color:${colors.muted};font-size:14px;">${s.phone}</p>
          <p dir="ltr" style="${font}margin:4px 0 0;color:${colors.greenDark};font-size:20px;font-weight:bold;text-align:${align};">${e(b.phone)}</p>
          <div style="margin-top:14px;">
            ${button(`tel:${b.phone}`, s.call, colors.yellow, colors.ink)}
            ${button(`https://wa.me/${whatsappNumber(b.phone)}`, s.whatsapp, '#25D366', '#ffffff')}
          </div>
        </td></tr>

        ${
          rows
            ? `<tr><td style="padding:16px 28px 16px;text-align:${align};">
          <p style="${font}margin:0 0 8px;color:${colors.muted};font-size:14px;">${s.details}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${colors.line};border-radius:12px;border-collapse:separate;" dir="${dir}">${rows}
          </table>
        </td></tr>`
            : ''
        }
        ${notes}

        <tr><td style="padding:20px 28px 24px;border-top:1px solid ${colors.line};text-align:${align};">
          <p style="${font}margin:0;color:${colors.muted};font-size:12px;line-height:1.9;">
            ${s.sentFrom}<br>
            ${e(s.time(b.createdAt))} ${s.tehran}<br>
            ${s.side}${b.country ? ` · ${s.country}: ${e(b.country)}` : ''}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
