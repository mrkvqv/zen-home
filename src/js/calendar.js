// Часы, дата и сетка месяца. Сообщает наружу о смене выбранного дня через onChange.

import { addDays, dateKey, parseKey, sameMonth, sideChevron } from './dom.js';

const fullDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const longDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const clockFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });

export function createCalendar(root, { onChange }) {
  const q = (selector) => root.querySelector(selector);
  const clock = q('[data-clock]');
  const dateLabel = q('[data-date]');
  const section = q('.calendar');
  const monthLabel = q('[data-month-label]');
  const monthTable = q('.month-grid');
  const dayRows = q('[data-days]');
  const selectedLabel = q('[data-selected-date]');
  const todayButton = q('[data-today]');

  let selected = parseKey(dateKey(new Date()));
  let view = new Date(selected.getFullYear(), selected.getMonth(), 1);
  let lastToday = '';
  let followToday = true;
  let range = { start: '', end: '' };

  function render() {
    const now = new Date();
    const today = dateKey(now);
    const selectedKey = dateKey(selected);
    const offset = (view.getDay() + 6) % 7; // неделя начинается с понедельника
    const title = monthFormat.format(view).replace(' г.', '');

    monthLabel.textContent = title;
    monthTable.setAttribute('aria-label', title);
    selectedLabel.textContent = shortDate.format(selected);
    selectedLabel.dateTime = selectedKey;
    todayButton.disabled = selectedKey === today && sameMonth(view, now);

    const fragment = document.createDocumentFragment();
    const first = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
    let selectedVisible = false;
    for (let week = 0; week < 6; week++) {
      const row = document.createElement('tr');
      for (let weekday = 0; weekday < 7; weekday++) {
        const value = addDays(first, week * 7 + weekday);
        const key = dateKey(value);
        const isSelected = key === selectedKey;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'day';
        button.dataset.date = key;
        button.textContent = value.getDate();
        button.setAttribute('aria-label', fullDate.format(value));
        button.setAttribute('aria-pressed', String(isSelected));
        button.tabIndex = isSelected ? 0 : -1;
        if (isSelected) selectedVisible = true;
        if (!sameMonth(value, view)) button.classList.add('outside');
        if (weekday > 4) button.classList.add('weekend');
        if (key === today) button.setAttribute('aria-current', 'date');
        const cell = document.createElement('td');
        cell.append(button);
        row.append(cell);
      }
      fragment.append(row);
    }
    dayRows.replaceChildren(fragment);
    if (!selectedVisible) q('.day:not(.outside)').tabIndex = 0;

    range = { start: dateKey(first), end: dateKey(addDays(first, 42)) };
    onChange(state());
  }

  /** Текущее состояние: выбранный день и видимый диапазон (42 дня сетки, конец не включён). */
  function state() {
    return { selected: dateKey(selected), ...range };
  }

  function select(value, focusDay = false) {
    selected = parseKey(dateKey(value));
    view = new Date(selected.getFullYear(), selected.getMonth(), 1);
    followToday = dateKey(selected) === dateKey(new Date());
    render();
    if (focusDay) q('.day[aria-pressed="true"]').focus({ preventScroll: true });
  }

  root.querySelectorAll('[data-step-month]').forEach((button) => {
    const step = Number(button.dataset.stepMonth);
    button.append(sideChevron(step));
    button.addEventListener('click', () => {
      const target = new Date(view.getFullYear(), view.getMonth() + step, 1);
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      select(new Date(target.getFullYear(), target.getMonth(), Math.min(selected.getDate(), last)));
    });
  });

  root.querySelectorAll('[data-step-day]').forEach((button) => {
    const step = Number(button.dataset.stepDay);
    button.append(sideChevron(step));
    button.addEventListener('click', () => select(addDays(selected, step)));
  });

  dayRows.addEventListener('click', (event) => {
    const day = event.target.closest('[data-date]');
    if (day && dayRows.contains(day)) select(parseKey(day.dataset.date), true);
  });

  // Управление с клавиатуры: стрелки, Home/End (неделя), PageUp/PageDown (месяц).
  section.addEventListener('keydown', (event) => {
    const day = event.target.closest('.day');
    if (!day || event.ctrlKey || event.metaKey || event.altKey) return;
    const value = parseKey(day.dataset.date);
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next;
    if (event.key in deltas) {
      next = addDays(value, deltas[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      const offset = (value.getDay() + 6) % 7;
      next = addDays(value, -offset + (event.key === 'End' ? 6 : 0));
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const delta = event.key === 'PageUp' ? -1 : 1;
      const last = new Date(value.getFullYear(), value.getMonth() + delta + 1, 0).getDate();
      next = new Date(value.getFullYear(), value.getMonth() + delta, Math.min(value.getDate(), last));
    } else {
      return;
    }
    event.preventDefault();
    select(next, true);
  });

  todayButton.addEventListener('click', () => select(new Date()));

  // Часы обновляются ровно на смене минуты, а не каждую секунду.
  let timer = 0;
  function tick() {
    const now = new Date();
    const today = dateKey(now);
    const time = clockFormat.format(now);
    if (clock.textContent !== time) {
      clock.textContent = time;
      clock.setAttribute('aria-label', `Текущее время, ${time}`);
    }
    clock.dateTime = `${today}T${time}`;
    if (lastToday !== today) {
      lastToday = today;
      if (followToday) {
        selected = parseKey(today);
        view = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateLabel.textContent = longDate.format(now);
      dateLabel.dateTime = today;
      render();
    }
    clearTimeout(timer);
    timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 20);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });

  return { start: tick, state };
}
