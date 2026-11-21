// Подпись расширения в Mozilla (канал unlisted: в каталоге не публикуется, видно только тебе).
// Ключи берутся из .env: WEB_EXT_API_KEY и WEB_EXT_API_SECRET.

import { spawnSync } from 'node:child_process';

const { WEB_EXT_API_KEY, WEB_EXT_API_SECRET } = process.env;
if (!WEB_EXT_API_KEY || !WEB_EXT_API_SECRET) {
  console.error('Заполни WEB_EXT_API_KEY и WEB_EXT_API_SECRET в файле .env (образец — .env.example).');
  process.exit(1);
}

const result = spawnSync('pnpm', ['exec', 'web-ext', 'sign', '--channel=unlisted'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
