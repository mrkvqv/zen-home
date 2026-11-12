// Копирует ключ локального моста календаря в буфер обмена, чтобы вставить его на стартовой странице.
// Сам ключ на экран не выводится.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const configPath = join(homedir(), 'Library/Application Support/ZenCalendarBridge/config.json');

try {
  const { token } = JSON.parse(readFileSync(configPath, 'utf8'));
  if (typeof token !== 'string' || token.length < 32) throw new Error('bad token');
  execFileSync('pbcopy', { input: token });
  console.log('Ключ моста скопирован в буфер обмена. Вставь его на стартовой странице.');
} catch {
  console.error(`Не удалось прочитать ключ из ${configPath}. Мост календаря установлен?`);
  process.exit(1);
}
