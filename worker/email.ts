// Booking notification email (Persian, RTL). Table layout with inline styles so it renders the same in Gmail, Outlook and phones.

export type BookingEmail = {
  parentName: string;
  phone: string;
  details: [string, string][];
  notes: string;
  createdAt: Date;
  lang: string;
  country: string;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Iranian local numbers (09…) become 989… for WhatsApp; others are used as entered, without '+'.
const whatsappNumber = (phone: string) => phone.replace(/^\+/, '').replace(/^0/, '98');

// e.g. "دوشنبه ۱۱ آبان ۱۴۰۵، ساعت ۱۴:۳۰" (ICU's default fa-IR order puts the year first).
const tehranTime = (d: Date) => {
  const parts = new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const p = (type: Intl.DateTimeFormatPartTypes) => parts.find((x) => x.type === type)?.value ?? '';
  return `${p('weekday')} ${p('day')} ${p('month')} ${p('year')}، ساعت ${p('hour')}:${p('minute')}`;
};

const font = "font-family:Vazirmatn,Tahoma,'Segoe UI',Arial,sans-serif;";
const colors = { green: '#009B4D', greenDark: '#00703A', yellow: '#FFCC00', ivory: '#FAF5E9', ink: '#1F2A37', muted: '#6B7280', line: '#ECE6D6' };

export function bookingSubject(b: BookingEmail) {
  return `درخواست ثبت‌نام جدید: ${b.parentName}`;
}

export function bookingText(b: BookingEmail) {
  const lines = [
    'درخواست مشاوره و ثبت‌نام جدید',
    '',
    `نام والد: ${b.parentName}`,
    `شماره تماس: ${b.phone}`,
    ...b.details.map(([k, v]) => `${k}: ${v}`),
    ...(b.notes ? ['', `توضیحات: ${b.notes}`] : []),
    '',
    `زمان ارسال: ${tehranTime(b.createdAt)}`,
    `واتساپ: https://wa.me/${whatsappNumber(b.phone)}`,
  ];
  return lines.join('\n');
}

export function bookingHtml(b: BookingEmail) {
  const e = escapeHtml;
  const button = (href: string, label: string, bg: string, fg: string) =>
    `<a href="${e(href)}" style="${font}display:inline-block;background:${bg};color:${fg};text-decoration:none;font-weight:bold;font-size:14px;padding:10px 22px;border-radius:999px;margin:4px;">${label}</a>`;

  const rows = b.details
    .map(
      ([k, v], i) => `
        <tr>
          <td style="${font}padding:12px 16px;width:38%;color:${colors.muted};font-size:14px;${i ? `border-top:1px solid ${colors.line};` : ''}">${e(k)}</td>
          <td style="${font}padding:12px 16px;color:${colors.ink};font-size:15px;font-weight:bold;${i ? `border-top:1px solid ${colors.line};` : ''}">${e(v)}</td>
        </tr>`,
    )
    .join('');

  const notes = b.notes
    ? `
      <tr><td style="padding:0 28px 8px;">
        <p style="${font}margin:0 0 8px;color:${colors.muted};font-size:14px;">توضیحات والد</p>
        <div dir="auto" style="${font}background:${colors.ivory};border-right:4px solid ${colors.yellow};border-radius:12px;padding:14px 16px;color:${colors.ink};font-size:15px;line-height:1.9;white-space:pre-wrap;word-break:break-word;">${e(b.notes)}</div>
      </td></tr>`
    : '';

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(bookingSubject(b))}</title></head>
<body style="margin:0;padding:0;background:${colors.ivory};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.ivory};padding:24px 12px;" dir="rtl">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 18px rgba(31,42,55,0.08);" dir="rtl">

        <tr><td style="background:${colors.green};padding:24px 28px;text-align:right;">
          <p style="${font}margin:0;color:${colors.yellow};font-size:13px;font-weight:bold;">میس لیلا · آموزش زبان انگلیسی کودکان</p>
          <h1 style="${font}margin:6px 0 0;color:#ffffff;font-size:22px;line-height:1.5;">درخواست مشاوره و ثبت‌نام جدید</h1>
        </td></tr>

        <tr><td style="padding:24px 28px 8px;text-align:right;">
          <p style="${font}margin:0;color:${colors.muted};font-size:14px;">نام والد</p>
          <p style="${font}margin:4px 0 0;color:${colors.ink};font-size:20px;font-weight:bold;">${e(b.parentName)}</p>
          <p style="${font}margin:14px 0 0;color:${colors.muted};font-size:14px;">شماره تماس</p>
          <p dir="ltr" style="${font}margin:4px 0 0;color:${colors.greenDark};font-size:20px;font-weight:bold;text-align:right;">${e(b.phone)}</p>
          <div style="margin-top:14px;">
            ${button(`tel:${b.phone}`, 'تماس تلفنی', colors.yellow, colors.ink)}
            ${button(`https://wa.me/${whatsappNumber(b.phone)}`, 'پیام در واتساپ', '#25D366', '#ffffff')}
          </div>
        </td></tr>

        ${
          rows
            ? `<tr><td style="padding:16px 28px 16px;">
          <p style="${font}margin:0 0 8px;color:${colors.muted};font-size:14px;">جزئیات کلاس</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${colors.line};border-radius:12px;border-collapse:separate;" dir="rtl">${rows}
          </table>
        </td></tr>`
            : ''
        }
        ${notes}

        <tr><td style="padding:20px 28px 24px;border-top:1px solid ${colors.line};text-align:right;">
          <p style="${font}margin:0;color:${colors.muted};font-size:12px;line-height:1.9;">
            ارسال‌شده از فرم رزرو englishkids.ir<br>
            ${e(tehranTime(b.createdAt))} (به وقت تهران)<br>
            زبان سایت: ${b.lang === 'en' ? 'انگلیسی' : 'فارسی'}${b.country ? ` · کشور: ${e(b.country)}` : ''}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
