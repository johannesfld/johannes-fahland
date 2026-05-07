import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

mkdirSync(resolve(root, "public/brand"), { recursive: true });
mkdirSync(resolve(root, "public/brand/splash"), { recursive: true });

const iconSvg = readFileSync(resolve(root, "public/icon-512x512.svg"));

async function generateIcons() {
  // Standard app icons
  await sharp(iconSvg).resize(192, 192).png({ quality: 90 }).toFile(resolve(root, "public/brand/icon-192.png"));
  await sharp(iconSvg).resize(512, 512).png({ quality: 90 }).toFile(resolve(root, "public/brand/icon-512.png"));
  await sharp(iconSvg).resize(180, 180).png({ quality: 90 }).toFile(resolve(root, "public/brand/apple-touch-icon.png"));

  // Maskable: add 10% safe-zone padding (icon fills ~80% of canvas)
  const maskableSize = 512;
  const innerSize = Math.round(maskableSize * 0.8);
  const offset = Math.round((maskableSize - innerSize) / 2);
  const innerPng = await sharp(iconSvg).resize(innerSize, innerSize).png().toBuffer();
  await sharp({
    create: { width: maskableSize, height: maskableSize, channels: 4, background: { r: 251, g: 191, b: 36, alpha: 1 } },
  })
    .composite([{ input: innerPng, top: offset, left: offset }])
    .png({ quality: 90 })
    .toFile(resolve(root, "public/brand/icon-maskable-512.png"));

  console.log("✓ App icons generated in public/brand/");
}

// Splash screens for iOS (light theme: warm white bg + centered logo)
const splashConfigs = [
  // iPhone 16 Pro Max / 15 Pro Max
  { name: "splash-1320x2868.png", w: 1320, h: 2868 },
  // iPhone 16 / 15
  { name: "splash-1206x2622.png", w: 1206, h: 2622 },
  // iPhone 14 Pro Max / Plus
  { name: "splash-1290x2796.png", w: 1290, h: 2796 },
  // iPad Pro 12.9"
  { name: "splash-2048x2732.png", w: 2048, h: 2732 },
  // iPad 10.9"
  { name: "splash-1640x2360.png", w: 1640, h: 2360 },
];

async function generateSplashes() {
  for (const { name, w, h } of splashConfigs) {
    const logoSize = Math.round(Math.min(w, h) * 0.25);
    const logoPng = await sharp(iconSvg).resize(logoSize, logoSize).png().toBuffer();
    const left = Math.round((w - logoSize) / 2);
    const top = Math.round((h - logoSize) / 2);
    await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 250, g: 250, b: 247, alpha: 1 } },
    })
      .composite([{ input: logoPng, top, left }])
      .png({ quality: 85 })
      .toFile(resolve(root, `public/brand/splash/${name}`));
    console.log(`✓ ${name}`);
  }
  console.log("✓ Splash screens generated in public/brand/splash/");
}

await generateIcons();
await generateSplashes();
