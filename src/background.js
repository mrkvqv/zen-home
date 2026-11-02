// Фоновый скрипт: одна стартовая вкладка на окно, всегда в текущем Space Zen.

const HOME_URL = browser.runtime.getURL('home.html');

const isHome = (tab) => typeof tab.url === 'string' && tab.url.startsWith(HOME_URL);

/**
 * Показать стартовую страницу в окне.
 * Видимая копия переиспользуется; копии из других Space (Zen прячет их как hidden)
 * закрываются, потому что расширение не умеет переносить вкладки между Space.
 */
async function showHome(windowId) {
  const tabs = await browser.tabs.query({ windowId });
  const homes = tabs.filter(isHome);
  const keep = homes.find((tab) => !tab.hidden && !tab.pinned);
  const extra = homes.filter((tab) => tab !== keep).map((tab) => tab.id);

  if (keep) {
    await browser.tabs.update(keep.id, { active: true });
  } else {
    await browser.tabs.create({ url: HOME_URL, windowId, active: true });
  }
  if (extra.length) await browser.tabs.remove(extra);
}

/** После запуска браузера убрать дубли, которые могла восстановить сессия. */
async function removeDuplicates() {
  const windows = await browser.windows.getAll({ populate: true });
  for (const win of windows) {
    const homes = win.tabs.filter(isHome);
    if (homes.length < 2) continue;
    const keep = homes.find((tab) => tab.active) || homes.find((tab) => !tab.hidden) || homes[0];
    await browser.tabs.remove(homes.filter((tab) => tab !== keep).map((tab) => tab.id));
  }
}

async function currentWindowId() {
  const win = await browser.windows.getLastFocused();
  return win.id;
}

browser.commands.onCommand.addListener(async (command) => {
  if (command === 'open-home') await showHome(await currentWindowId());
});

browser.action.onClicked.addListener((tab) => showHome(tab.windowId));

browser.runtime.onStartup.addListener(removeDuplicates);

// Страница просит переключиться на закреплённую вкладку (Essentials).
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'activate-pin') return activatePin(message.url, sender.tab?.windowId);
  return undefined;
});

/**
 * Найти закреплённую вкладку с тем же сайтом и переключиться на неё.
 * Essentials видны во всех Space, поэтому сначала ищем среди видимых вкладок окна.
 */
async function activatePin(url, windowId) {
  let target;
  try {
    target = new URL(url);
  } catch {
    return { ok: false };
  }
  const pinned = await browser.tabs.query({ pinned: true, windowId });
  const sameHost = pinned.filter((tab) => {
    try {
      const candidate = new URL(tab.url);
      return candidate.hostname === target.hostname && candidate.port === target.port;
    } catch {
      return false;
    }
  });
  const match = sameHost.find((tab) => !tab.hidden) || sameHost[0];
  if (!match) return { ok: false };
  await browser.tabs.update(match.id, { active: true });
  return { ok: true };
}
