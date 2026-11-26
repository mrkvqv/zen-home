// Карточки Essentials. Список берётся у моста (он читает сессию Zen),
// а переключение на вкладку делает фоновый скрипт расширения.

import { bridgeGet } from './bridge.js';
import { EASE, element, linkArrow, reducedMotion } from './dom.js';
import { t } from './i18n.js';

const CACHE_KEY = 'zen-home-pins-v1'; // только адреса и иконки — для мгновенной отрисовки при запуске

// Известные сервисы: своё название и иконка покрупнее, чем favicon из сессии.
// mono — однотонная иконка, которая перекрашивается под тему.
const PRESETS = {
  'youtube.com': { name: 'YouTube', icon: 'assets/icons/youtube.png' },
  'mail.proton.me': { name: 'Proton Mail', icon: 'assets/icons/proton.svg' },
  'mail.google.com': { name: 'Gmail', icon: 'assets/icons/gmail.png' },
  'github.com': { name: 'GitHub', icon: 'assets/icons/github.svg', mono: true },
  'chatgpt.com': { name: 'ChatGPT', icon: 'assets/icons/chatgpt.svg', mono: true },
  'calendar.google.com': { name: 'Calendar', calendar: true },
};

const hostKey = (url) => url.hostname.replace(/^www\./, '');

function safeURL(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

const safeImage = (value) =>
  typeof value === 'string' &&
  value.length <= 512 * 1024 &&
  /^data:image\/(png|jpeg|gif|webp|avif|x-icon|vnd.microsoft.icon|svg\+xml)[;,]/i.test(value);

function iconFor(pin, url, preset) {
  let icon;
  if (pin.customIcon && pin.symbol) {
    icon = element('span', 'app-icon pin-symbol', pin.symbol);
  } else if ((!preset || pin.customIcon) && safeImage(pin.image)) {
    icon = element('img', 'app-icon');
    icon.src = pin.image;
    icon.alt = '';
  } else if (preset?.calendar) {
    icon = element('span', 'app-icon calendar-icon');
    icon.append(element('span', '', new Date().getDate()));
  } else if (preset?.icon) {
    icon = element('img', `app-icon${preset.mono ? ' mono' : ''}`);
    icon.src = preset.icon;
    icon.alt = '';
  } else {
    const letter = (pin.title || hostKey(url)).trim().slice(0, 1).toUpperCase();
    icon = element('span', 'app-icon pin-monogram', letter);
  }
  if (icon.tagName === 'IMG') {
    icon.width = 46;
    icon.height = 46;
    icon.draggable = false;
    icon.decoding = 'async';
  }
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function card(pin) {
  const url = safeURL(pin.url);
  if (!url) return null;
  const preset = PRESETS[hostKey(url)];
  const name = preset?.name || pin.title || url.host;
  const link = element('a', 'bookmark');
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.title = name;
  link.setAttribute('aria-label', name);
  link.append(iconFor(pin, url, preset), element('span', 'app-name', name), linkArrow());
  return link;
}

export function createPins(nav) {
  let signature = '';
  let controller = null;
  let transition = null;
  let notice = null;
  let noticeTimer = 0;
  let lastPins = null;
  let messageKey = '';

  function notify(text) {
    if (!notice) {
      notice = element('p', 'pin-action-notice');
      notice.setAttribute('role', 'alert');
      document.body.append(notice);
    }
    notice.textContent = text;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      notice.hidden = true;
    }, 5000);
  }

  function showMessage(key) {
    signature = '';
    messageKey = key;
    nav.replaceChildren(element('p', 'bookmarks-empty', t(key)));
  }

  function render(pins, animate) {
    const next = JSON.stringify(pins);
    if (next === signature) return;
    lastPins = pins;
    messageKey = '';
    const fragment = document.createDocumentFragment();
    for (const pin of pins) {
      const link = pin && typeof pin === 'object' ? card(pin) : null;
      if (link) fragment.append(link);
    }
    if (!fragment.childNodes.length) fragment.append(element('p', 'bookmarks-empty', t('noPins')));

    const focused = nav.contains(document.activeElement) ? document.activeElement.href : null;
    signature = next;
    transition?.cancel();
    nav.replaceChildren(fragment);
    if (focused) [...nav.querySelectorAll('a')].find((a) => a.href === focused)?.focus({ preventScroll: true });
    if (animate && !reducedMotion.matches) {
      transition = nav.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: EASE });
    }
    try {
      localStorage.setItem(CACHE_KEY, next);
    } catch {
      // Хранилище может быть недоступно — тогда просто ждём мост.
    }
  }

  async function update() {
    controller?.abort();
    controller = new AbortController();
    const request = controller;
    try {
      const data = await bridgeGet('/v1/pins', null, { signal: request.signal, timeout: 5000 });
      if (!Array.isArray(data.pins)) throw new Error('service');
      if (controller === request) render(data.pins, signature !== '');
    } catch (error) {
      if (controller !== request || error.name === 'AbortError') return;
      if (!signature) showMessage('pinsFailed');
    }
  }

  // Обычный клик — переключиться на уже открытую вкладку; с модификаторами — как обычная ссылка.
  nav.addEventListener('click', async (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a.bookmark');
    if (!link || !nav.contains(link)) return;
    event.preventDefault();
    if (link.getAttribute('aria-busy') === 'true') return;
    link.setAttribute('aria-busy', 'true');
    try {
      const result = await browser.runtime.sendMessage({ type: 'activate-pin', url: link.href });
      if (!result?.ok) notify(t('pinMissing'));
    } catch {
      notify(t('pinFailed'));
    } finally {
      link.removeAttribute('aria-busy');
    }
  });

  // Мгновенная отрисовка из кэша, пока мост отвечает.
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (Array.isArray(cached)) render(cached, false);
  } catch {
    // Кэша ещё нет.
  }

  /** Перевести надписи после смены языка (названия сайтов не меняются). */
  function relabel() {
    if (messageKey) {
      showMessage(messageKey);
    } else if (lastPins) {
      signature = '';
      render(lastPins, false);
    }
  }

  return { update, relabel };
}
