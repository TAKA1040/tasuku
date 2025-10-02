import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconPath = join(__dirname, '../src/app/icon.png');
const backupPath = join(__dirname, '../src/app/icon-original.png');

async function optimizeIcon() {
  console.log('🎨 icon.png最適化開始...\n');

  // 元のファイルサイズ確認
  const originalSize = statSync(iconPath).size;
  console.log(`📊 元のサイズ: ${(originalSize / 1024).toFixed(2)} KB`);

  // バックアップ作成
  const original = readFileSync(iconPath);
  writeFileSync(backupPath, original);
  console.log('✅ バックアップ作成: icon-original.png\n');

  // 最適化（段階的に圧縮レベルを調整）
  const qualities = [90, 85, 80, 75];

  for (const quality of qualities) {
    await sharp(backupPath)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({
        quality,
        compressionLevel: 9,
        palette: true // パレット化でさらに削減
      })
      .toFile(iconPath);

    const newSize = statSync(iconPath).size;
    const newSizeKB = newSize / 1024;

    console.log(`🔧 quality=${quality}: ${newSizeKB.toFixed(2)} KB`);

    if (newSizeKB < 200) {
      console.log(`\n✨ 目標達成！ (${newSizeKB.toFixed(2)} KB < 200 KB)`);
      console.log(`📉 削減率: ${((1 - newSize / originalSize) * 100).toFixed(1)}%`);
      return;
    }
  }

  console.log('\n⚠️  200KB未満にできませんでした。手動での調整が必要かもしれません。');
}

optimizeIcon().catch(console.error);
