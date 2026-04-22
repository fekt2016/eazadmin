/**
 * Socket.io + admin chat REST origin — same order as buyer `getChatSocketOrigin`.
 * Dev: set `VITE_SOCKET_URL=http://localhost:4000` in `.env`. Production: usually omit (uses API_ORIGIN).
 */

const isDev = import.meta.env.DEV;

const PRODUCTION_API_ORIGIN = 'https://api.saiisai.com';
const DEVELOPMENT_API_ORIGIN = 'http://localhost:4000';

const normalizeEnvToApiOrigin = (raw) => {
  if (raw == null || raw === '') return null;
  let url = String(raw).trim().replace(/\/+$/, '');
  if (!url) return null;
  url = url.replace(/\/api\/v1\/?$/i, '');
  const isLocal = /localhost|127\.0\.0\.1|:4000/i.test(url);
  if (isLocal) {
    url = url.replace(/^https:\/\//i, 'http://');
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url.replace(/^\/\//, '')}`;
    }
  }
  return url;
};

const VITE_UI_PORTS = new Set(['5173', '5174', '5175']);

const stripViteDevServerPortFromOrigin = (origin) => {
  if (!origin || typeof origin !== 'string') return origin;
  const trimmed = origin.trim().replace(/\/+$/, '');
  let u;
  try {
    u = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
  } catch {
    return trimmed;
  }
  const port = u.port || '';
  const loopback = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (loopback && VITE_UI_PORTS.has(port)) {
    if (isDev) {
      console.warn(
        `[eazadmin/chat] ${trimmed} is a Vite UI port, not the API. Using ${u.protocol}//${u.hostname}:4000.`
      );
    }
    u.port = '4000';
    return u.origin;
  }
  return trimmed;
};

const envApiRaw =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const envApiNormalized = normalizeEnvToApiOrigin(envApiRaw);
const envApiOrigin = envApiNormalized
  ? stripViteDevServerPortFromOrigin(envApiNormalized)
  : null;

const API_ORIGIN =
  envApiOrigin || (isDev ? DEVELOPMENT_API_ORIGIN : PRODUCTION_API_ORIGIN);

const loopbackKey = (hostname) => {
  if (!hostname) return '';
  const h = String(hostname).toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return '__loopback__';
  return h;
};

const shouldUseViteDevProxyOrigin = (apiOriginStr, pageOriginStr) => {
  if (!isDev || typeof window === 'undefined') return false;
  try {
    const api = new URL(apiOriginStr);
    const page = new URL(pageOriginStr);
    if (api.protocol !== 'http:') return false;
    const apiPort = api.port || '80';
    if (apiPort !== '4000') return false;
    const a = loopbackKey(api.hostname);
    if (a === '__loopback__') return true;
    return api.hostname === page.hostname;
  } catch {
    return false;
  }
};

const resolveExplicitSocketUrl = (raw) => {
  const base =
    normalizeEnvToApiOrigin(raw) || String(raw).trim().replace(/\/+$/, '');
  return stripViteDevServerPortFromOrigin(base);
};

export const getEazadminBackendOrigin = () => {
  const explicitSocket = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (explicitSocket) {
    const base = resolveExplicitSocketUrl(explicitSocket);
    if (
      typeof window !== 'undefined' &&
      shouldUseViteDevProxyOrigin(base, window.location.origin)
    ) {
      return window.location.origin;
    }
    return base;
  }

  if (
    typeof window !== 'undefined' &&
    shouldUseViteDevProxyOrigin(API_ORIGIN, window.location.origin)
  ) {
    return window.location.origin;
  }

  return API_ORIGIN;
};
