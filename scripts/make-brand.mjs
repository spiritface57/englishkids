// Generates the brand kit (icon, logo, favicons, social image) from vector sources.
// Run with: npm run brand
import fs from 'node:fs/promises';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const brandDir = path.join(root, 'brand');
const publicDir = path.join(root, 'public');
const srcBrandDir = path.join(root, 'src', 'assets', 'brand');

export const colors = {
  green: '#009B4D',
  yellow: '#FFCC00',
  ink: '#1F2A37',
  cream: '#FAF5E9',
};

// Logo mark on a 96 grid: a quotation mark drawn as two pen nibs (writing, speaking) above a smile.
const nibLeft = 'M10 6h26a4 4 0 0 1 4 4v28L25 66 6 38V10a4 4 0 0 1 4-4Z';
const nibRight = 'M60 6h26a4 4 0 0 1 4 4v28L75 66 56 38V10a4 4 0 0 1 4-4Z';
const smile = 'M18 78c8 13 52 13 60 0';

// Paint as an attribute, or as inline style when it is a CSS variable (attributes can't hold var()).
const paint = (prop, value) => (value.startsWith('var(') ? `style="${prop}:${value}"` : `${prop}="${value}"`);

// Logo colours: fixed brand colours for the image files, and CSS variables for the themed logo the site renders
// (it follows the colour palette and light/dark mode; the variables are defined in src/index.css).
const logoColors = {
  light: { nibLeft: colors.green, nibRight: colors.yellow, smile: colors.green, name: colors.ink, tag: colors.green },
  dark: { nibLeft: colors.green, nibRight: colors.yellow, smile: colors.green, name: '#FFFFFF', tag: colors.yellow },
  themed: {
    nibLeft: 'var(--logo-nib-left)',
    nibRight: 'var(--logo-nib-right)',
    smile: 'var(--logo-nib-left)',
    name: 'var(--logo-name)',
    tag: 'var(--logo-tag)',
  },
};

// The mark in colour (logo) or in one colour (white on the green app icon).
const markArt = (c) => `
  <path d="${nibLeft}" ${paint('fill', c.nibLeft)}/>
  <path d="${nibRight}" ${paint('fill', c.nibRight)}/>
  <path d="${smile}" fill="none" ${paint('stroke', c.smile)} stroke-width="8" stroke-linecap="round"/>`;

// Icon artwork on a 512 grid: the white mark centred in the safe area of a green tile.
const white = '#FFFFFF';
const iconArt = () =>
  `<g transform="translate(104 100) scale(3.17)">${markArt({ nibLeft: white, nibRight: white, smile: white })}</g>`;

const iconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="116" fill="${colors.green}"/>${iconArt()}
</svg>
`;

// Full-bleed background with artwork inside the 80% safe zone (Android adaptive icons).
const maskableSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${colors.green}"/>
  <g transform="translate(51.2 51.2) scale(0.8)">${iconArt()}</g>
</svg>
`;

