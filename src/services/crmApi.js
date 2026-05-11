/*
  Static GitHub Pages friendly CRM loader.

  Important: GitHub Pages cannot accept POST requests or run /api handlers.
  The widget must initialize inside Aspro.Cloud iframe and call CRM REST through
  the Aspro MiniApp JS SDK. The SDK adds OAuth2 Authorization and refreshes the
  token automatically.
*/

const SDK_URL = 'https://my.aspro.cloud/static/miniapp/jssdk@latest/dist/miniapp-jssdk.min.js';

const DEFAULT_METHODS = [
  // Most likely CRM client/entity list methods. If your portal uses another
  // method, set window.ASPRO_BIRTHDAY_WIDGET.crmMethods in public/config.js.
  '/crm/account/list',
  '/crm/contact/list',
  '/crm/client/list',
  '/crm/customer/list',
  '/account/account/list',
];

const DEFAULT_FIELDS = [
  'id',
  'name',
  'title',
  'first_name',
  'last_name',
  'middle_name',
  'birthday',
  'birthdate',
  'birth_date',
  'date_birth',
  'uf_crm_birthday',
  'UF_CRM_BIRTHDAY',
  'phone',
  'email',
  'company',
  'company_title',
  'avatar',
  'photo',
];

function getConfig() {
  return window.ASPRO_BIRTHDAY_WIDGET || {};
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      if (window.ACloudMiniApp) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Не удалось загрузить Aspro MiniApp SDK'));
    document.head.appendChild(script);
  });
}

async function getAsproFrame() {
  if (!window.ACloudMiniApp) {
    await loadScript(SDK_URL);
  }

  const sdk = window.ACloudMiniApp;
  if (!sdk?.App?.initializeFrame) {
    throw new Error('Aspro MiniApp SDK не найден. Проверьте, что виджет открыт внутри iframe Аспро.Cloud.');
  }

  return sdk.App.initializeFrame();
}

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidates = [
    payload.items,
    payload.rows,
    payload.list,
    payload.data,
    payload.result,
    payload.result?.items,
    payload.result?.rows,
    payload.result?.data,
    payload.response,
    payload.response?.items,
    payload.response?.data,
  ];

  return candidates.find(Array.isArray) || [];
}

function pickFirst(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function normalizeDate(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    value = value.value || value.date || value.text || value.VALUE || '';
  }
  if (!value) return '';

  const raw = String(value).trim();

  // dd.mm.yyyy or dd.mm
  const ru = raw.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (ru) {
    const day = ru[1].padStart(2, '0');
    const month = ru[2].padStart(2, '0');
    const year = (ru[3] || '2000').padStart(4, '20');
    return `${year}-${month}-${day}`;
  }

  // yyyy-mm-dd, yyyy/mm/dd, or ISO datetime
  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  return raw;
}

function normalizeClient(raw, index) {
  const source = raw || {};
  const name = pickFirst(source, ['name', 'full_name', 'fullName', 'title', 'TITLE', 'NAME'])
    || [source.last_name || source.LAST_NAME, source.first_name || source.FIRST_NAME, source.middle_name || source.MIDDLE_NAME]
      .filter(Boolean)
      .join(' ');

  const date = normalizeDate(pickFirst(source, [
    'birthday',
    'birthdate',
    'birth_date',
    'date_birth',
    'date',
    'uf_crm_birthday',
    'UF_CRM_BIRTHDAY',
    'BIRTHDAY',
    'BIRTHDATE',
  ]));

  return {
    id: pickFirst(source, ['id', 'ID', 'client_id', 'contact_id']) || index + 1,
    name: name || 'Без имени',
    date,
    phone: pickFirst(source, ['phone', 'PHONE', 'mobile', 'work_phone']),
    email: pickFirst(source, ['email', 'EMAIL', 'mail']),
    company: pickFirst(source, ['company', 'company_title', 'companyName', 'COMPANY_TITLE']),
    avatar: pickFirst(source, ['avatar', 'photo', 'PHOTO']),
  };
}

async function fetchPage(rest, method, page, limit, fields) {
  return rest.get(method, {
    limit,
    page,
    fields,
  });
}

async function fetchByMethod(rest, method) {
  const config = getConfig();
  const limit = config.limit || 100;
  const maxPages = config.maxPages || 5;
  const fields = config.fields || DEFAULT_FIELDS;
  const all = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchPage(rest, method, page, limit, fields);
    const rows = pickArray(payload);
    all.push(...rows);

    if (rows.length < limit) break;
  }

  return all;
}

export async function fetchBirthdayClients() {
  const config = getConfig();
  const methods = config.crmMethods || DEFAULT_METHODS;
  const frame = await getAsproFrame();
  const errors = [];

  for (const method of methods) {
    try {
      const rows = await fetchByMethod(frame.rest, method);
      const clients = rows
        .map(normalizeClient)
        .filter((client) => Boolean(client.date));

      if (clients.length > 0) {
        console.info(`[birthday-widget] CRM method used: ${method}`);
        return clients;
      }

      errors.push(`${method}: данных с датой рождения нет`);
    } catch (error) {
      errors.push(`${method}: ${error?.message || 'ошибка запроса'}`);
    }
  }

  throw new Error(
    'Не удалось получить дни рождения из CRM. Проверьте OAuth-права приложения и правильный REST-метод в public/config.js. ' +
    `Пробовали: ${errors.join('; ')}`
  );
}
