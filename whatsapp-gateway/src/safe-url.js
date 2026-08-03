/**
 * Shared outbound URL policy (mirrored in app/Support/SafeOutboundUrl.php).
 *
 * - http/https only, no credentials in URL
 * - blocks private/reserved IPs and metadata hosts
 * - non-production allows localhost for dev media URLs
 * - extra hosts via SAFE_OUTBOUND_URL_HOSTS
 */

const MAX_LENGTH = 2048;

const BLOCKED_HOSTNAMES = new Set(['metadata', 'metadata.google.internal']);

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function extraAllowedHosts() {
  const raw = process.env.SAFE_OUTBOUND_URL_HOSTS || '';
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function allowsPrivateHosts() {
  if (process.env.ALLOW_PRIVATE_MEDIA_URLS === 'true') {
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}

function isLoopbackHost(host) {
  return LOOPBACK_HOSTS.has(host);
}

function parseIpv4(ip) {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return null;
  }

  return parts;
}

function isBlockedIpv4(ip) {
  const p = parseIpv4(ip);
  if (!p) {
    return true;
  }

  const [a, b] = p;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  return false;
}

function isBlockedIpv6(host) {
  const lower = host.toLowerCase();
  return lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd');
}

function isBlockedIp(host) {
  if (host.includes(':')) {
    return isBlockedIpv6(host);
  }

  return isBlockedIpv4(host);
}

export function isSafeOutboundUrl(url) {
  const trimmed = String(url || '').trim();

  if (!trimmed || trimmed.length > MAX_LENGTH) {
    return false;
  }

  let parsed;

  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');

  if (BLOCKED_HOSTNAMES.has(host)) {
    return false;
  }

  if (extraAllowedHosts().includes(host)) {
    return true;
  }

  if (allowsPrivateHosts() && isLoopbackHost(host)) {
    return true;
  }

  if (isLoopbackHost(host)) {
    return allowsPrivateHosts();
  }

  if (isBlockedIp(host)) {
    return false;
  }

  return true;
}

export function assertSafeOutboundUrl(url) {
  if (!isSafeOutboundUrl(url)) {
    throw new Error('unsafe media url');
  }
}