const loadFont = async (weight) => {
  const file = path.join(root, 'node_modules/@fontsource/fredoka/files', `fredoka-latin-${weight}-normal.woff`);
  const buf = await fs.readFile(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

const textPath = (font, text, x, baseline, size, letterSpacing = 0) => {
  const p = font.getPath(text, x, baseline, size, { letterSpacing });
  return { d: p.toPathData(2), width: font.getAdvanceWidth(text, size, { letterSpacing }) };
};

const logoSvg = (bold, semi, c = logoColors.light) => {
  const iconSize = 168;
  const gap = 36;
  const x = iconSize + gap;
  const name = textPath(bold, 'Miss Leila', x, 98, 104);
  const tag = textPath(semi, 'ENGLISH FOR KIDS', x + 4, 152, 34, 0.14);
  const width = Math.ceil(x + Math.max(name.width, tag.width + 4) + 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${iconSize}">
  <g transform="scale(${iconSize / 96})">${markArt(c)}
  </g>
  <path d="${name.d}" ${paint('fill', c.name)}/>
  <path d="${tag.d}" ${paint('fill', c.tag)}/>
</svg>
`;
};

// Minimal .ico container holding PNG images (supported by all modern browsers).
const pngsToIco = (pngs) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
};

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

const main = async () => {
  await Promise.all([brandDir, publicDir, srcBrandDir].map((d) => fs.mkdir(d, { recursive: true })));
  const [bold, semi] = await Promise.all([loadFont(700), loadFont(600)]);

  const icon = iconSvg();
  const logo = logoSvg(bold, semi);
  const logoDark = logoSvg(bold, semi, logoColors.dark);

  await fs.writeFile(path.join(brandDir, 'icon.svg'), icon);
  await fs.writeFile(path.join(brandDir, 'icon-maskable.svg'), maskableSvg());
  await fs.writeFile(path.join(brandDir, 'logo.svg'), logo);
  await fs.writeFile(path.join(brandDir, 'logo-white.svg'), logoDark);
  await fs.writeFile(path.join(publicDir, 'favicon.svg'), icon);
  await fs.writeFile(path.join(srcBrandDir, 'logo-themed.svg'), logoSvg(bold, semi, logoColors.themed));
  await fs.writeFile(path.join(srcBrandDir, 'icon.svg'), icon);

  await fs.writeFile(path.join(brandDir, 'icon-1024.png'), await png(icon, 1024));
  await fs.writeFile(path.join(publicDir, 'icon-192.png'), await png(icon, 192));
  await fs.writeFile(path.join(publicDir, 'icon-512.png'), await png(icon, 512));
  await fs.writeFile(path.join(publicDir, 'icon-maskable-512.png'), await png(maskableSvg(), 512));
  await fs.writeFile(path.join(publicDir, 'apple-touch-icon.png'), await png(maskableSvg(), 180));
  await fs.writeFile(
    path.join(publicDir, 'favicon.ico'),
    pngsToIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(icon, size) })))),
  );

  await sharp(Buffer.from(logo), { density: 300 }).resize({ width: 1600 }).png().toFile(path.join(brandDir, 'logo.png'));
  await sharp(Buffer.from(logoDark), { density: 300 }).resize({ width: 1600 }).png().toFile(path.join(brandDir, 'logo-white.png'));
  // Square profile picture for Instagram / WhatsApp.
  await sharp(Buffer.from(maskableSvg()), { density: 300 }).resize(1080, 1080).png().toFile(path.join(brandDir, 'profile-1080.png'));

  // Social share image (Open Graph) 1200x630.
  const logoPng = await sharp(Buffer.from(logo), { density: 300 }).resize({ width: 620 }).png().toBuffer();
  const sub = textPath(semi, 'Fun, interactive English classes  ·  Ages 5+', 0, 40, 28);
  const subSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(sub.width)}" height="56"><path d="${sub.d}" fill="${colors.ink}" fill-opacity="0.75"/></svg>`;
  const portrait = await sharp(path.join(root, 'src/assets/leila.jpg'))
    .resize(420, 420, { fit: 'cover', position: 'top' })
    .composite([{ input: Buffer.from('<svg width="420" height="420"><circle cx="210" cy="210" r="210"/></svg>'), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${colors.cream}"/>
    <circle cx="960" cy="315" r="250" fill="${colors.green}"/>
    <circle cx="1130" cy="90" r="60" fill="${colors.yellow}"/>
    <circle cx="760" cy="560" r="34" fill="${colors.yellow}"/>
    <rect x="80" y="430" width="120" height="12" rx="6" fill="${colors.yellow}"/>
  </svg>`;
  await sharp(Buffer.from(bg))
    .composite([
      { input: logoPng, left: 80, top: 210 },
      { input: Buffer.from(subSvg), left: 84, top: 355 },
      { input: portrait, left: 750, top: 105 },
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('Brand assets written to brand/ and public/');
};

main();
