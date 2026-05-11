import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Request body is too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseBody(rawBody, contentType = '') {
  if (!rawBody) return {};

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return { rawBody };
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return { rawBody };
}

function escapeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function injectCrmInit(indexHtml, initData) {
  const script = `<script>window.__CRM_WIDGET_INIT__=${escapeForInlineScript(initData)};</script>`;
  return indexHtml.toString().replace('</head>', `${script}</head>`);
}

function json(res, statusCode, payload, headers = {}) {
  return send(res, statusCode, JSON.stringify(payload), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    ...headers,
  });
}

function requestJson(urlString, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = transport(url, { method, headers }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        if ((response.statusCode || 500) >= 400) {
          reject(new Error(`CRM returned ${response.statusCode}: ${responseBody}`));
          return;
        }
        try {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } catch {
          resolve({ rawBody: responseBody });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getClientsFromCrm(initData) {
  if (Array.isArray(initData.clients)) return { clients: initData.clients };
  if (Array.isArray(initData.contacts)) return { clients: initData.contacts };

  const crmApiUrl = process.env.CRM_API_URL || initData.crmApiUrl || initData.webhookUrl;
  if (!crmApiUrl) {
    throw new Error('CRM_API_URL не задан. Передайте URL API CRM в переменной окружения CRM_API_URL или в POST-параметре crmApiUrl/webhookUrl.');
  }

  const token = process.env.CRM_API_TOKEN || initData.token || initData.auth || '';
  const body = JSON.stringify({ initData });
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return requestJson(crmApiUrl, { method: process.env.CRM_API_METHOD || 'POST', headers, body });
}

function safeJoin(baseDir, requestedPath) {
  const normalizedPath = path.normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  const resolvedPath = path.join(baseDir, normalizedPath);

  if (!resolvedPath.startsWith(baseDir)) {
    return null;
  }

  return resolvedPath;
}

async function serveFile(res, filePath) {
  const fileStat = await stat(filePath);

  if (!fileStat.isFile()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Content-Length': fileStat.size,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(res);
  return true;
}

const server = createServer(async (req, res) => {
  try {
    // Some CRM systems initialize embedded widgets with POST. A static server often
    // rejects that with 405, so for SPA entry points we intentionally serve index.html.
    if (!['GET', 'HEAD', 'POST', 'OPTIONS'].includes(req.method || '')) {
      return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD, POST, OPTIONS' });
    }

    if (req.method === 'OPTIONS') {
      return send(res, 204, '', {
        Allow: 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname.replace(/^\/aspro\/?/, '/'));

    if (pathname === '/api/clients/birthdays') {
      const rawBody = await collectRequestBody(req);
      const payload = parseBody(rawBody, req.headers['content-type'] || '');
      const initData = payload.initData || payload || {};
      try {
        const crmPayload = await getClientsFromCrm(initData);
        return json(res, 200, crmPayload, { 'Access-Control-Allow-Origin': '*' });
      } catch (error) {
        console.error(error);
        return json(res, 500, { error: error.message || 'Не удалось получить данные из CRM' }, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // Do not try to serve assets on POST; CRM POSTs should always receive the SPA shell.
    if (req.method !== 'POST') {
      const requestedFile = pathname === '/' ? '/index.html' : pathname;
      const filePath = safeJoin(distDir, requestedFile);

      if (filePath && await serveFile(res, filePath).catch(() => false)) {
        return;
      }
    }

    let initData = {};
    if (req.method === 'POST') {
      const rawBody = await collectRequestBody(req);
      initData = parseBody(rawBody, req.headers['content-type'] || '');
    }

    const indexHtml = await readFile(path.join(distDir, 'index.html'));
    return send(res, 200, injectCrmInit(indexHtml, initData), {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
  } catch (error) {
    console.error(error);
    return send(res, 500, 'Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`Widget server is running on port ${port}`);
});
