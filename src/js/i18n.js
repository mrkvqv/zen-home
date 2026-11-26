// Языки страницы: русский, английский, польский, белорусский.
// Выбор хранится в storage.local; по умолчанию — язык браузера, если он есть в списке, иначе английский.

export const LANGUAGES = {
  ru: { tag: 'ru-RU', name: 'Русский', short: 'RU' },
  en: { tag: 'en-GB', name: 'English', short: 'EN' },
  pl: { tag: 'pl-PL', name: 'Polski', short: 'PL' },
  be: { tag: 'be-BY', name: 'Беларуская', short: 'BY' },
};

// Строка с {name} подставляет значения; объект — формы для чисел (one, few, many, other).
const STRINGS = {
  ru: {
    pageLabel: 'Стартовая страница',
    pinsLabel: 'Закреплённые вкладки Zen',
    calendarLabel: 'Календарь',
    prevMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    prevDay: 'Предыдущий день',
    nextDay: 'Следующий день',
    today: 'Сегодня',
    agendaLabel: 'События календаря',
    refresh: 'Обновить',
    setupBefore: 'Чтобы показать Essentials и события, расширению нужен ключ локального моста календаря. Скопируй его командой',
    setupAfter: 'в папке проекта и вставь сюда.',
    bridgeKey: 'Ключ моста',
    save: 'Сохранить',
    setupDenied: 'Без доступа к 127.0.0.1:8766 расширение не сможет получить события. Попробуй ещё раз и нажми «Разрешить».',
    language: 'Язык',
    currentTime: 'Текущее время, {time}',

    allDay: 'Весь день',
    allDayLower: 'весь день',
    ongoing: 'Продолжается',
    untilTime: 'до {time}',
    fromTime: 'с {time}',
    days: { one: '{n} день', few: '{n} дня', many: '{n} дней', other: '{n} дня' },
    durationDays: '{n} д',
    durationHours: '{n} ч',
    durationMinutes: '{n} мин',
    lessThanMinute: 'меньше минуты',

    repeatEvery: ['Каждый день', 'Каждую неделю', 'Каждый месяц', 'Каждый год'],
    repeatEveryN: 'Раз в {n} {unit}',
    repeatUnits: [
      { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
      { one: 'неделю', few: 'недели', many: 'недель', other: 'недели' },
      { one: 'месяц', few: 'месяца', many: 'месяцев', other: 'месяца' },
      { one: 'год', few: 'года', many: 'лет', other: 'года' },
    ],
    repeatUnitFallback: 'периодов',
    repeats: 'Повторяется',
    repeatDaysOfMonth: 'числа: {list}',
    repeatUntil: 'до {date}',
    repeatCount: { one: '{n} повторение', few: '{n} повторения', many: '{n} повторений', other: '{n} повторения' },
    alarmAtStart: 'В момент события',
    alarmBefore: 'За {time}',
    alarmAfter: 'Через {time}',

    statusNoToken: 'Мост не настроен',
    statusUnauthorized: 'Неверный ключ моста',
    statusPermission: 'Нужен доступ к Календарю',
    statusOffline: 'Мост календаря не отвечает',
    statusService: 'Календарь временно недоступен',
    emptyPermission: 'Разреши доступ Zen Calendar Bridge в настройках macOS: «Конфиденциальность и безопасность → Календари».',
    emptyOffline: 'Локальный помощник не отвечает. Нажми «Обновить», чтобы повторить подключение.',

    showAll: 'Показать все',
    hideCalendar: 'Скрыть события этого календаря',
    showCalendar: 'Показать события этого календаря',
    calendarsAll: 'Календари · {total}',
    calendarsSome: 'Календари · {shown} из {total}',

    when: 'Когда: {text}',
    untitled: 'Без названия',
    location: 'Место',
    link: 'Ссылка',
    recurrence: 'Повтор',
    alarms: 'Напоминания',
    attendees: 'Участники',
    event: 'Событие',
    noMoreEvents: 'Больше событий нет',
    eventsCount: 'Событий: {n}',
    hiddenTitle: 'События этого дня скрыты',
    hiddenNote: 'Их календари выключены в меню «Календари»',
    noEvents: 'На этот день событий нет',
    freeDay: 'День свободен',
    connecting: 'Подключение к календарю…',
    updated: 'Календарь · обновлено {time}',
    updating: 'Обновление…',

    noPins: 'Закреплённых вкладок пока нет',
    pinsFailed: 'Не удалось загрузить закреплённые вкладки',
    pinMissing: 'Закреплённая вкладка не найдена. Открой сайт с зажатой ⌘, чтобы открыть его в новой вкладке.',
    pinFailed: 'Не удалось переключить вкладку. Попробуй ещё раз.',
  },

  en: {
    pageLabel: 'Start page',
    pinsLabel: 'Pinned Zen tabs',
    calendarLabel: 'Calendar',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    today: 'Today',
    agendaLabel: 'Calendar events',
    refresh: 'Refresh',
    setupBefore: 'To show Essentials and events, the extension needs the key of the local calendar bridge. Copy it with',
    setupAfter: 'in the project folder and paste it here.',
    bridgeKey: 'Bridge key',
    save: 'Save',
    setupDenied: 'Without access to 127.0.0.1:8766 the extension can’t load events. Try again and click “Allow”.',
    language: 'Language',
    currentTime: 'Current time, {time}',

    allDay: 'All day',
    allDayLower: 'all day',
    ongoing: 'Ongoing',
    untilTime: 'until {time}',
    fromTime: 'from {time}',
    days: { one: '{n} day', other: '{n} days' },
    durationDays: '{n} d',
    durationHours: '{n} h',
    durationMinutes: '{n} min',
    lessThanMinute: 'less than a minute',

    repeatEvery: ['Every day', 'Every week', 'Every month', 'Every year'],
    repeatEveryN: 'Every {n} {unit}',
    repeatUnits: [
      { one: 'day', other: 'days' },
      { one: 'week', other: 'weeks' },
      { one: 'month', other: 'months' },
      { one: 'year', other: 'years' },
    ],
    repeatUnitFallback: 'periods',
    repeats: 'Repeats',
    repeatDaysOfMonth: 'on days {list}',
    repeatUntil: 'until {date}',
    repeatCount: { one: '{n} time', other: '{n} times' },
    alarmAtStart: 'At time of event',
    alarmBefore: '{time} before',
    alarmAfter: '{time} after',

    statusNoToken: 'Bridge is not set up',
    statusUnauthorized: 'Wrong bridge key',
    statusPermission: 'Calendar access needed',
    statusOffline: 'Calendar bridge is not responding',
    statusService: 'Calendar is temporarily unavailable',
    emptyPermission: 'Allow Zen Calendar Bridge in macOS settings: “Privacy & Security → Calendars”.',
    emptyOffline: 'The local helper is not responding. Click “Refresh” to reconnect.',

    showAll: 'Show all',
    hideCalendar: 'Hide events from this calendar',
    showCalendar: 'Show events from this calendar',
    calendarsAll: 'Calendars · {total}',
    calendarsSome: 'Calendars · {shown} of {total}',

    when: 'When: {text}',
    untitled: 'Untitled',
    location: 'Location',
    link: 'Link',
    recurrence: 'Repeat',
    alarms: 'Alerts',
    attendees: 'Attendees',
    event: 'Event',
    noMoreEvents: 'No more events',
    eventsCount: 'Events: {n}',
    hiddenTitle: 'Events of this day are hidden',
    hiddenNote: 'Their calendars are turned off in the “Calendars” menu',
    noEvents: 'No events on this day',
    freeDay: 'The day is free',
    connecting: 'Connecting to the calendar…',
    updated: 'Calendar · Updated {time}',
    updating: 'Updating…',

    noPins: 'No pinned tabs yet',
    pinsFailed: 'Couldn’t load pinned tabs',
    pinMissing: 'Pinned tab not found. Hold ⌘ while clicking to open the site in a new tab.',
    pinFailed: 'Couldn’t switch to the tab. Try again.',
  },

  pl: {
    pageLabel: 'Strona startowa',
    pinsLabel: 'Przypięte karty Zen',
    calendarLabel: 'Kalendarz',
    prevMonth: 'Poprzedni miesiąc',
    nextMonth: 'Następny miesiąc',
    prevDay: 'Poprzedni dzień',
    nextDay: 'Następny dzień',
    today: 'Dzisiaj',
    agendaLabel: 'Wydarzenia z kalendarza',
    refresh: 'Odśwież',
    setupBefore: 'Aby pokazać Essentials i wydarzenia, rozszerzenie potrzebuje klucza lokalnego mostu kalendarza. Skopiuj go poleceniem',
    setupAfter: 'w folderze projektu i wklej tutaj.',
    bridgeKey: 'Klucz mostu',
    save: 'Zapisz',
    setupDenied: 'Bez dostępu do 127.0.0.1:8766 rozszerzenie nie pobierze wydarzeń. Spróbuj ponownie i kliknij „Zezwól”.',
    language: 'Język',
    currentTime: 'Aktualna godzina: {time}',

    allDay: 'Cały dzień',
    allDayLower: 'cały dzień',
    ongoing: 'Trwa',
    untilTime: 'do {time}',
    fromTime: 'od {time}',
    days: { one: '{n} dzień', few: '{n} dni', many: '{n} dni', other: '{n} dnia' },
    durationDays: '{n} d',
    durationHours: '{n} godz.',
    durationMinutes: '{n} min',
    lessThanMinute: 'mniej niż minuta',

    repeatEvery: ['Codziennie', 'Co tydzień', 'Co miesiąc', 'Co rok'],
    repeatEveryN: 'Co {n} {unit}',
    repeatUnits: [
      { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' },
      { one: 'tydzień', few: 'tygodnie', many: 'tygodni', other: 'tygodnia' },
      { one: 'miesiąc', few: 'miesiące', many: 'miesięcy', other: 'miesiąca' },
      { one: 'rok', few: 'lata', many: 'lat', other: 'roku' },
    ],
    repeatUnitFallback: 'okresów',
    repeats: 'Powtarza się',
    repeatDaysOfMonth: 'dni: {list}',
    repeatUntil: 'do {date}',
    repeatCount: { one: '{n} raz', few: '{n} razy', many: '{n} razy', other: '{n} razy' },
    alarmAtStart: 'W chwili wydarzenia',
    alarmBefore: '{time} przed',
    alarmAfter: '{time} po',

    statusNoToken: 'Most nie jest skonfigurowany',
    statusUnauthorized: 'Nieprawidłowy klucz mostu',
    statusPermission: 'Potrzebny dostęp do Kalendarza',
    statusOffline: 'Most kalendarza nie odpowiada',
    statusService: 'Kalendarz jest chwilowo niedostępny',
    emptyPermission: 'Zezwól na dostęp Zen Calendar Bridge w ustawieniach macOS: „Prywatność i ochrona → Kalendarze”.',
    emptyOffline: 'Lokalny pomocnik nie odpowiada. Kliknij „Odśwież”, aby połączyć się ponownie.',

    showAll: 'Pokaż wszystkie',
    hideCalendar: 'Ukryj wydarzenia z tego kalendarza',
    showCalendar: 'Pokaż wydarzenia z tego kalendarza',
    calendarsAll: 'Kalendarze · {total}',
    calendarsSome: 'Kalendarze · {shown} z {total}',

    when: 'Kiedy: {text}',
    untitled: 'Bez tytułu',
    location: 'Miejsce',
    link: 'Link',
    recurrence: 'Powtarzanie',
    alarms: 'Przypomnienia',
    attendees: 'Uczestnicy',
    event: 'Wydarzenie',
    noMoreEvents: 'Brak kolejnych wydarzeń',
    eventsCount: 'Wydarzenia: {n}',
    hiddenTitle: 'Wydarzenia tego dnia są ukryte',
    hiddenNote: 'Ich kalendarze są wyłączone w menu „Kalendarze”',
    noEvents: 'Brak wydarzeń tego dnia',
    freeDay: 'Dzień jest wolny',
    connecting: 'Łączenie z kalendarzem…',
    updated: 'Kalendarz · zaktualizowano {time}',
    updating: 'Aktualizacja…',

    noPins: 'Brak przypiętych kart',
    pinsFailed: 'Nie udało się wczytać przypiętych kart',
    pinMissing: 'Nie znaleziono przypiętej karty. Przytrzymaj ⌘ podczas klikania, aby otworzyć stronę w nowej karcie.',
    pinFailed: 'Nie udało się przełączyć karty. Spróbuj ponownie.',
  },

  be: {
    pageLabel: 'Стартавая старонка',
    pinsLabel: 'Замацаваныя ўкладкі Zen',
    calendarLabel: 'Каляндар',
    prevMonth: 'Папярэдні месяц',
    nextMonth: 'Наступны месяц',
    prevDay: 'Папярэдні дзень',
    nextDay: 'Наступны дзень',
    today: 'Сёння',
    agendaLabel: 'Падзеі каляндара',
    refresh: 'Абнавіць',
    setupBefore: 'Каб паказаць Essentials і падзеі, пашырэнню патрэбны ключ лакальнага моста каляндара. Скапіруй яго камандай',
    setupAfter: 'у тэчцы праекта і ўстаў сюды.',
    bridgeKey: 'Ключ моста',
    save: 'Захаваць',
    setupDenied: 'Без доступу да 127.0.0.1:8766 пашырэнне не зможа атрымаць падзеі. Паспрабуй яшчэ раз і націсні «Дазволіць».',
    language: 'Мова',
    currentTime: 'Бягучы час, {time}',

    allDay: 'Увесь дзень',
    allDayLower: 'увесь дзень',
    ongoing: 'Працягваецца',
    untilTime: 'да {time}',
    fromTime: 'з {time}',
    days: { one: '{n} дзень', few: '{n} дні', many: '{n} дзён', other: '{n} дня' },
    durationDays: '{n} дз',
    durationHours: '{n} гад',
    durationMinutes: '{n} хв',
    lessThanMinute: 'менш за хвіліну',

    repeatEvery: ['Кожны дзень', 'Кожны тыдзень', 'Кожны месяц', 'Кожны год'],
    repeatEveryN: 'Раз у {n} {unit}',
    repeatUnits: [
      { one: 'дзень', few: 'дні', many: 'дзён', other: 'дня' },
      { one: 'тыдзень', few: 'тыдні', many: 'тыдняў', other: 'тыдня' },
      { one: 'месяц', few: 'месяцы', many: 'месяцаў', other: 'месяца' },
      { one: 'год', few: 'гады', many: 'гадоў', other: 'года' },
    ],
    repeatUnitFallback: 'перыядаў',
    repeats: 'Паўтараецца',
    repeatDaysOfMonth: 'чысла: {list}',
    repeatUntil: 'да {date}',
    repeatCount: { one: '{n} раз', few: '{n} разы', many: '{n} разоў', other: '{n} разу' },
    alarmAtStart: 'У момант падзеі',
    alarmBefore: 'За {time}',
    alarmAfter: 'Праз {time}',

    statusNoToken: 'Мост не наладжаны',
    statusUnauthorized: 'Няправільны ключ моста',
    statusPermission: 'Патрэбны доступ да Каляндара',
    statusOffline: 'Мост каляндара не адказвае',
    statusService: 'Каляндар часова недаступны',
    emptyPermission: 'Дазволь доступ Zen Calendar Bridge у наладах macOS: «Прыватнасць і бяспека → Каляндары».',
    emptyOffline: 'Лакальны памочнік не адказвае. Націсні «Абнавіць», каб паўтарыць падключэнне.',

    showAll: 'Паказаць усе',
    hideCalendar: 'Схаваць падзеі гэтага каляндара',
    showCalendar: 'Паказаць падзеі гэтага каляндара',
    calendarsAll: 'Каляндары · {total}',
    calendarsSome: 'Каляндары · {shown} з {total}',

    when: 'Калі: {text}',
    untitled: 'Без назвы',
    location: 'Месца',
    link: 'Спасылка',
    recurrence: 'Паўтор',
    alarms: 'Напаміны',
    attendees: 'Удзельнікі',
    event: 'Падзея',
    noMoreEvents: 'Больш падзей няма',
    eventsCount: 'Падзей: {n}',
    hiddenTitle: 'Падзеі гэтага дня схаваныя',
    hiddenNote: 'Іх каляндары выключаныя ў меню «Каляндары»',
    noEvents: 'На гэты дзень падзей няма',
    freeDay: 'Дзень вольны',
    connecting: 'Падключэнне да каляндара…',
    updated: 'Каляндар · абноўлена {time}',
    updating: 'Абнаўленне…',

    noPins: 'Замацаваных укладак пакуль няма',
    pinsFailed: 'Не ўдалося загрузіць замацаваныя ўкладкі',
    pinMissing: 'Замацаваная ўкладка не знойдзена. Націсні з заціснутай ⌘, каб адкрыць сайт у новай укладцы.',
    pinFailed: 'Не ўдалося пераключыць укладку. Паспрабуй яшчэ раз.',
  },
};

const STORAGE_KEY = 'language';

/** Язык браузера, если он есть в списке, иначе английский. */
function browserLanguage() {
  for (const tag of navigator.languages || [navigator.language]) {
    const code = String(tag).toLowerCase().split('-')[0];
    if (code in LANGUAGES) return code;
  }
  return 'en';
}

let current = browserLanguage();
const listeners = new Set();
const formats = new Map();
let pluralRules = new Intl.PluralRules(LANGUAGES[current].tag);

export const language = () => current;
export const locale = () => LANGUAGES[current].tag;

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));

