import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef7e9"/>
      <stop offset="1" stop-color="#2f7d59"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="288" fill="#ffffff" opacity=".92"/>
  <path d="M646 260c-147 16-244 92-291 211-36 91-23 190 22 262 8 13 27 11 32-4 49-146 133-253 256-329-112 102-181 211-210 328-4 17 13 31 28 23 146-76 245-191 261-345 6-57-19-109-54-143-11-10-27-6-44-3Z" fill="#2f7d59"/>
  <path d="M341 635c-51-78-59-169-24-258 8-21-19-37-33-19-83 105-95 257-18 378 52 82 137 135 231 150 22 3 34-24 16-37-71-52-129-120-172-214Z" fill="#84b76b" opacity=".95"/>
</svg>`;

const splashSvg = `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#f4f6f1"/>
  <circle cx="1366" cy="1284" r="354" fill="#e6f0df"/>
  <path d="M1518 886c-179 22-296 119-349 263-41 111-22 230 35 316 10 16 33 13 39-5 58-177 158-306 306-398-134 123-216 254-248 394-5 21 16 38 34 27 174-93 291-232 306-418 6-68-25-129-69-168-14-12-34-6-54-11Z" fill="#2f7d59"/>
  <text x="1366" y="1810" text-anchor="middle" font-family="Arial, sans-serif" font-size="132" font-weight="700" fill="#1f2a22">Nouria</text>
  <text x="1366" y="1915" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" fill="#667069">Małe notatki, duża zmiana.</text>
</svg>`;

await mkdir('resources', { recursive: true });
await mkdir('assets', { recursive: true });
await writeFile('assets/app-icon.svg', iconSvg.trim());
await writeFile('assets/splash.svg', splashSvg.trim());
await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile('resources/icon.png');
await sharp(Buffer.from(splashSvg)).resize(2732, 2732).png().toFile('resources/splash.png');

const androidIconSizes = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192]
];

for (const [folder, size] of androidIconSizes) {
  await writePng(`android/app/src/main/res/${folder}/ic_launcher.png`, iconSvg, size, size);
  await writePng(`android/app/src/main/res/${folder}/ic_launcher_round.png`, iconSvg, size, size);
  await writePng(`android/app/src/main/res/${folder}/ic_launcher_foreground.png`, iconSvg, Math.round(size * 1.25), Math.round(size * 1.25));
}

const androidSplashSizes = [
  ['drawable/splash.png', 480, 480],
  ['drawable-land-ldpi/splash.png', 320, 200],
  ['drawable-land-mdpi/splash.png', 480, 320],
  ['drawable-land-hdpi/splash.png', 800, 480],
  ['drawable-land-xhdpi/splash.png', 1280, 720],
  ['drawable-land-xxhdpi/splash.png', 1600, 960],
  ['drawable-land-xxxhdpi/splash.png', 1920, 1280],
  ['drawable-port-ldpi/splash.png', 200, 320],
  ['drawable-port-mdpi/splash.png', 320, 480],
  ['drawable-port-hdpi/splash.png', 480, 800],
  ['drawable-port-xhdpi/splash.png', 720, 1280],
  ['drawable-port-xxhdpi/splash.png', 960, 1600],
  ['drawable-port-xxxhdpi/splash.png', 1280, 1920]
];

for (const [file, width, height] of androidSplashSizes) {
  await writePng(`android/app/src/main/res/${file}`, splashSvg, width, height, { fit: 'contain', background: '#f4f6f1' });
}

await writePng('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', iconSvg, 1024, 1024);
await writePng('ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png', splashSvg, 2732, 2732);
await writePng('ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png', splashSvg, 2732, 2732);
await writePng('ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png', splashSvg, 2732, 2732);

console.log('mobile-assets-generated');

async function writePng(file, svg, width, height, resizeOptions = {}) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg))
    .resize(width, height, resizeOptions)
    .png()
    .toFile(file);
}
