import crypto from 'crypto';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BufferJSON,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  proto,
} from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getSessionsDir() {
  return path.resolve(
    process.env.WHATSAPP_SESSIONS_DIR || path.join(__dirname, '../sessions'),
  );
}

const SESSION_ID_PATTERN = /^\d+$/;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_VERSION = 1;
export const GATEWAY_AUTH_SCHEMA = 2;
const GATEWAY_META_FILE = '.gateway-meta.json';
const SILENT_LOGGER = {
  level: 'silent',
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => SILENT_LOGGER,
};

/**
 * @param {string} sessionId
 */
export function assertSafeSessionId(sessionId) {
  const value = String(sessionId ?? '').trim();

  if (!SESSION_ID_PATTERN.test(value)) {
    throw new Error('Invalid session id');
  }

  return value;
}

export function ensureSessionsDir() {
  const sessionsDir = getSessionsDir();

  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true, mode: 0o700 });
  }

  try {
    fs.chmodSync(sessionsDir, 0o700);
  } catch {
    // Windows and some mounts ignore POSIX modes.
  }
}

/**
 * @param {string} sessionId
 */
export function resolveSessionPath(sessionId) {
  const safeId = assertSafeSessionId(sessionId);
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, safeId);
  const resolved = path.resolve(sessionPath);

  if (!resolved.startsWith(`${sessionsDir}${path.sep}`) && resolved !== sessionsDir) {
    throw new Error('Invalid session path');
  }

  return resolved;
}

function fixFileName(file) {
  return String(file).replace(/\//g, '__').replace(/:/g, '-');
}

function getEncryptionKey() {
  const raw = process.env.WHATSAPP_SESSION_ENCRYPTION_KEY
    || process.env.SESSION_ENCRYPTION_KEY
    || '';

  if (!raw) {
    return null;
  }

  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length === 32) {
    return decoded;
  }

  throw new Error('WHATSAPP_SESSION_ENCRYPTION_KEY must be 32 bytes (hex or base64)');
}

function encryptionEnabled() {
  return getEncryptionKey() !== null;
}

/**
 * @param {string} plaintext
 * @param {Buffer} key
 */
function encryptPayload(plaintext, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    v: ENCRYPTION_VERSION,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  });
}

/**
 * @param {string} stored
 * @param {Buffer} key
 */
