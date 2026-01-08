import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceIcon = join(__dirname, '../src/app/icon.png');
const publicDir = join(__dirname, '../public');

// 生成するサイズの定義
const iconSizes = [16, 32, 48, 64, 192, 512];
const appleTouchSizes = [180];

async function generateIcons() {
  console.log('🎨 アイコン生成開始...\n');

  // 標準アイコン生成
  for (const size of iconSizes) {
    const outputPath = join(publicDir, `icon-${size}.png`);
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`✅ icon-${size}.png 生成完了`);
  }

  // Apple Touch Icon
  for (const size of appleTouchSizes) {
    const outputPath = join(publicDir, `apple-touch-icon.png`);
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 252, g: 229, b: 229, alpha: 1 } })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`✅ apple-touch-icon.png (${size}px) 生成完了`);
  }

  // Maskable icon (safe areaを考慮して80%にスケール)
  const maskableOutputPath = join(publicDir, 'icon-512-maskable.png');
  await sharp(sourceIcon)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 252, g: 229, b: 229, alpha: 1 }
    })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(maskableOutputPath);
  console.log(`✅ icon-512-maskable.png 生成完了`);

  // favicon.ico (マルチサイズ) - PNGで個別生成後、手動でICO変換推奨
  console.log('\n📝 注意: favicon.icoはオンラインツール等で以下のPNGから生成してください:');
  console.log('   - icon-16.png, icon-32.png, icon-48.png');

  console.log('\n✨ アイコン生成完了！');
}

generateIcons().catch(console.error);
