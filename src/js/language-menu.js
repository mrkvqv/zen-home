// Кнопка языка в правом верхнем углу: капсула «RU» и меню из четырёх языков.

import { checkMark, downChevron, element, globeIcon } from './dom.js';
import { language, LANGUAGES, onLanguageChange, setLanguage, t } from './i18n.js';

export function createLanguageMenu(menu) {
  const summary = element('summary', 'lang-button');
  const code = element('span', 'lang-code');
  summary.append(globeIcon(), code, downChevron('lang-chevron'));

  const list = element('ul', 'lang-list');
  for (const [id, info] of Object.entries(LANGUAGES)) {
    const item = element('li');
    const button = element('button', 'lang-option');
    button.type = 'button';
    button.dataset.lang = id;
    button.lang = id; // чтобы программы чтения с экрана читали название на его языке
    button.append(element('span', 'lang-option-name', info.name), element('span', 'lang-option-code', info.short), checkMark('lang-check'));
    item.append(button);
    list.append(item);
  }
  menu.append(summary, list);

  function update() {
    const current = language();
    code.textContent = LANGUAGES[current].short;
    summary.title = t('language');
    summary.setAttribute('aria-label', `${t('language')}: ${LANGUAGES[current].name}`);
    for (const button of list.querySelectorAll('.lang-option')) {
      const selected = button.dataset.lang === current;
      button.setAttribute('aria-current', String(selected));
    }
  }

  function close(focus = false) {
    menu.open = false;
    if (focus) summary.focus();
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('.lang-option');
    if (!button) return;
    setLanguage(button.dataset.lang);
    close(true);
  });

  // Закрыть по клику мимо меню и по Escape.
  document.addEventListener('pointerdown', (event) => {
    if (menu.open && !menu.contains(event.target)) close();
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  });

  onLanguageChange(update);
  update();
}
