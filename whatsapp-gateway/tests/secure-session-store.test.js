import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

test('assertSafeSessionId accepts numeric ids only', async () => {
  process.env.WHATSAPP_SESSIONS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kinito-session-'));
  const { assertSafeSessionId, resolveSessionPath } = await import('../src/secure-session-store.js');

  assert.equal(assertSafeSessionId('42'), '42');
  assert.throws(() => assertSafeSessionId('../1'), /Invalid session id/);
  assert.throws(() => assertSafeSessionId('abc'), /Invalid session id/);
  assert.throws(() => resolveSessionPath('../etc'), /Invalid session id/);
});

test('useSecureMultiFileAuthState encrypts creds when key is configured', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kinito-session-'));
  process.env.WHATSAPP_SESSIONS_DIR = tempRoot;
  process.env.WHATSAPP_SESSION_ENCRYPTION_KEY = 'a'.repeat(64);

  const {
    resolveSessionPath,
    useSecureMultiFileAuthState,
    removeSessionDirectory,
  } = await import('../src/secure-session-store.js');

  const sessionPath = resolveSessionPath('99');
  const { saveCreds } = await useSecureMultiFileAuthState(sessionPath);
  await saveCreds();

  assert.equal(fs.existsSync(path.join(sessionPath, 'creds.json')), false);
  assert.equal(fs.existsSync(path.join(sessionPath, 'creds.json.enc')), true);

  await removeSessionDirectory(sessionPath);
  fs.rmSync(tempRoot, { recursive: true, force: true });

  delete process.env.WHATSAPP_SESSIONS_DIR;
  delete process.env.WHATSAPP_SESSION_ENCRYPTION_KEY;
});

test('ensureAuthSchema wipes legacy session data and writes schema v2 meta', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kinito-session-'));
  process.env.WHATSAPP_SESSIONS_DIR = tempRoot;

  const {
    GATEWAY_AUTH_SCHEMA,
    ensureAuthSchema,
    resolveSessionPath,
  } = await import('../src/secure-session-store.js');

  const sessionPath = resolveSessionPath('42');
  fs.mkdirSync(sessionPath, { recursive: true });
  fs.writeFileSync(path.join(sessionPath, 'creds.json'), '{"legacy":true}');

  const wiped = await ensureAuthSchema(sessionPath);
  assert.equal(wiped, true);
  assert.equal(fs.existsSync(path.join(sessionPath, 'creds.json')), false);

  const meta = JSON.parse(fs.readFileSync(path.join(sessionPath, '.gateway-meta.json'), 'utf8'));
  assert.equal(meta.schema, GATEWAY_AUTH_SCHEMA);

  const wipedAgain = await ensureAuthSchema(sessionPath);
  assert.equal(wipedAgain, false);

  fs.rmSync(tempRoot, { recursive: true, force: true });
  delete process.env.WHATSAPP_SESSIONS_DIR;
});
