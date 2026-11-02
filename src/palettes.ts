// Trial colour palettes (from piktochart.com/blog/portfolio-color-palette) for choosing the site's colours.
// Each palette is mapped onto the site's existing tokens (leaf = primary, sun = accent/CTA, grape = secondary,
// cream/surface/ink = page, cards, text), so every component follows without changes. Light and dark are both covered.

export type Palette = {
  id: string;
  name: string;
  source: 'Piktochart' | 'Visme';
  swatches: string[]; // the 5 colours as published
  primary: string; // buttons, links, green bands (white text on top)
  accent: string; // main call-to-action (dark text on top)
  secondary: string;
  light: { bg: string; surface: string; ink: string };
  dark: { bg: string; surface: string; ink: string; primary?: string };
};

const mix = (a: string, pct: number, b: string) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;

const piktochart: Palette[] = [
  {
    id: 'elegant-minimalism',
    name: 'Elegant Minimalism',
    source: 'Piktochart',
    swatches: ['#FFFFFF', '#F0F0F0', '#B0B0B0', '#707070', '#333333'],
    primary: '#333333',
    accent: '#B0B0B0',
    secondary: '#707070',
    light: { bg: '#F0F0F0', surface: '#FFFFFF', ink: '#333333' },
    dark: { bg: '#161616', surface: '#242424', ink: '#F0F0F0', primary: '#707070' },
  },
  {
    id: 'creative-burst',
    name: 'Creative Burst',
    source: 'Piktochart',
    swatches: ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1'],
    primary: '#88B04B',
    accent: '#FF6F61',
    secondary: '#6B5B95',
    light: { bg: mix('#F7CAC9', 28, '#FFFFFF'), surface: '#FFFFFF', ink: '#2B2540' },
    dark: { bg: '#15131F', surface: '#221E33', ink: '#F7EDEC' },
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    source: 'Piktochart',
    swatches: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7', '#ECF0F1'],
    primary: '#34495E',
    accent: '#BDC3C7',
    secondary: '#7F8C8D',
    light: { bg: '#ECF0F1', surface: '#FFFFFF', ink: '#2C3E50' },
    dark: { bg: '#141D26', surface: '#1F2C39', ink: '#ECF0F1', primary: '#5D7A96' },
  },
  {
    id: 'serene-nature',
    name: 'Serene Nature',
    source: 'Piktochart',
    swatches: ['#A8D8B9', '#F6D55C', '#ED553B', '#F1F1F1', '#1D3557'],
    primary: '#ED553B',
    accent: '#F6D55C',
    secondary: '#1D3557',
    light: { bg: '#F1F1F1', surface: '#FFFFFF', ink: '#1D3557' },
    dark: { bg: '#0F1A2B', surface: '#1D3557', ink: '#F1F1F1' },
  },
  {
    id: 'bold-contrast',
    name: 'Bold Contrast',
    source: 'Piktochart',
    swatches: ['#FF9F00', '#FF3D00', '#00BFFF', '#00FF7F', '#8A2BE2'],
    primary: '#8A2BE2',
    accent: '#FF9F00',
    secondary: '#00BFFF',
    light: { bg: mix('#00BFFF', 6, '#FFFFFF'), surface: '#FFFFFF', ink: '#1C1030' },
    dark: { bg: '#100A1C', surface: '#1C1330', ink: '#F2ECFF' },
  },
  {
    id: 'soft-pastels',
    name: 'Soft Pastels',
    source: 'Piktochart',
    swatches: ['#FAD0C9', '#FAD6A5', '#FFABAB', '#FFC3A0', '#D5AAFF'],
    primary: mix('#D5AAFF', 62, '#000000'), // pastels are too light for white text; a deeper lilac
    accent: '#FFC3A0',
    secondary: '#FFABAB',
    light: { bg: mix('#FAD0C9', 35, '#FFFFFF'), surface: '#FFFFFF', ink: '#3B2A3F' },
    dark: { bg: '#1A1420', surface: '#271E2F', ink: '#FCEFEA', primary: mix('#D5AAFF', 75, '#000000') },
  },
  {
    id: 'urban-chic',
    name: 'Urban Chic',
    source: 'Piktochart',
    swatches: ['#4A4E69', '#9A8C98', '#C9ADA7', '#F2E9E4', '#22223B'],
    primary: '#4A4E69',
    accent: '#C9ADA7',
    secondary: '#9A8C98',
    light: { bg: '#F2E9E4', surface: '#FFFFFF', ink: '#22223B' },
    dark: { bg: '#16162A', surface: '#22223B', ink: '#F2E9E4', primary: '#6E7396' },
  },
  {
    id: 'vibrant-energy',
    name: 'Vibrant Energy',
    source: 'Piktochart',
    swatches: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#6A0572'],
    primary: '#4D96FF',
    accent: '#FFD93D',
    secondary: '#6A0572',
    light: { bg: mix('#FFD93D', 10, '#FFFFFF'), surface: '#FFFFFF', ink: '#2A0B30' },
    dark: { bg: '#140A1A', surface: '#22122A', ink: '#FFF6E0' },
  },
  {
    id: 'timeless-elegance',
    name: 'Timeless Elegance',
    source: 'Piktochart',
    swatches: ['#2E4052', '#A5C9CA', '#F0E5D8', '#D9BF77', '#C84B31'],
    primary: '#2E4052',
    accent: '#D9BF77',
    secondary: '#C84B31',
    light: { bg: '#F0E5D8', surface: '#FFFFFF', ink: '#2E4052' },
    dark: { bg: '#151E27', surface: '#22303E', ink: '#F0E5D8', primary: '#C84B31' },
  },
  {
    id: 'warm-earth-tones',
    name: 'Warm Earth Tones',
    source: 'Piktochart',
    swatches: ['#D9BF77', '#A45A3D', '#6B4226', '#C4B6A6', '#E8DAB2'],
    primary: '#A45A3D',
    accent: '#D9BF77',
    secondary: '#6B4226',
    light: { bg: mix('#E8DAB2', 45, '#FFFFFF'), surface: '#FFFFFF', ink: '#3A2414' },
    dark: { bg: '#1A120C', surface: '#2A1E15', ink: '#F3EBD6' },
  },
  {
    id: 'cool-blues',
    name: 'Cool Blues',
    source: 'Piktochart',
    swatches: ['#1B2631', '#3F4E4F', '#A5C8D6', '#F0F4F8', '#D9E4E0'],
    primary: '#3F4E4F',
    accent: '#A5C8D6',
    secondary: '#1B2631',
    light: { bg: '#F0F4F8', surface: '#FFFFFF', ink: '#1B2631' },
    dark: { bg: '#11181F', surface: '#1B2631', ink: '#F0F4F8', primary: '#5E7576' },
  },
  {
    id: 'retro-revival',
    name: 'Retro Revival',
    source: 'Piktochart',
    swatches: ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1'],
    primary: '#6B5B95',
    accent: '#FF6F61',
    secondary: '#88B04B',
    light: { bg: mix('#92A8D1', 14, '#FFFFFF'), surface: '#FFFFFF', ink: '#2B2540' },
    dark: { bg: '#13121C', surface: '#201E30', ink: '#F4F1FA', primary: '#8576B5' },
  },
  {
    id: 'monochrome-dream',
    name: 'Monochrome Dream',
    source: 'Piktochart',
    swatches: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'],
    primary: '#000000',
    accent: '#CCCCCC',
    secondary: '#666666',
    light: { bg: mix('#CCCCCC', 35, '#FFFFFF'), surface: '#FFFFFF', ink: '#000000' },
    dark: { bg: '#000000', surface: '#1A1A1A', ink: '#EEEEEE', primary: '#666666' },
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    source: 'Piktochart',
    swatches: ['#FF5E3A', '#FF2A00', '#FFB400', '#FFD700', '#FFEDDA'],
    primary: '#FF2A00',
    accent: '#FFB400',
    secondary: '#FF5E3A',
    light: { bg: '#FFEDDA', surface: '#FFFFFF', ink: '#3A1400' },
    dark: { bg: '#1C0E07', surface: '#2B160B', ink: '#FFEDDA' },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    source: 'Piktochart',
    swatches: ['#0077B6', '#00B4D8', '#90E0EF', '#ADE8F4', '#FDFD96'],
    primary: '#0077B6',
    accent: '#FDFD96',
    secondary: '#00B4D8',
    light: { bg: mix('#ADE8F4', 30, '#FFFFFF'), surface: '#FFFFFF', ink: '#03304A' },
    dark: { bg: '#04141F', surface: '#0A2233', ink: '#E6F7FB' },
  },
];

