// События выбранного дня, точки событий в сетке месяца и список календарей.

import { bridgeGet } from './bridge.js';
import { addDays, dateKey, downChevron, EASE, element, parseKey, reducedMotion } from './dom.js';

const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
const fullDayFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' });
const shortDayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

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
      (a, b) => Number(b.allDay) - Number(a.allDay) || Date.parse(a.start) - Date.parse(b.start) || a.title.localeCompare(b.title, 'ru'),
    );
}

function eventTime(event, key) {
  if (event.allDay) return 'Весь день';
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayStart = parseKey(key);
  const nextDay = addDays(dayStart, 1);
  if (start.getTime() === end.getTime()) return timeFormat.format(start);
  if (start < dayStart && end >= nextDay) return 'Продолжается';
  if (start < dayStart) return `до ${timeFormat.format(end)}`;
  if (end > nextDay) return `с ${timeFormat.format(start)}`;
  return `${timeFormat.format(start)}–${timeFormat.format(end)}`;
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
  const single = ['Каждый день', 'Каждую неделю', 'Каждый месяц', 'Каждый год'];
  const units = [
    ['день', 'дня', 'дней'],
    ['неделю', 'недели', 'недель'],
    ['месяц', 'месяца', 'месяцев'],
    ['год', 'года', 'лет'],
  ];
  const n = rule.interval;
  const last = n % 10;
  const hundred = n % 100;
  const form = hundred >= 11 && hundred <= 14 ? 2 : last === 1 ? 0 : last >= 2 && last <= 4 ? 1 : 2;
  let label = n === 1 ? single[rule.frequency] || 'Повторяется' : `Раз в ${n} ${units[rule.frequency]?.[form] || 'периодов'}`;
  if (rule.daysOfWeek?.length) {
    const names = ['', 'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    label += `, ${rule.daysOfWeek
      .map((value) => names[value.day])
      .filter(Boolean)
      .join(', ')}`;
  }
  if (rule.daysOfMonth?.length) label += `, числа: ${rule.daysOfMonth.join(', ')}`;
  if (rule.end?.date) label += `, до ${fullDayFormat.format(new Date(rule.end.date))}`;
  if (rule.end?.count) label += `, ${rule.end.count} повторений`;
  return label;
}

function alarmText(alarm) {
  if (alarm.absoluteDate) return dateTimeFormat.format(new Date(alarm.absoluteDate));
  const seconds = Number(alarm.relativeOffset);
  if (!seconds) return 'В момент события';
  let minutes = Math.round(Math.abs(seconds) / 60);
  const days = Math.floor(minutes / 1440);
  minutes %= 1440;
  const hours = Math.floor(minutes / 60);
  minutes %= 60;
  const duration = [days && `${days} дн.`, hours && `${hours} ч.`, minutes && `${minutes} мин.`].filter(Boolean).join(' ');
  return (seconds < 0 ? 'За ' : 'Через ') + (duration || 'меньше минуты');
}

const STATUS_TEXT = {
  no_token: 'Мост не настроен',
  unauthorized: 'Неверный ключ моста',
  permission: 'Нужен доступ к Календарю',
  offline: 'Мост календаря не отвечает',
  service: 'Календарь временно недоступен',
};

const EMPTY_TEXT = {
  permission: 'Разреши доступ Zen Calendar Bridge в настройках macOS: «Конфиденциальность и безопасность → Календари».',
  offline: 'Локальный помощник не отвечает. Нажми «Обновить», чтобы повторить подключение.',
  service: 'Локальный помощник не отвечает. Нажми «Обновить», чтобы повторить подключение.',
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
        shift += other.querySelector('.event-panel').getBoundingClientRect().height;
      }
      setOpen(other, false);
    }
    setOpen(item, open);
    openKey = open ? item.dataset.eventKey : '';
    if (!open) return;

    const bounds = item.getBoundingClientRect();
    const grow = panel.firstElementChild.scrollHeight - panel.getBoundingClientRect().height;
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
    // Открывается и закрывается только по верхней части карточки (кнопка с названием).
    const head = event.target.closest('.event-head');
    if (head) toggleEvent(head.closest('.event'));
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
    summary.append(element('span', '', `Календари · ${payload.calendars.length}`), downChevron());
    const items = element('ul', 'calendar-list-items');
    for (const calendar of payload.calendars) {
      const item = element('li', 'calendar-list-item');
      const dot = element('span', 'event-color');
      dot.style.backgroundColor = safeColor(calendar.color);
      dot.setAttribute('aria-hidden', 'true');
      item.append(dot, element('span', '', calendar.title + (calendar.source ? ` · ${calendar.source}` : '')));
      items.append(item);
    }
    legend.append(summary, items);
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
      const first = parseKey(event.startDay);
      const last = addDays(parseKey(event.endDay), -1);
      return last > first ? `${fullDayFormat.format(first)} — ${fullDayFormat.format(last)}` : fullDayFormat.format(first);
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (start.getTime() === end.getTime()) return dateTimeFormat.format(start);
    if (dateKey(start) === dateKey(end)) return `${shortDayFormat.format(start)}, ${timeFormat.format(start)}–${timeFormat.format(end)}`;
    return `${dateTimeFormat.format(start)} — ${dateTimeFormat.format(end)}`;
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
    dot.style.backgroundColor = safeColor(calendar.color);
    dot.setAttribute('aria-hidden', 'true');
    const timing = element('span', 'event-timing');
    timing.append(dot, element('span', 'event-time', eventTime(event, selected)));
    const text = element('span', 'event-summary-text');
    text.append(timing, element('span', 'event-title', event.title || 'Без названия'));
    head.append(text, downChevron('event-expand'));

    const fields = element('dl', 'event-fields');
    describe(fields, 'Когда', whenText(event));
    describe(fields, 'Календарь', calendar.title);
    describe(fields, 'Место', event.location || event.structuredLocation?.title);
    const url = safeURL(event.url);
    if (url) {
      const link = element('a', 'event-url', url.host.replace(/^www\./, ''));
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      describe(fields, 'Ссылка', link);
    }
    if (event.recurrence?.length) describe(fields, 'Повтор', event.recurrence.map(recurrenceText).join('; '));
    if (event.alarms?.length) describe(fields, 'Напоминания', event.alarms.map(alarmText).join('; '));
    if (event.attendees?.length) describe(fields, 'Участники', event.attendees.map(personName).filter(Boolean).join(', '));

    const body = element('div', 'event-body');
    body.append(fields);
    const inner = element('div', 'event-panel-inner');
    inner.append(body);
    const panel = element('div', 'event-panel');
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', event.title || 'Событие');
    panel.append(inner);

    item.append(head, panel);
    return item;
  }

  // ---------- Отрисовка ----------

  /** Пунктирная строка «Больше событий нет» в конце списка (растягивается до низа блока). */
  function restOfDay() {
    const rest = element('div', 'agenda-rest');
    rest.append(element('p', 'agenda-empty-note', 'Больше событий нет'));
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
      const events = eventsForDay(payload, button.dataset.date);
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
      button.title = `Событий: ${events.length}`;
    }
  }

  function render(emptyText) {
    const current = getState();
    const selectionChanged = lastSelection !== current.selected;
    const previousScroll = list.scrollTop;
    heading.textContent = dayFormat.format(parseKey(current.selected));

    const fragment = document.createDocumentFragment();
    if (payload) {
      const events = eventsForDay(payload, current.selected);
      count.textContent = events.length ? String(events.length) : '';
      if (!events.length) fragment.append(emptyState('На этот день событий нет', 'День свободен'));
      for (const event of events) {
        const calendar = payload.calendars.find((item) => item.id === event.calendarId) || {};
        const item = eventCard(event, calendar, current.selected);
        if (!selectionChanged && item.dataset.eventKey === openKey) setOpen(item, true);
        fragment.append(item);
      }
      if (events.length) fragment.append(restOfDay());
    } else {
      count.textContent = '';
      fragment.append(emptyState(emptyText || 'Подключение к календарю…'));
    }
    list.replaceChildren(fragment);
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

  function setStatus(updatedAt) {
    status.textContent = `Календарь · обновлено ${timeFormat.format(new Date(updatedAt))}`;
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
    status.textContent = 'Обновление…';
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
      const code = error.message in STATUS_TEXT ? error.message : 'service';
      status.textContent = STATUS_TEXT[code];
      if (code === 'no_token' || code === 'unauthorized') {
        payload = null;
        render();
        onSetupNeeded(list);
      } else if (!payload) {
        render(EMPTY_TEXT[code]);
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

  return { update, load };
}