/** Перевод строки с подстановкой значений: t('updated', { time: '10:00' }). */
export function t(key, values = {}) {
  const text = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  return typeof text === 'string' ? fill(text, values) : text;
}

/** Форма слова для числа: plural('days', 3) → «3 дня» / «3 days». */
export function plural(key, n, values = {}) {
  const forms = typeof key === 'string' ? STRINGS[current][key] : key;
  const form = forms[pluralRules.select(n)] ?? forms.other;
  return fill(form, { n, ...values });
}

/**
 * После дня недели всегда запятая: «Wednesday, 23 December», как «среда, 23 декабря».
 * В британском английском Intl пишет без неё, поэтому поправляем вручную.
 */
function withWeekdayComma(formatter) {
  return {
    format(date) {
      const parts = formatter.formatToParts(date);
      const index = parts.findIndex((part) => part.type === 'weekday');
      const next = parts[index + 1];
      if (index >= 0 && next?.type === 'literal' && !next.value.includes(',')) next.value = `,${next.value}`;
      return parts.map((part) => part.value).join('');
    },
  };
}

/** Форматтер даты для текущего языка (кэшируется). Время всегда 24-часовое. */
export function dateFormat(options) {
  const id = `${current}|${JSON.stringify(options)}`;
  if (!formats.has(id)) {
    const formatter = new Intl.DateTimeFormat(locale(), { hourCycle: 'h23', ...options });
    formats.set(id, options.weekday && options.day ? withWeekdayComma(formatter) : formatter);
  }
  return formats.get(id);
}