// Visme "50 website colour schemes" (visme.co/blog/website-color-schemes), colours as labelled in the article's images.
// #5 and #7 have no colour codes in the article, so they are not included.
const visme: [string, string[]][] = [
  ['Metallic Chic', ['#3D52A0', '#7091E6', '#8697C4', '#ADBBDA', '#EDE8F5']],
  ['Deep Vintage Mood', ['#244855', '#E64833', '#874F41', '#90AEAD', '#FBE9D0']],
  ['Cool and Collected', ['#003135', '#024950', '#964734', '#0FA4AF', '#AFDDE5']],
  ['Earthy and Serene', ['#3E362E', '#865D36', '#93785B', '#AC8968', '#A69080']],
  ['Mechanical and Floaty', ['#141619', '#2C2E3A', '#050A44', '#0A21C0', '#B3B4BD']],
  ['Gradient Pop', ['#141414', '#273DB4', '#C50900', '#F95CA4', '#ED7845']],
  ['Cosmic Artistry', ['#212A31', '#2E3944', '#124E66', '#748D92', '#D3D9D4']],
  ['Vibrant but Calm', ['#E43D12', '#D6536D', '#FFA2B6', '#EFB11D', '#EBE9E1']],
  ['Lively and Inviting', ['#E7717D', '#C2CAD0', '#C2B9B0', '#7E685A', '#AFD275']],
  ['Striking and Simple', ['#0B0C10', '#1F2833', '#C5C6C7', '#66FCF1', '#45A29E']],
  ['Red and Lively', ['#5D001E', '#E3E2DF', '#E3AFBC', '#9A1750', '#EE4C7C']],
  ['Artsy and Creative', ['#D79922', '#EFE2BA', '#F13C20', '#4056A1', '#C5CBE3']],
  ['Elegant Yet Approachable', ['#EDC7B7', '#EEE2DC', '#BAB2B5', '#123C69', '#AC3B61']],
  ['Sleek and Futuristic', ['#2C3531', '#116466', '#D9B08C', '#FFCB9A', '#D1E8E2']],
  ['Innovative and Audacious', ['#272727', '#747474', '#FF652F', '#FFE400', '#14A76C']],
  ['Texturized and Dynamic', ['#2F4454', '#2E151B', '#DA7B93', '#376E6F', '#1C3334']],
  ['Minimal Yet Warm', ['#EAE7DC', '#D8C3A5', '#8E8D8A', '#E98074', '#E85A4F']],
  ['Vivid and Sharp', ['#D83F87', '#2A1B3D', '#44318D', '#E98074', '#A4B3B6']],
  ['Clean and Energetic', ['#5680E9', '#84CEEB', '#5AB9EA', '#C1C8E4', '#8860D0']],
  ['Corporate and Traditional', ['#88BDBC', '#254E58', '#112D32', '#4F4A41', '#6E6658']],
  ['Blue and Refreshing', ['#25274D', '#464866', '#AAABB8', '#2E9CCA', '#29648A']],
  ['Clean and Modern', ['#17252A', '#2B7A78', '#3AAFA9', '#DEF2F1', '#FEFFFF']],
  ['Vibrant and Elegant', ['#F8E9A1', '#F76C6C', '#A8D0E6', '#374785', '#24305E']],
  ['Youthful and Fun', ['#A64AC9', '#FCCD04', '#FFB48F', '#F5E6CC', '#17E9E0']],
  ['Gorgeous Contrast', ['#61892F', '#86C232', '#222629', '#474B4F', '#6B6E70']],
  ['Effective Accent Colors', ['#FAED26', '#46344E', '#5A5560', '#9D8D8F', '#9B786F']],
  ['Modernity in Full Bloom', ['#182628', '#65CCB8', '#57BA98', '#3B945E', '#F2F2F2']],
  ['Close to Nature', ['#687864', '#31708E', '#5085A5', '#8FC1E3', '#F7F9FB']],
  ['Bright Pink and Pastels', ['#A1C3D1', '#B39BC8', '#F0EBF4', '#F172A1', '#E64398']],
  ['Unique Combination', ['#59253A', '#78244C', '#895061', '#0677A1', '#2D4159']],
  ['Striking Citrus Colors', ['#1F2605', '#1F6521', '#53900F', '#A4A71E', '#D6CE15']],
  ['Vivid Blues and Orange', ['#10E7DC', '#0074E1', '#1B9CE5', '#6CDAEE', '#F79E02']],
  ['Rose Red and Blueberry', ['#4285F4', '#5C2018', '#BC4639', '#D4A59A', '#F3E0DC']],
  ['Audacious and Unique', ['#080F5B', '#0D19A3', '#15DB95', '#F4E4C1', '#E4C580']],
  ['Cheerful and Energetic', ['#FBE8A6', '#F4976C', '#303C6C', '#B4DFE5', '#D2FDFF']],
  ['Snowy Yet Warm', ['#B23850', '#3B8BEB', '#E7E3D4', '#C4DBF6', '#8590AA']],
  ['Rich and Colorful', ['#F78888', '#F3D250', '#ECECEC', '#90CCF4', '#5DA2D5']],
  ['Modern and Minimalist', ['#19181A', '#479761', '#CEBC81', '#A16E83', '#B19F9E']],
  ['Intrepid and Fearless', ['#314455', '#644E5B', '#9E5A63', '#C96567', '#97AABD']],
  ['Flat Design Colors', ['#00887A', '#FFCCBC', '#FFFFFF', '#D3E3FC', '#77A6F7']],
  ['Eclectic and Peaceful', ['#844D36', '#474853', '#86B3D1', '#AAA0A0', '#8E8268']],
  ['Classy and Traditional', ['#5F6366', '#4D6D9A', '#86B3D1', '#99CED3', '#EDB5BF']],
  ['Accent Colors That Pop', ['#802BB1', '#2D283E', '#564F6F', '#4C495D', '#D1D7E0']],
  ['Corporate and Serious', ['#265077', '#022140', '#494B68', '#1E4258', '#2D5F5D']],
  ['Glamorous and Fashion-Forward', ['#806543', '#33266E', '#111111', '#542F34', '#A6607C']],
  ['Eye-Catching and Sleek', ['#501F3A', '#CB2D6F', '#CCCCCC', '#14A098', '#0F292F']],
  ['Loud and In-Your-Face', ['#C34271', '#F070A1', '#16FFBD', '#12C998', '#439F76']],
  ['Lively Yet Soothing', ['#026670', '#9FEDD7', '#FEF9C7', '#FCE181', '#EDEAE5']],
];

