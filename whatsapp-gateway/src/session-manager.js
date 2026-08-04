import makeWASocket, {
  DisconnectReason,
  areJidsSameUser,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import crypto from 'crypto';
import fs from 'fs';
import { assertSafeOutboundUrl } from './safe-url.js';
import {
  assertSafeSessionId,
  ensureAuthSchema,
  ensureSessionsDir,
  getSessionsDir,
  readGatewayWebhookSecret,
  removeSessionDirectory,
  resolveSessionPath,
  saveGatewayWebhookSecret,
  useSecureMultiFileAuthState,
} from './secure-session-store.js';

ensureSessionsDir();

/** @type {Map<string, SessionState>} */
const sessions = new Map();

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const reconnectTimers = new Map();

/** @type {Map<string, number>} */
const gatewayEchoes = new Map();

const RECONNECT_BASE_MS = 3000;
const RECONNECT_MAX_MS = 30000;
const MAX_INBOUND_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_INBOUND_AUDIO_BYTES = 10 * 1024 * 1024;
const GATEWAY_ECHO_TTL_MS = 2 * 60 * 1000;
const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS || 30000);
const MAX_ACTION_DELAY_MS = 120000;

/** @type {Set<string>} sessões com tick em andamento */
const ticksInFlight = new Set();

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {SessionState} session
 * @param {() => void | Promise<void>} fn
 */
function runSafely(session, fn) {
  Promise.resolve()
    .then(fn)
    .catch((err) => {
      console.error(
        `[gateway] Unhandled async error session=${session.sessionId}:`,
        err?.message ?? err
      );
    });
}

/**
 * @param {SessionState} session
 * @param {string} sessionPath
 */
function scheduleReconnect(session, sessionPath) {
  const key = session.sessionId;
  const existing = reconnectTimers.get(key);

  if (existing) {
    clearTimeout(existing);
  }

  const delay = Math.min(
    session.reconnectDelayMs ?? RECONNECT_BASE_MS,
    RECONNECT_MAX_MS
  );
  session.reconnectDelayMs = Math.min(Math.round(delay * 1.5), RECONNECT_MAX_MS);

  const timer = setTimeout(() => {
    reconnectTimers.delete(key);
    startSession(session, sessionPath).catch((err) => {
      console.error(
        `[gateway] Reconnect failed session=${session.sessionId}:`,
        err?.message ?? err
      );
      if (session.status !== 'connected') {
        scheduleReconnect(session, sessionPath);
      }
    });
  }, delay);

  reconnectTimers.set(key, timer);
}

/**
 * @param {string} sessionId
 */
function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

/**
 * @param {import('@whiskeysockets/baileys').WASocket|null|undefined} socket
 */
function teardownSocket(socket) {
  if (!socket) {
    return;
  }

  try {
    socket.ev.removeAllListeners('connection.update');
    socket.ev.removeAllListeners('messages.upsert');
    socket.ev.removeAllListeners('messages.update');
    socket.ev.removeAllListeners('lid-mapping.update');
    socket.ev.removeAllListeners('creds.update');
  } catch {
    // ignore
  }

  try {
    socket.end(undefined);
  } catch {
    // ignore
  }
}

/**
 * @typedef {Object} SessionState
 * @property {string} sessionId
 * @property {'disconnected'|'connecting'|'qr'|'connected'} status
 * @property {string|null} qr
 * @property {string|null} phone
 * @property {string[]} ownJids
 * @property {import('@whiskeysockets/baileys').WASocket|null} socket
 * @property {boolean} starting
 * @property {number} [reconnectDelayMs]
 * @property {string|null} [webhookSecret]
 */

/**
 * @typedef {Object} InboundIdentity
 * @property {string} replyJid
 * @property {string} phone
 * @property {string} replyPnJid
 */

/**
 * @param {string} sessionId
 * @returns {SessionState}
 */
function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      status: 'disconnected',
      qr: null,
      phone: null,
      ownJids: [],
      socket: null,
      starting: false,
    });
  }
  return sessions.get(sessionId);
}

/**
 * @param {string} jid
 * @returns {string}
 */
function formatPhone(jid) {
  if (!jid) return '';
  return String(jid).replace(/@.*/, '').replace(/:.*/, '').replace(/\D/g, '');
}

/**
 * @param {string|null|undefined} jid
 * @returns {string}
 */
