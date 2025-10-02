import toIco from 'to-ico';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const appDir = join(__dirname, '../src/app');

async function generateFavicon() {
  console.log('🎨 favicon.ico生成開始...\n');

  // 16, 32, 48pxのPNGを読み込み
  const files = [
    readFileSync(join(publicDir, 'icon-16.png')),
    readFileSync(join(publicDir, 'icon-32.png')),
    readFileSync(join(publicDir, 'icon-48.png'))
  ];

  // マルチサイズICO生成
  const ico = await toIco(files);

  // src/app/favicon.icoに保存（Next.js 15の規約）
  writeFileSync(join(appDir, 'favicon.ico'), ico);
  console.log('✅ src/app/favicon.ico (16/32/48px) 生成完了');

  console.log('\n✨ favicon.ico生成完了！');
}

generateFavicon().catch(console.error);
