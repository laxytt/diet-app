import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const files = [
  'config.js',
  'manifest.webmanifest',
  'sw.js',
  'icon.svg',
  'privacy.html',
  'assets/healthy-food-hero.jpg',
  'assets/app-icon.svg',
  'assets/splash.svg'
];

await mkdir('dist/assets', { recursive: true });

for (const file of files) {
  if (!existsSync(file)) continue;
  const target = path.join('dist', file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(file, target);
}

console.log('static-assets-copied');