function normalizeJidUser(jid) {
  if (!jid) return '';
  return String(jid).replace(/@.*/, '').replace(/:.*/, '');
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function ownIdentityCandidates(session) {
  const jids = uniqueStrings([
    session.phone,
    ...(session.ownJids || []),
    session.socket?.user?.id,
    session.socket?.user?.lid,
  ]);

  const users = jids.map((jid) => normalizeJidUser(jid));
  const phones = jids.map((jid) => formatPhone(jid));

  return {
    users: uniqueStrings(users),
    phones: uniqueStrings(phones),
  };
}

function phonesMatchLoose(left, right) {
  if (!left || !right) return false;
  if (left === right) return true;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;

  if (shorter.length >= 8 && longer.endsWith(shorter)) {
    return true;
  }

  return left.endsWith(right) || right.endsWith(left);
}

/**
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @returns {string[]}
 */
function collectMessageJids(msg) {
  return uniqueStrings([
    msg.key?.remoteJid,
    msg.key?.remoteJidAlt,
    msg.key?.senderPn,
    msg.key?.senderLid,
    msg.key?.participant,
    msg.key?.participantPn,
    msg.key?.participantLid,
  ]);
}

/**
 * @param {SessionState} session
 * @returns {string[]}
 */
function collectOwnJids(session) {
  return uniqueStrings([
    ...(session.ownJids || []),
    session.socket?.user?.id,
    session.socket?.user?.lid,
    session.phone ? `${session.phone}@s.whatsapp.net` : '',
  ]);
}

/**
 * @param {string} sessionId
 * @param {string|undefined|null} signature
 */
function rememberGatewayEcho(sessionId, signature) {
  if (!signature) return;

  gatewayEchoes.set(signature, Date.now() + GATEWAY_ECHO_TTL_MS);
}

/**
 * @param {string} signature
 * @returns {boolean}
 */
function consumeGatewayEcho(signature) {
  if (!signature) return false;

  const echo = gatewayEchoes.get(signature);
  if (!echo) return false;

  if (echo < Date.now()) {
    gatewayEchoes.delete(signature);
    return false;
  }

  gatewayEchoes.delete(signature);
  return true;
}

function cleanupGatewayEchoes() {
  const now = Date.now();
  for (const [signature, expiresAt] of gatewayEchoes.entries()) {
    if (expiresAt < now) {
      gatewayEchoes.delete(signature);
    }
  }
}

function gatewayEchoIdSignature(sessionId, messageId) {
  return messageId ? `${sessionId}:id:${messageId}` : '';
}

function gatewayEchoBodySignature(sessionId, jid, text) {
  const body = String(text || '').trim();
  if (!jid || !body) return '';

  return `${sessionId}:body:${normalizeJidUser(jid)}:${body}`;
}

/**
 * @param {string} jid
 * @returns {boolean}
 */
function isPnJid(jid) {
  return Boolean(jid && jid.endsWith('@s.whatsapp.net'));
}

/**
 * Ensure Brazil country code for typical mobile numbers missing DDI 55.
 * @param {string} digits
 * @returns {string}
 */
function normalizeOutboundPhone(digits) {
  const phone = String(digits || '').replace(/\D/g, '');
  if (!phone) return '';

  if (phone.startsWith('55') && phone.length >= 12) {
    return phone;
  }

  if (phone.length === 10 || phone.length === 11) {
    return `55${phone}`;
  }

  return phone;
}

/**
 * @param {string} jid
 * @returns {string}
 */
function jidToPnJid(jid) {
  if (!jid || !isPnJid(jid)) {
    return '';
  }

  const digits = normalizeOutboundPhone(formatPhone(jid));
  if (!digits) {
    return '';
  }

  return `${digits}@s.whatsapp.net`;
}

function isLidJid(jid) {
  return Boolean(jid && jid.endsWith('@lid'));
}

/**
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @returns {InboundIdentity}
 */
function resolveInboundIdentity(msg) {
  const key = msg.key || {};
  const remoteJid = key.remoteJid || '';
  const replyJid = isLidJid(remoteJid)
    ? remoteJid
    : (remoteJid || key.remoteJidAlt || '');
  let phone = '';
  let replyPnJid = '';

  if (key.senderPn && isPnJid(key.senderPn)) {
    replyPnJid = jidToPnJid(key.senderPn);
    phone = normalizeOutboundPhone(formatPhone(key.senderPn));
  } else if (key.remoteJidAlt && isPnJid(key.remoteJidAlt)) {
    replyPnJid = jidToPnJid(key.remoteJidAlt);
    phone = normalizeOutboundPhone(formatPhone(key.remoteJidAlt));
  } else if (remoteJid && isPnJid(remoteJid)) {
    replyPnJid = jidToPnJid(remoteJid);
    phone = normalizeOutboundPhone(formatPhone(remoteJid));
  }

  return { replyJid, phone, replyPnJid };
}

/**
 * @param {string} jid
 * @returns {string}
 */
function maskJid(jid) {
  if (!jid) return '****';
  const [user, domain] = jid.split('@');
  if (!domain) return '****';
  const digits = user.replace(/\D/g, '');
  if (digits.length <= 4) return `****@${domain}`;
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}@${domain}`;
}

/**
 * @param {string} phone
 * @returns {string}
 */
function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

/**
 * @param {SessionState} session
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @returns {boolean}
 */
async function isSelfChatMessage(session, msg) {
  if (!msg.key?.fromMe) {
    return false;
  }

  const ownJids = collectOwnJids(session);
  const messageJids = collectMessageJids(msg);
  const own = ownIdentityCandidates(session);
  const candidatePhones = uniqueStrings(messageJids.map((jid) => formatPhone(jid)));

  for (const ownJid of ownJids) {
    for (const candidate of messageJids) {
      try {
        if (areJidsSameUser(ownJid, candidate)) {
          return true;
        }
      } catch {
        // ignore invalid jids
      }
    }
  }

  const matchedByUser = uniqueStrings(messageJids.map((jid) => normalizeJidUser(jid))).some(
    (candidate) => own.users.includes(candidate)
  );
  const matchedByPhone = candidatePhones.some((candidate) =>
    own.phones.some((phone) => phonesMatchLoose(candidate, phone))
  );

  if (matchedByUser || matchedByPhone) {
    return true;
  }

  const lidMapping = session.socket?.signalRepository?.lidMapping;
  if (lidMapping) {
    for (const jid of messageJids) {
      if (!jid || !jid.endsWith('@lid')) {
        continue;
      }

      try {
        const pnJid = await lidMapping.getPNForLID(jid);
        if (!pnJid) {
          continue;
        }

        for (const ownJid of ownJids) {
          try {
            if (areJidsSameUser(pnJid, ownJid)) {
              return true;
            }
          } catch {
            // ignore invalid jids
          }
        }

        const pnPhone = formatPhone(pnJid);
        if (own.phones.some((phone) => phonesMatchLoose(pnPhone, phone))) {
          return true;
        }
      } catch {
        // ignore mapping failures
      }
    }
  }

  console.log(
    `[gateway] self-chat miss session=${session.sessionId} ownUsers=${own.users.join('|') || 'n/a'} ownPhones=${own.phones.map(maskPhone).join('|') || 'n/a'} candidates=${messageJids.map(maskJid).join('|') || 'n/a'}`
  );

  return false;
}

/**
 * @param {SessionState} session
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @returns {boolean}
 */
function isLikelyOwnPhoneInbound(session, msg) {
  if (!session.phone) {
    return false;
  }

  const ownPhone = formatPhone(session.phone);

  return collectMessageJids(msg).some((jid) => phonesMatchLoose(formatPhone(jid), ownPhone));
}

/**
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @returns {string}
 */
function extractMessageText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.buttonsResponseMessage?.selectedDisplayText ||
    msg.message?.listResponseMessage?.title ||
    msg.message?.imageMessage?.caption ||
    ''
  ).trim();
}

/**
 * @param {import('@whiskeysockets/baileys').WASocket} socket
 * @param {string} phone
 * @returns {Promise<string>}
 */
async function resolveOutboundJid(socket, phone) {
  const digits = normalizeOutboundPhone(String(phone || '').replace(/\D/g, ''));
  if (!digits) {
    throw new Error('phone or jid required');
  }

  const pnJid = `${digits}@s.whatsapp.net`;

  try {
    const results = await socket.onWhatsApp(pnJid);
    const resolved = results?.[0];

    if (resolved?.exists && resolved.jid) {
      if (isPnJid(resolved.jid)) {
        return jidToPnJid(resolved.jid);
      }

      if (resolved.jid.endsWith('@lid')) {
        return resolved.jid;
      }
    } else if (resolved && !resolved.exists) {
      console.warn(`[gateway] onWhatsApp: ${maskJid(pnJid)} not registered on WhatsApp`);
    }
  } catch (err) {
    console.warn('[gateway] onWhatsApp failed:', err.message);
  }

  return pnJid;
}

/**
 * Resolve the JID to send outbound messages to (LID-first for webhook replies).
 *
 * @param {import('@whiskeysockets/baileys').WASocket|null|undefined} socket
 * @param {{ phone?: string, jid?: string, inboundIdentity?: InboundIdentity|null }} options
 * @returns {Promise<string>}
 */
async function resolveOutboundDestination(socket, { phone, jid, inboundIdentity = null }) {
  const inboundLid = isLidJid(inboundIdentity?.replyJid) ? inboundIdentity.replyJid : '';

  if (inboundLid) {
    console.log(`[gateway] outbound reply via @lid to=${maskJid(inboundLid)}`);
    return inboundLid;
  }

  if (jid && isLidJid(jid)) {
    console.log(`[gateway] outbound send via @lid jid=${maskJid(jid)}`);
    return jid;
  }

  if (jid && isPnJid(jid)) {
    return jidToPnJid(jid);
  }

  const normalizedPhone = normalizeOutboundPhone(String(phone || '').replace(/\D/g, ''));

  if (normalizedPhone) {
    return resolveOutboundJid(socket, normalizedPhone);
  }

  if (jid) {
    return jid;
  }

  throw new Error('phone or jid required');
}

/**
 * @param {string} sessionId
 * @param {string} destination
 * @param {string} messageId
 * @param {string} body
 * @param {InboundIdentity|null|undefined} inboundIdentity
 */
function rememberOutboundEchoes(sessionId, destination, messageId, body, inboundIdentity = null) {
  rememberGatewayEcho(sessionId, gatewayEchoIdSignature(sessionId, messageId));
  rememberGatewayEcho(sessionId, gatewayEchoBodySignature(sessionId, destination, body));

  if (inboundIdentity?.replyPnJid && isLidJid(destination)) {
    rememberGatewayEcho(sessionId, gatewayEchoBodySignature(sessionId, inboundIdentity.replyPnJid, body));
  }
}

/**
 * @param {SessionState} session
 * @param {{ type: string, phone?: string, message?: string, jid?: string, url?: string, caption?: string, delay_ms?: number }[]} actions
 * @param {InboundIdentity|null} [inboundIdentity]
 */
async function executeActions(session, actions, inboundIdentity = null) {
  let executed = 0;

  for (const action of actions) {
    try {
      const delayMs = Math.min(Math.max(Number(action.delay_ms) || 0, 0), MAX_ACTION_DELAY_MS);
      if (delayMs > 0) {
        await sleep(delayMs);
      }

      if (action.type === 'send_text' && action.message && (action.jid || action.phone)) {
        const result = await sendMessage(session.sessionId, {
          jid: action.jid,
          phone: action.phone,
          inboundIdentity,
          message: action.message,
        });
        console.log(
          `[gateway] action send_text ok session=${session.sessionId} to=${maskJid(result.jid)}`
        );
        executed++;
      } else if (action.type === 'send_media' && action.url && (action.jid || action.phone)) {
        const result = await sendMediaMessage(session.sessionId, {
          jid: action.jid,
          phone: action.phone,
          inboundIdentity,
          url: action.url,
          caption: action.caption,
        });
        console.log(
          `[gateway] action send_media ok session=${session.sessionId} to=${maskJid(result.jid)}`
        );
        executed++;
      } else {
        console.warn('[gateway] skipped unknown action', action.type);
      }
    } catch (err) {
      console.error(
        `[gateway] action ${action.type} failed session=${session.sessionId}:`,
        err.message
      );
    }
  }

  return executed;
}

/**
 * @param {SessionState} session
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @returns {Promise<{ text: string, media: { type: string, mime: string, base64: string } | null }>}
 */
async function extractInboundContent(session, msg) {
  const text = extractMessageText(msg);

  const imageMessage = msg.message?.imageMessage;
  if (imageMessage && session.socket) {
    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger: { level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => {} }) },
          reuploadRequest: session.socket.updateMediaMessage,
        }
      );

      if (buffer.length > MAX_INBOUND_IMAGE_BYTES) {
        console.warn(
          `[gateway] inbound image too large session=${session.sessionId} bytes=${buffer.length}`
        );
      } else {
        const mime = imageMessage.mimetype || 'image/jpeg';
        return {
          text,
          media: {
            type: 'image',
            mime,
            base64: buffer.toString('base64'),
          },
        };
      }
    } catch (err) {
      console.error(`[gateway] failed to download inbound image session=${session.sessionId}:`, err.message);
    }
  }

  const audioMessage = msg.message?.audioMessage;
  if (audioMessage && session.socket) {
    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger: { level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => {} }) },
          reuploadRequest: session.socket.updateMediaMessage,
        }
      );

      if (buffer.length > MAX_INBOUND_AUDIO_BYTES) {
        console.warn(
          `[gateway] inbound audio too large session=${session.sessionId} bytes=${buffer.length}`
        );
      } else {
        const mime = audioMessage.mimetype || 'audio/ogg';
        return {
          text,
          media: {
            type: 'audio',
            mime,
            base64: buffer.toString('base64'),
          },
        };
      }
    } catch (err) {
      console.error(`[gateway] failed to download inbound audio session=${session.sessionId}:`, err.message);
    }
  }

  return { text, media: null };
}

/**
 * @param {string} body
 * @param {number} timestamp
 * @param {string} secret
 * @returns {string}
 */
function signWebhookBody(body, timestamp, secret) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}\n${body}`).digest('hex');
}