// Picks roles from 5 swatches: primary = most saturated colour dark enough for white text, accent = most saturated
// colour light enough for dark text, page background from the lightest colour, text from the darkest.
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const saturation = (hex: string) => {
  const c = rgb(hex);
  const max = Math.max(...c);
  const min = Math.min(...c);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const bySaturation = (list: string[]) => [...list].sort((a, b) => saturation(b) - saturation(a));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function fromSwatches(name: string, swatches: string[]): Palette {
  const byLum = [...swatches].sort((a, b) => luminance(a) - luminance(b));
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];

  const primaryPick = bySaturation(swatches.filter((c) => contrast(c, '#FFFFFF') >= 3))[0];
  const primary = primaryPick ?? mix(bySaturation(swatches)[0], 65, '#000000');
  const rest = swatches.filter((c) => c !== primaryPick);
  // Light enough for dark text, but not so pale that the button vanishes on the light page.
  const usable = (c: string) => luminance(c) > 0.2 && luminance(c) < 0.72;
  const accent =
    bySaturation(rest.filter((c) => usable(c) && saturation(c) > 0.2))[0] ??
    bySaturation(rest.filter(usable))[0] ??
    mix(bySaturation(rest)[0] ?? primary, 45, '#FFFFFF');
  const secondary = bySaturation(rest.filter((c) => c !== accent))[0] ?? primary;

  const lightBg = luminance(lightest) > 0.6 ? mix(lightest, 30, '#FFFFFF') : mix(primary, 5, '#FFFFFF');
  const ink = luminance(darkest) < 0.03 ? darkest : mix(darkest, 50, '#000000');
  const darkBase = mix(darkest, 40, '#0B0B0F');
  // A primary that is nearly black disappears on a dark page; lighten it there.
  const darkPrimary = primaryPick && luminance(primaryPick) < 0.06 ? mix(primaryPick, 60, '#FFFFFF') : undefined;

  return {
    id: `visme-${slug(name)}`,
    name,
    source: 'Visme',
    swatches,
    primary,
    accent,
    secondary,
    light: { bg: lightBg, surface: '#FFFFFF', ink },
    dark: {
      bg: darkBase,
      surface: mix(darkest, 50, '#1A1A20'),
      ink: luminance(lightest) > 0.6 ? mix(lightest, 40, '#FFFFFF') : '#F2F2F2',
      primary: darkPrimary,
    },
  };
}

