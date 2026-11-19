import { isIP } from 'node:net';

export function validateProductionApiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Set VITE_API_URL to the public HTTPS backend URL ending in /api.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.pathname !== '/api' || !hostname.includes('.') || hostname.endsWith('.localhost') || isIP(hostname)) {
    throw new Error('VITE_API_URL must use a public HTTPS hostname and end in /api.');
  }
}