/**
 * POST assinado para o backend. Devolve o JSON da resposta ou null em qualquer falha.
 *
 * @param {SessionState} session
 * @param {string} url
 * @param {Record<string, unknown>} payload
 */
async function postSignedToBackend(session, url, payload) {
  const apiKey = process.env.GATEWAY_API_KEY;

  if (!apiKey) {
    console.error('[gateway] GATEWAY_API_KEY not set, refusing to call backend');
    return null;
  }

  if (!session.webhookSecret) {
    console.error(
      `[gateway] webhook secret missing for session=${session.sessionId}, refusing to call backend (reconnect required)`
    );
    return null;
  }

  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhookBody(body, timestamp, session.webhookSecret);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Api-Key': apiKey,
      'X-Kinito-Timestamp': String(timestamp),
      'X-Kinito-Signature': signature,
    },
    body,
  });

  const raw = await res.text();

  if (!res.ok) {
    console.error('[gateway] backend HTTP error', res.status, raw.slice(0, 200));
    return null;
  }

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    console.error('[gateway] backend returned non-JSON', res.status, raw.slice(0, 200));
    return null;
  }
}

/**
 * @param {SessionState} session
 * @param {InboundIdentity} identity
 * @param {string} message
 * @param {{ type: string, mime: string, base64: string } | null} media
 */
