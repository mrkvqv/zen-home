// Точка входа стартовой страницы: связывает календарь, события и Essentials.

import { createAgenda } from './agenda.js';
import { saveToken } from './bridge.js';
import { createCalendar } from './calendar.js';
import { loadLanguage, onLanguageChange, t, translatePage } from './i18n.js';
import { createLanguageMenu } from './language-menu.js';
import { createPins } from './pins.js';

const REFRESH_EVERY = 30_000;

const root = document.querySelector('.scene');
// Язык читаем до первой отрисовки, чтобы надписи не мелькнули на другом языке.
await loadLanguage();
createLanguageMenu(document.querySelector('[data-lang-menu]'));
const pins = createPins(root.querySelector('[data-bookmarks]'));

let agenda;
const calendar = createCalendar(root, { onChange: (state) => agenda?.update(state) });
agenda = createAgenda(root, { getState: () => calendar.state(), onSetupNeeded: showSetup });

/** Форма для ключа моста — появляется, если ключа нет или он неверный. */
function showSetup(container) {
  if (container.querySelector('[data-setup-form]')) return;
  const form = document.querySelector('template[data-setup]').content.firstElementChild.cloneNode(true);
  translatePage(form);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = form.elements.token.value.trim();
    try {
      await saveToken(token);
      refreshAll();
    } catch {
      form.querySelector('.setup-text').textContent = t('setupDenied');
    }
  });
  container.replaceChildren(form);
  form.elements.token.focus({ preventScroll: true });
}

function refreshAll() {
  pins.update();
  agenda.load(true);
}

calendar.start();
pins.update();

// Смена языка: перерисовать всё, что собирается в коде (разметку переводит i18n.js).
onLanguageChange(() => {
  calendar.relabel();
  agenda.relabel();
  pins.relabel();
  const form = root.querySelector('[data-setup-form]');
  if (form) translatePage(form);
});

// Обновление: при возвращении на вкладку и раз в 30 секунд, пока страница видна.
let lastRefresh = Date.now();
document.addEventListener('visibilitychange', () => {
  if (document.hidden || Date.now() - lastRefresh < 2000) return;
  lastRefresh = Date.now();
  refreshAll();
});
setInterval(() => {
  if (document.hidden) return;
  lastRefresh = Date.now();
  refreshAll();
}, REFRESH_EVERY);