export const palettes: Palette[] = [...piktochart, ...visme.map(([name, swatches]) => fromSwatches(name, swatches))];

const vars = (entries: Record<string, string>) =>
  Object.entries(entries)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

// CSS that re-points the site's colour tokens. `html:root` / `html.dark` outrank the defaults in index.css.
export function paletteCss(p: Palette) {
  const { primary, accent, secondary, light, dark } = p;
  const dPrimary = dark.primary ?? primary;

  const lightVars = vars({
    '--color-cream': light.bg,
    '--color-surface': light.surface,
    '--color-ink': light.ink,
    '--color-night': mix(light.ink, 70, '#000000'),
    '--color-leaf-50': mix(primary, 8, light.surface),
    '--color-leaf-100': mix(primary, 18, light.surface),
    '--color-leaf-200': mix(primary, 38, light.surface),
    '--color-leaf-500': primary,
    '--color-leaf-600': mix(primary, 85, '#000000'),
    '--color-leaf-700': mix(primary, 70, '#000000'),
    '--color-sun-50': mix(accent, 12, light.surface),
    '--color-sun-100': mix(accent, 28, light.surface),
    '--color-sun-400': mix(accent, 85, '#FFFFFF'),
    '--color-sun-500': accent,
    '--color-sun-600': mix(accent, 88, '#000000'),
    '--color-sun-700': mix(accent, 50, '#000000'),
    '--color-grape-50': mix(secondary, 8, light.surface),
    '--color-grape-100': mix(secondary, 18, light.surface),
    '--color-grape-500': secondary,
    '--color-grape-600': mix(secondary, 80, '#000000'),
    // A light gradient (soft tints of the primary colour) with dark text on it.
    '--band-from': mix(primary, 14, '#FFFFFF'),
    '--band-to': mix(primary, 32, '#FFFFFF'),
    '--color-band-ink': light.ink,
    '--shadow-pop': `0 18px 40px -16px ${mix(primary, 45, 'transparent')}`,
  });

  const darkVars = vars({
    '--color-cream': dark.bg,
    '--color-surface': dark.surface,
    '--color-ink': dark.ink,
    '--color-night': dark.bg,
    '--color-leaf-50': mix(dPrimary, 14, dark.bg),
    '--color-leaf-100': mix(dPrimary, 24, dark.bg),
    '--color-leaf-200': mix(dPrimary, 38, dark.bg),
    '--color-leaf-500': dPrimary,
    '--color-leaf-600': mix(dPrimary, 85, '#000000'),
    '--color-leaf-700': mix(dPrimary, 55, '#FFFFFF'),
    '--color-sun-50': mix(accent, 12, dark.bg),
    '--color-sun-100': mix(accent, 22, dark.bg),
    '--color-sun-700': mix(accent, 70, '#FFFFFF'),
    '--color-grape-50': mix(secondary, 14, dark.bg),
    '--color-grape-100': mix(secondary, 24, dark.bg),
    '--color-grape-600': mix(secondary, 55, '#FFFFFF'),
    '--band-from': mix(dPrimary, 45, dark.bg),
    '--band-to': mix(dPrimary, 22, dark.bg),
    '--color-band-ink': '#FFFFFF',
  });

  return `html:root {\n${lightVars}\n}\nhtml.dark {\n${darkVars}\n}`;
}

const STORAGE_KEY = 'palette';

export const savedPaletteId = () => localStorage.getItem(STORAGE_KEY) ?? '';

// Applies a palette (or the original colours for '') and remembers the choice. Called before first render too.
export function applyPalette(id: string) {
  const palette = palettes.find((p) => p.id === id);
  let style = document.getElementById('palette-style');
  if (!palette) {
    style?.remove();
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = 'palette-style';
    document.head.appendChild(style);
  }
  style.textContent = paletteCss(palette);
  localStorage.setItem(STORAGE_KEY, id);
}