async function forwardInboundMessage(session, identity, message, media = null, meta = {}) {
  const webhookUrl = process.env.LARAVEL_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[gateway] LARAVEL_WEBHOOK_URL not set, skipping inbound forward');
    return;
  }

  if (!identity.replyJid) {
    console.warn('[gateway] inbound missing replyJid, skipping forward');
    return;
  }

  console.log(
    `[gateway] inbound session=${session.sessionId} replyJid=${maskJid(identity.replyJid)} phone=${identity.phone ? maskPhone(identity.phone) : 'n/a'} len=${message.length} media=${media?.type ?? 'none'}`
  );

  try {
    const payload = {
      user_id: session.sessionId,
      from_jid: identity.replyJid,
      message,
      text: message,
      from_me: Boolean(meta.fromMe),
      is_self_chat: Boolean(meta.isSelfChat),
    };

    console.debug('[gateway] payload', payload);

    if (identity.phone) {
      payload.from = identity.phone;
    }

    if (media) {
      payload.media = media;
    }

    const data = await postSignedToBackend(session, webhookUrl, payload);
    if (!data) {
      return;
    }

    const actions = Array.isArray(data.actions) ? data.actions : [];
    const executed = actions.length ? await executeActions(session, actions, identity) : 0;

    console.log(
      `[gateway] inbound forwarded session=${session.sessionId} flow=${data.flow ?? 'n/a'} executed=${executed} actions=${actions.length}`
    );
  } catch (err) {
    console.error('[gateway] Failed to forward inbound message:', err.message);
  }
}