/** Подписать элементы страницы по атрибутам data-i18n (текст) и data-i18n-label (aria-label и title). */
export function translatePage(root = document) {
  document.documentElement.lang = current;
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of root.querySelectorAll('[data-i18n-label]')) {
    const text = t(node.dataset.i18nLabel);
    node.setAttribute('aria-label', text);
    if (node.hasAttribute('title')) node.title = text;
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
}

/** Подписаться на смену языка. */
export function onLanguageChange(callback) {
  listeners.add(callback);
}

export function setLanguage(code, save = true) {
  if (!(code in LANGUAGES) || code === current) return;
  current = code;
  pluralRules = new Intl.PluralRules(locale());
  translatePage();
  if (save) browser.storage.local.set({ [STORAGE_KEY]: code }).catch(() => {});
  for (const callback of listeners) callback(code);
}

/** Прочитать сохранённый язык. Вызывается один раз до первой отрисовки. */
export async function loadLanguage() {
  try {
    const { [STORAGE_KEY]: saved } = await browser.storage.local.get(STORAGE_KEY);
    if (saved in LANGUAGES) {
      current = saved;
      pluralRules = new Intl.PluralRules(locale());
    }
  } catch {
    // Настройки недоступны — остаётся язык браузера.
  }
  translatePage();
}
