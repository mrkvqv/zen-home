// Небольшие общие помощники для работы с разметкой и датами.

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const EASE = 'cubic-bezier(.22,1,.36,1)';

/** Создать элемент с классом и текстом (текст всегда как textContent — без HTML-инъекций). */
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(viewBox, path, strokeWidth, className) {
  const icon = document.createElementNS(SVG_NS, 'svg');
  const attributes = {
    viewBox,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  };
  for (const [name, value] of Object.entries(attributes)) icon.setAttribute(name, value);
  if (className) icon.setAttribute('class', className);
  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', path);
  icon.append(line);
  return icon;
}

/** Стрелка «влево/вправо» для кнопок календаря. */
export const sideChevron = (direction) => svg('0 0 16 16', direction < 0 ? 'm10 4-4 4 4 4' : 'm6 4 4 4-4 4', '1.2');

/** Стрелка «вниз» для раскрывающихся блоков. */
export const downChevron = (className = '') => svg('0 0 24 24', 'm6 9 6 6 6-6', '1.6', `disclosure-chevron ${className}`.trim());

/** Стрелка «›» в кнопке карточки события (при раскрытии разворачивается в «‹»). Ровно по центру 16×16. */
export const drawerChevron = () => svg('0 0 16 16', 'm5.875 3.75 4.25 4.25-4.25 4.25', '1.5', 'event-chevron');

/** Стрелка ↗ в углу карточки сайта. */
export const linkArrow = () => svg('0 0 16 16', 'M4 12 12 4M4 4h8v8', '1.2', 'link-arrow');

/** Галочка выбранного пункта в меню («Календари», язык). */
export const checkMark = (className = 'calendar-check') => svg('0 0 16 16', 'm3.5 8.5 3 3 6-7', '1.6', className);

/** Глобус для кнопки языка. */
export const globeIcon = () =>
  svg(
    '0 0 16 16',
    'M8 1.75a6.25 6.25 0 1 0 0 12.5a6.25 6.25 0 1 0 0-12.5M1.75 8h12.5M8 1.75c1.7 1.8 2.5 3.9 2.5 6.25S9.7 12.45 8 14.25M8 1.75C6.3 3.55 5.5 5.65 5.5 8s.8 4.45 2.5 6.25',
    '1.1',
    'lang-globe',
  );

// ---------- Даты ----------

const pad = (value) => String(value).padStart(2, '0');

/** Ключ дня в виде 2026-11-22 (по местному времени). */
export const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