/**
 * @param {SessionState} session
 * @param {string} sessionPath
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['connection.update']} update
 */
async function handleConnectionUpdate(session, sessionPath, sock, update) {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    session.status = 'qr';
    session.qr = await QRCode.toDataURL(qr, { width: 256, margin: 1 });
  }

  if (connection === 'open') {
    clearReconnectTimer(session.sessionId);
    session.reconnectDelayMs = RECONNECT_BASE_MS;
    session.status = 'connected';
    session.qr = null;
    session.phone = formatPhone(sock.user?.id || '');
    session.ownJids = uniqueStrings([
      ...(session.ownJids || []),
      sock.user?.id,
      sock.user?.lid,
      sock.user?.phoneNumber,
      session.phone ? `${session.phone}@s.whatsapp.net` : '',
    ]);
    session.starting = false;
    console.log(
      `[gateway] Session ${session.sessionId} connected as ${session.phone} ownJids=${session.ownJids.map(maskJid).join('|') || 'n/a'}`
    );
  }

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode
      ?? lastDisconnect?.error?.data?.reason
      ?? lastDisconnect?.error?.message;
    const loggedOut = statusCode === DisconnectReason.loggedOut;

    teardownSocket(session.socket);
    session.socket = null;
    session.starting = false;
    session.qr = null;

    if (loggedOut) {
      clearReconnectTimer(session.sessionId);
      session.status = 'disconnected';
      session.phone = null;
      session.ownJids = [];
      try {
        await removeSessionDirectory(sessionPath);
      } catch (err) {
        console.error(
          `[gateway] Failed to remove session folder for ${session.sessionId}:`,
          err?.message ?? err,
        );
      }
      console.log(`[gateway] Session ${session.sessionId} logged out`);
    } else {
      session.status = 'connecting';
      console.log(
        `[gateway] Session ${session.sessionId} disconnected (code=${statusCode ?? 'unknown'}), reconnecting...`
      );
      scheduleReconnect(session, sessionPath);
    }
  }
}

