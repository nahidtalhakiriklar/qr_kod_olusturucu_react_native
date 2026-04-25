import { sha256 } from 'js-sha256';

/**
 * Sunucu URL'sini normalize et.
 * http/https yoksa https ekler, sondaki / siler.
 */
export function normalizeServerUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return trimmed;

  let url = trimmed;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

/**
 * Saniyeyi MM:SS formatına çevir.
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * SHA-256 hash üret (şifre kontrolü için).
 */
export function hashPassword(password) {
  return sha256(password);
}