function decryptPayload(stored, key) {
  const parsed = JSON.parse(stored);

  if (parsed?.v !== ENCRYPTION_VERSION) {
    throw new Error('Unsupported encrypted session payload version');
  }

  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const data = Buffer.from(parsed.data, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  return decrypted.toString('utf8');
}

async function fileExists(filepath) {
  try {
    await fsPromises.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} sessionPath
 * @returns {Promise<{ schema?: number, baileysVersion?: string }|null>}
 */
async function readGatewayMeta(sessionPath) {
  const metaPath = path.join(sessionPath, GATEWAY_META_FILE);

  try {
    const raw = await fsPromises.readFile(metaPath, 'utf8');
    const parsed = JSON.parse(raw);

    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} sessionPath
 */
async function writeGatewayMeta(sessionPath) {
  await fsPromises.mkdir(sessionPath, { recursive: true, mode: 0o700 });

  const existing = await readGatewayMeta(sessionPath);
  const metaPath = path.join(sessionPath, GATEWAY_META_FILE);
  const payload = {
    ...existing,
    schema: GATEWAY_AUTH_SCHEMA,
    baileysVersion: '7.0.0-rc13',
    updatedAt: new Date().toISOString(),
  };

  await fsPromises.writeFile(metaPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
}

/**
 * @param {string} sessionPath
 * @returns {Promise<string|null>}
 */
export async function readGatewayWebhookSecret(sessionPath) {
  const meta = await readGatewayMeta(sessionPath);
  const secret = meta?.webhookSecret;

  return typeof secret === 'string' && secret !== '' ? secret : null;
}

/**
 * @param {string} sessionPath
 * @param {string} webhookSecret
 */
export async function saveGatewayWebhookSecret(sessionPath, webhookSecret) {
  await fsPromises.mkdir(sessionPath, { recursive: true, mode: 0o700 });

  const existing = (await readGatewayMeta(sessionPath)) ?? {};
  const metaPath = path.join(sessionPath, GATEWAY_META_FILE);
  const payload = {
    ...existing,
    schema: GATEWAY_AUTH_SCHEMA,
    baileysVersion: existing.baileysVersion ?? '7.0.0-rc13',
    webhookSecret,
    updatedAt: new Date().toISOString(),
  };

  await fsPromises.writeFile(metaPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
}

/**
 * Wipe legacy Baileys 6.x session data when auth schema is outdated.
 *
 * @param {string} sessionPath
 * @returns {Promise<boolean>} true when the folder was reset
 */
export async function ensureAuthSchema(sessionPath) {
  const meta = await readGatewayMeta(sessionPath);

  if (meta?.schema >= GATEWAY_AUTH_SCHEMA) {
    return false;
  }

  const hadSessionData = fs.existsSync(sessionPath)
    && fs.readdirSync(sessionPath).some((name) => name !== GATEWAY_META_FILE);

  if (hadSessionData) {
    await removeSessionDirectory(sessionPath);
    console.warn(
      '[gateway] Baileys 7 auth schema — sessão anterior removida; escaneie QR novamente',
    );
  }

  await writeGatewayMeta(sessionPath);
  return hadSessionData;
}

/**
 * @param {string} folder
 */
export async function useSecureMultiFileAuthState(folder) {
  await fsPromises.mkdir(folder, { recursive: true, mode: 0o700 });

  try {
    await fsPromises.chmod(folder, 0o700);
  } catch {
    // ignore unsupported platforms
  }

  const key = getEncryptionKey();
  const encryptAtRest = key !== null;

  if (!encryptAtRest && process.env.NODE_ENV === 'production') {
    console.warn(
      '[gateway] WHATSAPP_SESSION_ENCRYPTION_KEY is not set; WhatsApp session files are stored without encryption at rest.',
    );
  }

  /**
   * @param {unknown} data
   * @param {string} file
   */
  const writeData = async (data, file) => {
    const filepath = path.join(folder, fixFileName(file));
    const content = JSON.stringify(data, BufferJSON.replacer, 2);

    if (encryptAtRest) {
      await fsPromises.writeFile(
        `${filepath}.enc`,
        encryptPayload(content, key),
        { mode: 0o600 },
      );

      try {
        await fsPromises.unlink(filepath);
      } catch {
        // Legacy plain file may not exist.
      }

      return;
    }

    await fsPromises.writeFile(filepath, content, { mode: 0o600 });
  };

  /**
   * @param {string} file
   */
  const readData = async (file) => {
    const filepath = path.join(folder, fixFileName(file));
    const encryptedPath = `${filepath}.enc`;

    try {
      if (encryptAtRest && await fileExists(encryptedPath)) {
        const stored = await fsPromises.readFile(encryptedPath, 'utf8');
        const plaintext = decryptPayload(stored, key);

        return JSON.parse(plaintext, BufferJSON.reviver);
      }

      const raw = await fsPromises.readFile(filepath, 'utf8');

      return JSON.parse(raw, BufferJSON.reviver);
    } catch {
      return null;
    }
  };

  /**
   * @param {string} file
   */
  const removeData = async (file) => {
    const filepath = path.join(folder, fixFileName(file));

    await Promise.all([
      fsPromises.unlink(filepath).catch(() => {}),
      fsPromises.unlink(`${filepath}.enc`).catch(() => {}),
    ]);
  };

  const creds = (await readData('creds.json')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: makeCacheableSignalKeyStore(
        {
          get: async (type, ids) => {
            const data = {};

            await Promise.all(
              ids.map(async (id) => {
                let value = await readData(`${type}-${id}.json`);

                if (type === 'app-state-sync-key' && value) {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }

                data[id] = value;
              }),
            );

            return data;
          },
          set: async (data) => {
            const tasks = [];

            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const file = `${category}-${id}.json`;
                tasks.push(value ? writeData(value, file) : removeData(file));
              }
            }

            await Promise.all(tasks);
          },
        },
        SILENT_LOGGER,
      ),
    },
    saveCreds: async () => writeData(creds, 'creds.json'),
    encryptionEnabled: encryptAtRest,
  };
}

/**
 * @param {string} sessionPath
 */
export async function removeSessionDirectory(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    return;
  }

  const sessionsDir = getSessionsDir();
  const resolved = path.resolve(sessionPath);
  if (!resolved.startsWith(`${sessionsDir}${path.sep}`)) {
    throw new Error('Refusing to delete path outside sessions directory');
  }

  await fsPromises.rm(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

export function logSessionStorageMode() {
  if (encryptionEnabled()) {
    console.log('[gateway] WhatsApp session storage: encrypted at rest (AES-256-GCM)');
    return;
  }

  console.warn('[gateway] WhatsApp session storage: plaintext (set WHATSAPP_SESSION_ENCRYPTION_KEY to encrypt creds on disk)');
}