/**
 * @param {SessionState} session
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['messages.update']} updates
 */
function handleMessagesUpdate(session, updates) {
  for (const update of updates) {
    const status = update.update?.status;
    if (status === undefined || status === null) {
      continue;
    }

    console.log(
      `[gateway] message update session=${session.sessionId} id=${update.key?.id ?? 'n/a'} status=${status} remote=${maskJid(update.key?.remoteJid ?? '')}`
    );
  }
}

/**
 * @param {SessionState} session
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['lid-mapping.update']} mappings
 */
function handleLidMappingUpdate(session, mappings) {
  const count = Array.isArray(mappings) ? mappings.length : 0;
  if (count > 0) {
    console.log(`[gateway] lid-mapping.update session=${session.sessionId} count=${count}`);
  }
}

/**
 * @param {SessionState} session
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo[]} messages
 * @param {import('@whiskeysockets/baileys').MessageUpsertType} type
 */
async function handleMessagesUpsert(session, messages, type) {
  cleanupGatewayEchoes();

  for (const msg of messages) {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid || remoteJid.endsWith('@g.us')) continue;

    const isSelfChat = await isSelfChatMessage(session, msg);
    const isOwnPhoneInbound = msg.key.fromMe && isLikelyOwnPhoneInbound(session, msg);
    const treatAsSelfChat = isSelfChat || isOwnPhoneInbound;

    if (type !== 'notify' && !treatAsSelfChat) continue;

    if (msg.key.fromMe || treatAsSelfChat) {
      console.log(
        `[gateway] upsert session=${session.sessionId} type=${type} fromMe=${Boolean(msg.key.fromMe)} selfChat=${treatAsSelfChat} remote=${maskJid(remoteJid)} id=${msg.key.id ?? 'n/a'}`
      );
    }

    if (msg.key.fromMe && !treatAsSelfChat) continue;

    const rawText = extractMessageText(msg);
    const idSignature = gatewayEchoIdSignature(session.sessionId, msg.key.id);
    const bodySignature = gatewayEchoBodySignature(session.sessionId, remoteJid, rawText);
    if (consumeGatewayEcho(idSignature) || consumeGatewayEcho(bodySignature)) {
      console.log(`[gateway] ignored gateway echo session=${session.sessionId} remote=${maskJid(remoteJid)}`);
      continue;
    }

    const { text, media } = await extractInboundContent(session, msg);
    if (!text && !media) continue;

    console.log(
      `[gateway] handleMessagesUpsert selfChat=${treatAsSelfChat}.`
    );

    const identity = resolveInboundIdentity(msg);
    await forwardInboundMessage(session, identity, text, media, {
      fromMe: Boolean(msg.key.fromMe),
      isSelfChat: treatAsSelfChat,
    });
  }
}

/**
 * @param {SessionState} session
 * @param {string} sessionPath
 */
