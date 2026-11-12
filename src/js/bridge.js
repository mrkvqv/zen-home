// Связь с локальным мостом календаря (Zen Calendar Bridge.app на 127.0.0.1:8766).
// Ключ хранится в storage.local расширения и не попадает в код и в собранный пакет.

const BASE_URL = 'http://127.0.0.1:8766';
const ORIGINS = { origins: [`${BASE_URL}/*`] };

let tokenCache = null;

export async function getToken() {
  if (tokenCache === null) {
    const { bridgeToken } = await browser.storage.local.get('bridgeToken');
    tokenCache = typeof bridgeToken === 'string' ? bridgeToken : '';
  }
  return tokenCache;
}

/** Сохранить ключ. Вызывать из обработчика нажатия: там же запрашивается доступ к мосту. */
export async function saveToken(token) {
  const granted = await browser.permissions.request(ORIGINS);
  if (!granted) throw new BridgeError('permission_denied');
  await browser.storage.local.set({ bridgeToken: token });
  tokenCache = token;
}

export async function forgetToken() {
  await browser.storage.local.remove('bridgeToken');
  tokenCache = '';
}

export class BridgeError extends Error {}

/**
 * GET-запрос к мосту. Ошибки приводятся к коротким кодам:
 * no_token, unauthorized, permission (нет доступа к Календарю macOS), offline, service.
 */
export async function bridgeGet(path, params, { signal, timeout = 10_000 } = {}) {
  const token = await getToken();
  if (!token) throw new BridgeError('no_token');
  if (!(await browser.permissions.contains(ORIGINS))) throw new BridgeError('no_token');

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    let response;
    try {
      response = await fetch(BASE_URL + path + query, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new BridgeError('offline');
    }
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) throw new BridgeError('unauthorized');
    if (!response.ok) throw new BridgeError(data.error === 'calendar_permission' ? 'permission' : 'service');
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
