const sharp = require('sharp');
const src = 'C:/Users/abbas/.t3/userdata/attachments/aa9af06d-a8fd-4215-afc8-75758ec5ae98-41466751-5904-4069-b4f9-3d4e34335c81.jpg';
const jobs = [
  ['src/assets/leila.jpg', {left: 650, top: 400, width: 300, height: 368}],
  ['src/assets/gallery/g1.jpg', {left: 110, top: 772, width: 262, height: 222}],
  ['src/assets/gallery/g2.jpg', {left: 400, top: 790, width: 198, height: 250}],
  ['src/assets/gallery/g3.jpg', {left: 105, top: 998, width: 284, height: 290}],
  ['src/assets/gallery/g4.jpg', {left: 393, top: 1060, width: 186, height: 228}],
];
(async () => { for (const [out, r] of jobs) { await sharp(src).extract(r).resize({ width: r.width * 2, kernel: 'lanczos3' }).sharpen({ sigma: 0.9 }).jpeg({ quality: 86, mozjpeg: true }).toFile(out); console.log(out); } })();