async function startSession(session, sessionPath) {
  if (session.starting || session.status === 'connected') {
    return;
  }

  session.starting = true;
  session.status = 'connecting';
  session.qr = null;

  teardownSocket(session.socket);
  session.socket = null;

  try {
    await ensureAuthSchema(sessionPath);
    const { state, saveCreds } = await useSecureMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => {} }) },
      browser: ['Kinito', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    session.socket = sock;
    session.ownJids = uniqueStrings([
      state.creds?.me?.id,
      state.creds?.me?.lid,
      state.creds?.me?.jid,
      session.phone ? `${session.phone}@s.whatsapp.net` : '',
    ]);

    sock.ev.on('creds.update', () => {
      saveCreds();

      const me = state.creds?.me;
      if (!me) {
        return;
      }

      session.ownJids = uniqueStrings([
        ...(session.ownJids || []),
        me.id,
        me.lid,
        me.jid,
      ]);

      if (!session.phone && me.id) {
        session.phone = formatPhone(me.id);
      }
    });

    sock.ev.on('connection.update', (update) => {
      runSafely(session, () => handleConnectionUpdate(session, sessionPath, sock, update));
    });

    sock.ev.on('messages.upsert', ({ messages, type }) => {
      runSafely(session, () => handleMessagesUpsert(session, messages, type));
    });

    sock.ev.on('messages.update', (updates) => {
      runSafely(session, () => handleMessagesUpdate(session, updates));
    });

    sock.ev.on('lid-mapping.update', (mappings) => {
      runSafely(session, () => handleLidMappingUpdate(session, mappings));
    });
  } catch (err) {
    session.starting = false;
    session.status = 'disconnected';
    session.socket = null;
    console.error(`[gateway] Failed to start session ${session.sessionId}:`, err.message);
    throw err;
  } finally {
    if (session.status !== 'connected') {
      session.starting = false;
    }
  }
}

/**
 * @param {string} sessionId
 * @param {{ webhookSecret?: string|null }} [options]
 */
export async function connectSession(sessionId, options = {}) {
  const safeId = assertSafeSessionId(sessionId);
  const session = getOrCreateSession(safeId);
  const sessionPath = resolveSessionPath(safeId);

  if (options.webhookSecret) {
    session.webhookSecret = options.webhookSecret;
    await saveGatewayWebhookSecret(sessionPath, options.webhookSecret);
  }

  await startSession(session, sessionPath);
  return getSessionStatus(safeId);
}

/**
 * @param {string} sessionId
 */
export function getSessionStatus(sessionId) {
  const safeId = assertSafeSessionId(sessionId);
  const session = getOrCreateSession(safeId);
  return {
    status: session.status,
    qr: session.qr,
    phone: session.phone,
    connected: session.status === 'connected',
  };
}

/**
 * @param {string} sessionId
 */
export async function disconnectSession(sessionId) {
  const key = assertSafeSessionId(sessionId);
  const session = sessions.get(key);

  clearReconnectTimer(key);

  if (session?.socket) {
    try {
      await session.socket.logout();
    } catch {
      try {
        session.socket.end(undefined);
      } catch {
        // ignore
      }
    }
  }

  sessions.delete(key);

  const sessionPath = resolveSessionPath(key);
  try {
    await removeSessionDirectory(sessionPath);
    console.log(`[gateway] Session ${key} disconnected and credentials removed`);
  } catch (err) {
    console.error(
      `[gateway] Failed to remove session folder for ${key}:`,
      err?.message ?? err,
    );
  }

  return { status: 'disconnected', connected: false, qr: null, phone: null };
}

/**
 * @param {string} sessionId
 * @param {{ phone?: string, message: string, jid?: string, inboundIdentity?: InboundIdentity|null }} options
 */
export async function sendMessage(sessionId, options) {
  const { phone, message, jid, inboundIdentity = null } = options;
  const safeId = assertSafeSessionId(sessionId);
  const session = getOrCreateSession(safeId);

  if (session.status !== 'connected' || !session.socket) {
    throw new Error('WhatsApp session not connected');
  }

  const destination = await resolveOutboundDestination(session.socket, { phone, jid, inboundIdentity });

  try {
    const result = await session.socket.sendMessage(destination, { text: message });
    rememberOutboundEchoes(
      session.sessionId,
      destination,
      result?.key?.id,
      message,
      inboundIdentity,
    );
    console.log(
      `[gateway] sendMessage ok session=${sessionId} to=${maskJid(destination)} id=${result?.key?.id ?? 'n/a'} fromMe=${Boolean(result?.key?.fromMe)}`
    );
  } catch (err) {
    console.error(
      `[gateway] sendMessage failed session=${sessionId}:`,
      err?.message ?? err
    );
    throw err;
  }

  return { success: true, jid: destination };
}

