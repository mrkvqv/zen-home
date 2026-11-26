// События выбранного дня, точки событий в сетке месяца и список календарей.

import { bridgeGet } from './bridge.js';
import { addDays, checkMark, dateKey, downChevron, drawerChevron, EASE, element, parseKey, reducedMotion } from './dom.js';
import { dateFormat, locale, plural, t } from './i18n.js';

// Форматы на текущем языке (i18n.js кэширует их и пересоздаёт при смене языка).
const timeFormat = () => dateFormat({ hour: '2-digit', minute: '2-digit' });
const dayFormat = () => dateFormat({ weekday: 'long', day: 'numeric', month: 'long' });
const dateTimeFormat = () => dateFormat({ dateStyle: 'medium', timeStyle: 'short' });
const fullDayFormat = () => dateFormat({ dateStyle: 'long' });
const shortDayFormat = () => dateFormat({ day: 'numeric', month: 'long' });
const weekdayShort = (date) => dateFormat({ weekday: 'short' }).format(date).replace('.', '');
const formatTime = (date) => timeFormat().format(date);

const FRESH_FOR = 30_000; // данные моложе 30 секунд не перезапрашиваем
const MAX_CACHED_RANGES = 12;

const safeColor = (value) => (/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#b8b8ad');

function safeURL(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/** События, которые попадают на день key (с учётом многодневных и «весь день»). */
function eventsForDay(payload, key) {
  const start = parseKey(key).getTime();
  const end = addDays(parseKey(key), 1).getTime();
  return payload.events
    .filter((event) => {
      if (event.allDay) {
        return event.startDay <= key && (event.endDay > key || (event.startDay === key && event.endDay === event.startDay));
      }
      const eventStart = Date.parse(event.start);
      const eventEnd = Date.parse(event.end);
      return eventStart < end && (eventEnd > start || (eventStart === eventEnd && eventStart >= start));
    })
    .sort(
      (a, b) =>
        Number(b.allDay) - Number(a.allDay) || Date.parse(a.start) - Date.parse(b.start) || a.title.localeCompare(b.title, locale()),
    );
}

function eventTime(event, key) {
  if (event.allDay) return t('allDay');
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayStart = parseKey(key);
  const nextDay = addDays(dayStart, 1);
  if (start.getTime() === end.getTime()) return formatTime(start);
  if (start < dayStart && end >= nextDay) return t('ongoing');
  if (start < dayStart) return t('untilTime', { time: formatTime(end) });
  if (end > nextDay) return t('fromTime', { time: formatTime(start) });
  return `${formatTime(start)}–${formatTime(end)}`;
}

/**
 * Первый и последний день события «на весь день».
 * Конец в данных не включён (endDay — следующий день), но мост иногда отдаёт endDay = startDay;
 * тогда последний день не может оказаться раньше первого.
 */
function allDayRange(event) {
  const first = parseKey(event.startDay);
  const end = addDays(parseKey(event.endDay), -1);
  return { first, last: end < first ? first : end };
}

function personName(person) {
  if (!person) return '';
  if (person.name) return person.name;
  try {
    return decodeURIComponent((person.url || '').replace(/^mailto:/i, ''));
  } catch {
    return person.url || '';
  }
}

function recurrenceText(rule) {
  const n = rule.interval;
  const unit = t('repeatUnits')[rule.frequency];
  let label =
    n === 1
      ? t('repeatEvery')[rule.frequency] || t('repeats')
      : t('repeatEveryN', { n, unit: unit ? plural(unit, n, { n }) : t('repeatUnitFallback') });
  if (rule.daysOfWeek?.length) {
    // В правиле дни недели считаются с воскресенья: 1 — воскресенье, 7 — суббота.
    const sunday = new Date(2024, 0, 7);
    label += `, ${rule.daysOfWeek
      .filter((value) => value.day >= 1 && value.day <= 7)
      .map((value) => weekdayShort(addDays(sunday, value.day - 1)))
      .join(', ')}`;
  }
  if (rule.daysOfMonth?.length) label += `, ${t('repeatDaysOfMonth', { list: rule.daysOfMonth.join(', ') })}`;
  if (rule.end?.date) label += `, ${t('repeatUntil', { date: fullDayFormat().format(new Date(rule.end.date)) })}`;
  if (rule.end?.count) label += `, ${plural('repeatCount', rule.end.count)}`;
  return label;
}

/** Длительность: «45 мин», «1 ч 30 мин», «2 д 4 ч» (и так же на других языках). */
function durationText(ms) {
  let minutes = Math.round(Math.abs(ms) / 60000);
  if (minutes <= 0) return '';
  const days = Math.floor(minutes / 1440);
  minutes %= 1440;
  const hours = Math.floor(minutes / 60);
  minutes %= 60;
  // Дни показываем только с часами, без минут — так короче.
  const parts = days
    ? [t('durationDays', { n: days }), hours && t('durationHours', { n: hours })]
    : [hours && t('durationHours', { n: hours }), minutes && t('durationMinutes', { n: minutes })];
  return parts.filter(Boolean).join(' ');
}

function alarmText(alarm) {
  if (alarm.absoluteDate) return dateTimeFormat().format(new Date(alarm.absoluteDate));
  const seconds = Number(alarm.relativeOffset);
  if (!seconds) return t('alarmAtStart');
  const time = durationText(seconds * 1000) || t('lessThanMinute');
  return t(seconds < 0 ? 'alarmBefore' : 'alarmAfter', { time });
}

const STATUS_KEYS = {
  no_token: 'statusNoToken',
  unauthorized: 'statusUnauthorized',
  permission: 'statusPermission',
  offline: 'statusOffline',
  service: 'statusService',
};

const EMPTY_KEYS = {
  permission: 'emptyPermission',
  offline: 'emptyOffline',
  service: 'emptyOffline',
};

export function createAgenda(root, { getState, onSetupNeeded }) {
  const q = (selector) => root.querySelector(selector);
  const heading = q('[data-agenda-heading]');
  const count = q('[data-event-count]');
  const status = q('[data-sync-status]');
  const list = q('[data-event-list]');
  const legend = q('[data-calendar-list]');
  const refresh = q('[data-refresh-events]');

  const cache = new Map(); // диапазон -> ответ моста (только в памяти, на диск не пишем)
  let payload = null;
  let activeRange = '';
  let lastSelection = '';
  let calendarSignature = '';

  // Скрытые календари: выбор хранится в настройках расширения и переживает перезапуск Zen.
  const hidden = new Set();
  let hiddenLoaded = false;
  const hiddenReady = browser.storage.local
    .get('hiddenCalendars')
    .then(({ hiddenCalendars }) => {
      if (Array.isArray(hiddenCalendars)) for (const id of hiddenCalendars) hidden.add(String(id));
    })
    .catch(() => {})
    .finally(() => {
      hiddenLoaded = true;
    });

  function saveHidden() {
    browser.storage.local.set({ hiddenCalendars: [...hidden] }).catch(() => {});
  }

  /** События дня без скрытых календарей. */
  const visibleEvents = (key) => eventsForDay(payload, key).filter((event) => !hidden.has(String(event.calendarId)));
  let controller = null;
  let requestNumber = 0;
  let debounce = 0;
  let dayTransition = null;

  // ---------- Размытые края списка ----------
  // Показываем размытие только с той стороны, куда ещё можно прокрутить.

  const frame = list.closest('[data-event-frame]');

  function updateEdges() {
    frame.toggleAttribute('data-scroll-top', list.scrollTop > 1);
    frame.toggleAttribute('data-scroll-bottom', list.scrollHeight - list.clientHeight - list.scrollTop > 1);
  }

  list.addEventListener('scroll', updateEdges, { passive: true });
  // Высота содержимого меняется и без прокрутки — когда карточка раскрывается.
  const edgesObserver = new ResizeObserver(updateEdges);
  edgesObserver.observe(list);

  // ---------- Раскрытие карточки события ----------
  // Открыта может быть только одна карточка. Сама анимация — в CSS (home.css, .event-panel).

  let openKey = '';

  /**
   * Докрутить список так, чтобы карточка была видна целиком.
   * top и bottom — где карточка окажется, когда закончится анимация (координаты экрана).
   */
  function scrollIntoList(top, bottom) {
    // Отступ, как у списка сверху и снизу: карточка не уходит под размытый край.
    const gap = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const rect = list.getBoundingClientRect();
    const area = { top: rect.top + gap, bottom: rect.bottom - gap };
    let offset = 0;
    if (bottom > area.bottom) offset = Math.min(bottom - area.bottom, top - area.top);
    else if (top < area.top) offset = top - area.top;
    if (Math.abs(offset) > 1) list.scrollBy({ top: offset, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  function setOpen(item, open) {
    item.toggleAttribute('data-open', open);
    item.querySelector('.event-head').setAttribute('aria-expanded', String(open));
  }

  function toggleEvent(item) {
    const open = !item.hasAttribute('data-open');
    const panel = item.querySelector('.event-panel');
    list.style.removeProperty('--event-list-extra');
    // Итоговое положение считаем заранее, чтобы прокрутка шла вместе с раскрытием:
    // карточки выше, которые сейчас закроются, сдвинут эту вверх на высоту своих подробностей.
    let shift = 0;
    for (const other of list.querySelectorAll('.event[data-open]')) {
      if (other === item) continue;
      if (other.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING) {
        // Насколько открытая карточка выше закрытой (закрытая = строка с названием).
        shift += Math.max(0, other.getBoundingClientRect().height - other.querySelector('.event-head').offsetHeight - 2);
      }
      setOpen(other, false);
    }
    setOpen(item, open);
    openKey = open ? item.dataset.eventKey : '';
    if (!open) return;

    const bounds = item.getBoundingClientRect();
    // Подробности встают справа от названия (широкий экран) или под ним (узкий, см. home.css).
    const content = panel.firstElementChild.scrollHeight;
    const current = panel.getBoundingClientRect().height;
    const headHeight = item.querySelector('.event-head').offsetHeight;
    const beside = getComputedStyle(item).flexWrap === 'nowrap';
    const grow = beside ? Math.max(headHeight, content) - Math.max(headHeight, current) : content - current;
    // Пока карточка растёт, списку не хватает высоты и плавная прокрутка упёрлась бы в конец.
    // Временный запас снизу убираем в конце анимации.
    // Нужен, только если карточка вылезет за низ списка; иначе место отдаст пунктир в конце списка.
    const gap = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const overflows = bounds.bottom - shift + grow > list.getBoundingClientRect().bottom - gap;
    if (overflows && !reducedMotion.matches) list.style.setProperty('--event-list-extra', `${Math.max(0, grow)}px`);
    scrollIntoList(bounds.top - shift, bounds.bottom - shift + grow);
    // Страховка: в конце анимации проверяем ещё раз по настоящим размерам.
    const done = (event) => {
      if (event && (event.target !== panel || event.propertyName !== 'grid-template-rows')) return;
      panel.removeEventListener('transitionend', done);
      list.style.removeProperty('--event-list-extra');
      if (!item.hasAttribute('data-open')) return;
      const final = item.getBoundingClientRect();
      scrollIntoList(final.top, final.bottom);
    };
    if (!reducedMotion.matches) panel.addEventListener('transitionend', done);
  }

  list.addEventListener('click', (event) => {
    // Открывается и закрывается кликом в любом месте карточки,
    // кроме ссылок и случая, когда пользователь выделил текст мышкой.
    const item = event.target.closest('.event');
    if (!item || event.target.closest('a')) return;
    if (String(window.getSelection())) return;
    toggleEvent(item);
  });

  // ---------- Список календарей ----------

  let menuAnimation = null;
  let menuTargetOpen = false;

  function setCalendarMenu(open) {
    const panel = legend.querySelector('.calendar-list-items');
    if (!panel) return;
    const style = legend.open ? getComputedStyle(panel) : null;
    const start = { opacity: style?.opacity || '0', transform: style?.transform || 'translateY(-4px)' };
    menuAnimation?.cancel();
    menuTargetOpen = open;
    legend.open = true;
    legend.toggleAttribute('data-closing', !open);
    const finish = () => {
      legend.open = open;
      legend.removeAttribute('data-closing');
      menuAnimation = null;
    };
    if (reducedMotion.matches) {
      finish();
      return;
    }
    menuAnimation = panel.animate([start, { opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(-4px)' }], {
      duration: 220,
      easing: EASE,
    });
    menuAnimation.onfinish = finish;
  }

  legend.addEventListener('click', (event) => {
    const toggle = event.target.closest('.calendar-toggle');
    if (toggle) {
      const id = toggle.dataset.calendarId;
      if (hidden.has(id)) hidden.delete(id);
      else hidden.add(id);
      saveHidden();
      updateCalendarList();
      render();
      return;
    }
    if (event.target.closest('.calendar-show-all')) {
      for (const calendar of payload?.calendars || []) hidden.delete(String(calendar.id));
      saveHidden();
      updateCalendarList();
      legend.querySelector('.calendar-toggle')?.focus();
      render();
      return;
    }
    if (!event.target.closest('summary')) return;
    event.preventDefault();
    setCalendarMenu(menuAnimation ? !menuTargetOpen : !legend.open);
  });

  document.addEventListener('pointerdown', (event) => {
    if (legend.open && !legend.contains(event.target)) setCalendarMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && legend.open) {
      event.preventDefault();
      setCalendarMenu(false);
      legend.querySelector('summary')?.focus();
    }
  });

  function renderCalendarList() {
    const signature = JSON.stringify(payload?.calendars || []);
    if (signature === calendarSignature) return;
    calendarSignature = signature;
    menuAnimation?.cancel();
    menuAnimation = null;
    legend.open = false;
    legend.removeAttribute('data-closing');
    legend.replaceChildren();
    if (!payload) return;
    const summary = element('summary', 'calendar-list-title');
    summary.append(element('span', 'calendar-list-label'), downChevron());
    const items = element('ul', 'calendar-list-items');
    for (const calendar of payload.calendars) {
      const item = element('li', 'calendar-list-item');
      // Каждая строка — переключатель: клик скрывает календарь или показывает снова.
      const toggle = element('button', 'calendar-toggle');
      toggle.type = 'button';
      toggle.dataset.calendarId = String(calendar.id);
      const dot = element('span', 'calendar-dot');
      dot.style.setProperty('--dot', safeColor(calendar.color));
      dot.setAttribute('aria-hidden', 'true');
      toggle.append(dot, element('span', 'calendar-name', calendar.title + (calendar.source ? ` · ${calendar.source}` : '')), checkMark());
      item.append(toggle);
      items.append(item);
    }
    const showAll = element('li', 'calendar-list-footer');
    const showAllButton = element('button', 'calendar-show-all', t('showAll'));
    showAllButton.type = 'button';
    showAll.append(showAllButton);
    items.append(showAll);
    legend.append(summary, items);
    updateCalendarList();
  }

  /** Обновить отметки и подпись «Календари · 4 из 6», не пересобирая меню (оно остаётся открытым). */
  function updateCalendarList() {
    if (!payload) return;
    const total = payload.calendars.length;
    let shown = 0;
    for (const toggle of legend.querySelectorAll('.calendar-toggle')) {
      const visible = !hidden.has(toggle.dataset.calendarId);
      if (visible) shown += 1;
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.title = t(visible ? 'hideCalendar' : 'showCalendar');
    }
    legend.querySelector('.calendar-list-label').textContent =
      shown === total ? t('calendarsAll', { total }) : t('calendarsSome', { shown, total });
    legend.querySelector('.calendar-list-footer').hidden = shown === total;
  }

  // ---------- Карточка события ----------

  function describe(fields, label, value) {
    if (!value) return;
    const field = element('div', 'event-field');
    const valueElement = element('dd', 'event-field-value');
    valueElement.append(value);
    field.append(element('dt', 'event-field-name', label), valueElement);
    fields.append(field);
  }

  /** Время и дата события одной строкой. */
  function whenText(event) {
    if (event.allDay) {
      const { first, last } = allDayRange(event);
      const full = fullDayFormat();
      return last > first ? `${full.format(first)} — ${full.format(last)}` : full.format(first);
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (start.getTime() === end.getTime()) return dateTimeFormat().format(start);
    if (dateKey(start) === dateKey(end)) return `${shortDayFormat().format(start)}, ${formatTime(start)}–${formatTime(end)}`;
    return `${dateTimeFormat().format(start)} — ${dateTimeFormat().format(end)}`;
  }

  const monthShort = (date) => dateFormat({ month: 'short' }).format(date).replace('.', '').slice(0, 3);

  /** Число с подписью под ним внутри листка: «25» и «ср 10:00». */
  function tilePoint(date, time) {
    const point = element('span', 'event-when-point');
    const caption = element('span', 'event-when-caption', weekdayShort(date));
    if (time) caption.append(' ', element('span', 'event-when-caption-time', time));
    point.append(element('span', 'event-when-day', String(date.getDate())), caption);
    return point;
  }

  /** Листок календаря для события на несколько дней: месяц сверху, «25 – 27», под числами дни недели (и время). */
  function dateTile(first, last, startTime = '', endTime = '') {
    const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
    const tile = element('span', 'event-when-tile event-when-tile-range');
    tile.setAttribute('aria-hidden', 'true');
    const month = element('span', 'event-when-month', monthShort(first));
    // Между месяцами — короткая черта, а не символ «–».
    if (!sameMonth) month.append(element('span', 'event-when-month-sep'), monthShort(last));
    const span = element('span', 'event-when-span');
    span.append(tilePoint(first, startTime), element('span', 'event-when-sep'), tilePoint(last, endTime));
    tile.append(month, span);
    return tile;
  }

  /**
   * Такой же листок для события в пределах одного дня: сверху длительность,
   * крупно «13:15 – 14:45» (у события без длительности — одно время).
   */
  function timeTile(startTime, endTime, duration) {
    const tile = element('span', 'event-when-tile event-when-tile-range event-when-tile-time');
    tile.setAttribute('aria-hidden', 'true');
    const span = element('span', 'event-when-span');
    const point = (time) => {
      const item = element('span', 'event-when-point');
      item.append(element('span', 'event-when-day', time));
      return item;
    };
    span.append(point(startTime));
    if (endTime) span.append(element('span', 'event-when-sep'), point(endTime));
    if (duration) tile.append(element('span', 'event-when-month', duration));
    tile.append(span);
    return tile;
  }

  /**
   * Блок «Когда». Событие со временем в пределах дня — листок со временем и длительностью.
   * Несколько дней — листок с датами «25 – 27», рядом длительность. Весь день — просто текст.
   */
  function whenBlock(event) {
    let first;
    let last;
    let main;
    let sub;
    let startTime = '';
    let lastTime = '';
    let tile = null;
    if (event.allDay) {
      ({ first, last } = allDayRange(event));
      const days = Math.round((last - first) / 86400000) + 1;
      main = days > 1 ? plural('days', days) : t('allDay');
      sub = days > 1 ? t('allDayLower') : '';
    } else {
      first = new Date(event.start);
      const end = new Date(event.end);
      // Событие до полуночи (22:00–00:00) считаем однодневным; конец раньше начала — тоже один день.
      last = end > first ? new Date(end.getTime() - 1) : first;
      startTime = formatTime(first);
      const endTime = formatTime(end);
      const duration = durationText(end - first);
      if (dateKey(first) === dateKey(last)) {
        // Дату и день недели не повторяем: агенда и так показывает один выбранный день.
        tile = timeTile(startTime, end > first ? endTime : '', duration);
      } else {
        // Конец ровно в полночь показываем как 24:00 предыдущего дня.
        lastTime = dateKey(last) !== dateKey(end) ? '24:00' : endTime;
        main = duration;
        sub = '';
      }
    }

    const block = element('div', 'event-when');
    block.setAttribute('role', 'group');
    block.setAttribute('aria-label', t('when', { text: whenText(event) }));
    // Листок с датами нужен только событиям на несколько дней: один день и так выбран в календаре.
    if (dateKey(first) !== dateKey(last)) block.append(dateTile(first, last, startTime, lastTime));
    if (tile) {
      block.append(tile);
      return block;
    }
    const text = element('span', 'event-when-text');
    text.setAttribute('aria-hidden', 'true');
    text.append(element('span', 'event-when-main', main));
    if (sub) text.append(element('span', 'event-when-sub', sub));
    block.append(text);
    return block;
  }

  let eventNumber = 0;

  function eventCard(event, calendar, selected) {
    const item = element('article', 'event');
    item.dataset.eventKey = `${event.eventIdentifier || event.id}|${event.start}`;
    const panelId = `event-panel-${++eventNumber}`;

    const head = element('button', 'event-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    head.setAttribute('aria-controls', panelId);
    const dot = element('span', 'event-color');
    dot.setAttribute('aria-hidden', 'true');
    // Капсула с календарём видна без разворота карточки.
    item.style.setProperty('--calendar', safeColor(calendar.color));
    const tag = element('span', 'event-calendar');
    tag.title = calendar.title;
    tag.append(dot, element('span', 'event-calendar-name', calendar.title));
    const timing = element('span', 'event-timing');
    timing.append(tag, element('span', 'event-time', eventTime(event, selected)));
    const text = element('span', 'event-summary-text');
    const title = element('span', 'event-title', event.title || t('untitled'));
    title.title = title.textContent; // в раскрытой карточке длинное название обрезается «…»
    text.append(timing, title);
    head.append(text);

    const fields = element('dl', 'event-fields');
    describe(fields, t('location'), event.location || event.structuredLocation?.title);
    const url = safeURL(event.url);
    if (url) {
      const link = element('a', 'event-url', url.host.replace(/^www\./, ''));
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      describe(fields, t('link'), link);
    }
    if (event.recurrence?.length) describe(fields, t('recurrence'), event.recurrence.map(recurrenceText).join('; '));
    if (event.alarms?.length) describe(fields, t('alarms'), event.alarms.map(alarmText).join('; '));
    if (event.attendees?.length) describe(fields, t('attendees'), event.attendees.map(personName).filter(Boolean).join(', '));

    const body = element('div', 'event-body');
    body.append(whenBlock(event));
    if (fields.childElementCount) body.append(fields);
    const inner = element('div', 'event-panel-inner');
    inner.append(body);
    const panel = element('div', 'event-panel');
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', event.title || t('event'));
    panel.append(inner);

    // Подробности выезжают справа налево в ту же строку, что и название (см. home.css).
    // Стрелка — отдельный элемент справа: по клику на неё карточка тоже раскрывается.
    const toggle = element('span', 'event-toggle');
    toggle.setAttribute('aria-hidden', 'true'); // для клавиатуры и чтения с экрана есть кнопка с названием
    const circle = element('span', 'event-toggle-circle');
    circle.append(drawerChevron());
    toggle.append(circle);
    item.append(head, panel, toggle);
    return item;
  }

  // ---------- Ширина подробностей ----------
  // Если подробности переносятся на две строки, блок по умолчанию занимает всю допустимую ширину,
  // и справа остаётся пустота. Подгоняем ширину под самую длинную строку: тогда строки начинаются
  // от одной линии слева, а весь блок прижат к стрелке.

  const stacked = window.matchMedia('(max-width: 760px)');

  function fitBody(body) {
    body.style.removeProperty('width');
    if (stacked.matches) return;
    const box = body.getBoundingClientRect();
    if (!box.width) return;
    let right = box.left;
    for (const part of body.querySelectorAll('.event-when, .event-field')) right = Math.max(right, part.getBoundingClientRect().right);
    const style = getComputedStyle(body);
    const width = right - box.left + parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth);
    if (width < box.width - 1) body.style.width = `${Math.ceil(width)}px`;
  }

  const fitBodies = () => list.querySelectorAll('.event-body').forEach(fitBody);

  // Ширина зависит от шрифта: пересчитываем, когда он догрузится, и при изменении окна.
  document.fonts?.ready.then(fitBodies);
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitBodies, 100);
  });

  // ---------- Отрисовка ----------

  /** Пунктирная строка «Больше событий нет» в конце списка (растягивается до низа блока). */
  function restOfDay() {
    const rest = element('div', 'agenda-rest');
    rest.append(element('p', 'agenda-empty-note', t('noMoreEvents')));
    return rest;
  }

  /** Заглушка на всю высоту списка: пунктирная рамка и надпись по центру. */
  function emptyState(title, note) {
    const box = element('div', 'agenda-empty');
    box.append(element('p', 'agenda-empty-title', title));
    if (note) box.append(element('p', 'agenda-empty-note', note));
    return box;
  }

  function decorateDays() {
    for (const button of root.querySelectorAll('.day[data-date]')) {
      button.querySelector('.event-dots')?.remove();
      button.removeAttribute('title');
      if (!payload) continue;
      const events = visibleEvents(button.dataset.date);
      if (!events.length) continue;
      const dots = element('span', 'event-dots');
      dots.setAttribute('aria-hidden', 'true');
      const calendarIds = [...new Set(events.map((event) => event.calendarId))].slice(0, 3);
      for (const id of calendarIds) {
        const dot = element('span', 'event-day-dot');
        dot.style.backgroundColor = safeColor(payload.calendars.find((calendar) => calendar.id === id)?.color);
        dots.append(dot);
      }
      button.append(dots);
      button.title = t('eventsCount', { n: events.length });
    }
  }

  function render(emptyKey) {
    // Пока не прочитан список скрытых календарей, не рисуем: иначе их события мелькнут.
    if (!hiddenLoaded && payload) {
      hiddenReady.then(() => render(emptyKey));
      return;
    }
    const current = getState();
    const selectionChanged = lastSelection !== current.selected;
    const previousScroll = list.scrollTop;
    heading.textContent = dayFormat().format(parseKey(current.selected));

    const fragment = document.createDocumentFragment();
    if (payload) {
      const events = visibleEvents(current.selected);
      count.textContent = events.length ? String(events.length) : '';
      if (!events.length) {
        // Отличаем «событий нет» от «все события в скрытых календарях».
        const hiddenCount = eventsForDay(payload, current.selected).length;
        fragment.append(hiddenCount ? emptyState(t('hiddenTitle'), t('hiddenNote')) : emptyState(t('noEvents'), t('freeDay')));
      }
      for (const event of events) {
        const calendar = payload.calendars.find((item) => item.id === event.calendarId) || {};
        const item = eventCard(event, calendar, current.selected);
        if (!selectionChanged && item.dataset.eventKey === openKey) setOpen(item, true);
        fragment.append(item);
      }
      if (events.length) fragment.append(restOfDay());
    } else {
      count.textContent = '';
      fragment.append(emptyState(t(emptyKey || 'connecting')));
      lastEmptyKey = emptyKey || '';
    }
    list.replaceChildren(fragment);
    fitBodies();
    list.style.removeProperty('--event-list-extra');
    edgesObserver.disconnect();
    edgesObserver.observe(list);
    for (const item of list.children) edgesObserver.observe(item);
    // Если открытого события больше нет (другой день, удалено) — забываем его.
    openKey = list.querySelector('.event[data-open]')?.dataset.eventKey || '';
    renderCalendarList();

    list.scrollTop = selectionChanged ? 0 : previousScroll;
    if (selectionChanged && lastSelection && !reducedMotion.matches) {
      dayTransition?.cancel();
      dayTransition = list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: EASE });
    }
    lastSelection = current.selected;
    decorateDays();
  }

  const rangeOf = (state) => `${state.start}/${state.end}`;

  // Что сейчас написано в строке статуса — чтобы перевести её при смене языка.
  let statusState = { key: '' };
  let lastEmptyKey = '';

  function showStatus(state) {
    statusState = state;
    if (state.key === 'updated') status.textContent = t('updated', { time: formatTime(new Date(state.updatedAt)) });
    else status.textContent = state.key ? t(state.key) : '';
  }

  function setStatus(updatedAt) {
    showStatus({ key: 'updated', updatedAt });
  }

  async function load(force = false) {
    const current = getState();
    const range = rangeOf(current);
    if (!current.start) return;

    const cached = cache.get(range);
    if (!force && cached && Date.now() - Date.parse(cached.updatedAt) < FRESH_FOR) {
      payload = cached;
      render();
      setStatus(cached.updatedAt);
      refresh.disabled = false;
      return;
    }

    controller?.abort();
    controller = new AbortController();
    const number = ++requestNumber;
    refresh.disabled = true;
    showStatus({ key: 'updating' });
    try {
      const data = await bridgeGet('/v1/events', { start: current.start, end: current.end }, { signal: controller.signal });
      if (number !== requestNumber) return;
      if (
        data.access !== 'granted' ||
        data.start !== current.start ||
        data.end !== current.end ||
        !Array.isArray(data.events) ||
        !Array.isArray(data.calendars)
      ) {
        throw new Error('service');
      }
      cache.set(range, data);
      if (cache.size > MAX_CACHED_RANGES) cache.delete(cache.keys().next().value);
      if (range === activeRange) {
        payload = data;
        render();
      }
      setStatus(data.updatedAt);
    } catch (error) {
      if (number !== requestNumber || error.name === 'AbortError') return;
      const code = error.message in STATUS_KEYS ? error.message : 'service';
      showStatus({ key: STATUS_KEYS[code] });
      if (code === 'no_token' || code === 'unauthorized') {
        payload = null;
        render();
        onSetupNeeded(list);
      } else if (!payload) {
        render(EMPTY_KEYS[code]);
      }
    } finally {
      if (number === requestNumber) refresh.disabled = false;
    }
  }

  /** Вызывается календарём при каждой перерисовке сетки (смена дня или месяца). */
  function update(state) {
    const range = rangeOf(state);
    if (range !== activeRange) {
      activeRange = range;
      requestNumber += 1;
      controller?.abort();
      payload = cache.get(range) || null;
    }
    render();
    clearTimeout(debounce);
    debounce = setTimeout(() => load(false), 60);
  }

  refresh.addEventListener('click', () => load(true));

  /** Перевести всё на новый язык: карточки, меню календарей, статус. */
  function relabel() {
    calendarSignature = '';
    render(payload ? undefined : lastEmptyKey);
    showStatus(statusState);
  }

  return { update, load, relabel };
}