/**
 * @param {string} sessionId
 * @param {{ phone?: string, url: string, caption?: string, jid?: string, inboundIdentity?: InboundIdentity|null }} options
 */
export async function sendMediaMessage(sessionId, options) {
  const { phone, url, caption, jid, inboundIdentity = null } = options;
  assertSafeOutboundUrl(url);
  const safeId = assertSafeSessionId(sessionId);
  const session = getOrCreateSession(safeId);

  if (session.status !== 'connected' || !session.socket) {
    throw new Error('WhatsApp session not connected');
  }

  const destination = await resolveOutboundDestination(session.socket, { phone, jid, inboundIdentity });
  const echoBody = caption || url;

  try {
    const result = await session.socket.sendMessage(destination, {
      image: { url },
      ...(caption ? { caption } : {}),
    });
    rememberOutboundEchoes(
      session.sessionId,
      destination,
      result?.key?.id,
      echoBody,
      inboundIdentity,
    );
    console.log(
      `[gateway] sendMediaMessage ok session=${sessionId} to=${maskJid(destination)} id=${result?.key?.id ?? 'n/a'}`
    );
  } catch (err) {
    console.error(
      `[gateway] sendMediaMessage failed session=${sessionId}:`,
      err?.message ?? err
    );
    throw err;
  }

  return { success: true, jid: destination };
}

/** Restore persisted sessions on startup */
export async function restoreSessions() {
  const sessionsDir = getSessionsDir();
  if (!fs.existsSync(sessionsDir)) return;

  const dirs = fs.readdirSync(sessionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => /^\d+$/.test(name));

  for (const sessionId of dirs) {
    console.log(`[gateway] Restoring session ${sessionId}...`);
    try {
      const sessionPath = resolveSessionPath(sessionId);
      const webhookSecret = await readGatewayWebhookSecret(sessionPath);
      await connectSession(sessionId, webhookSecret ? { webhookSecret } : {});
    } catch (err) {
      console.error(`[gateway] Failed to restore session ${sessionId}:`, err.message);
    }
  }
}

function resolveTickUrl() {
  if (process.env.BACKEND_TICK_URL) {
    return process.env.BACKEND_TICK_URL;
  }

  const webhookUrl = process.env.LARAVEL_WEBHOOK_URL;
  return webhookUrl ? `${webhookUrl.replace(/\/$/, '')}/tick` : null;
}

/**
 * Pergunta ao backend se há trabalho agendado para a sessão (difusão de cardápio,
 * fila de envio) e executa as ações devolvidas. Substitui um cron no backend.
 *
 * @param {SessionState} session
 */
async function tickSession(session) {
  const tickUrl = resolveTickUrl();
  if (!tickUrl || session.status !== 'connected' || !session.webhookSecret) {
    return;
  }

  if (ticksInFlight.has(session.sessionId)) {
    return;
  }

  ticksInFlight.add(session.sessionId);

  try {
    const data = await postSignedToBackend(session, tickUrl, {
      user_id: session.sessionId,
      tick: true,
    });

    const actions = Array.isArray(data?.actions) ? data.actions : [];
    if (actions.length === 0) {
      return;
    }

    const executed = await executeActions(session, actions);
    console.log(
      `[gateway] tick session=${session.sessionId} executed=${executed} actions=${actions.length}`
    );
  } catch (err) {
    console.error(`[gateway] tick failed session=${session.sessionId}:`, err?.message ?? err);
  } finally {
    ticksInFlight.delete(session.sessionId);
  }
}

/** Inicia o loop de tick para todas as sessões conectadas. */
export function startTickLoop() {
  if (!resolveTickUrl()) {
    console.warn('[gateway] tick disabled: LARAVEL_WEBHOOK_URL/BACKEND_TICK_URL not set');
    return null;
  }

  console.log(`[gateway] tick loop every ${TICK_INTERVAL_MS}ms`);

  return setInterval(() => {
    for (const session of sessions.values()) {
      runSafely(session, () => tickSession(session));
    }
  }, TICK_INTERVAL_MS);
}
