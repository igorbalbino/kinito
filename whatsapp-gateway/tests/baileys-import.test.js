import test from 'node:test';
import assert from 'node:assert/strict';

test('Baileys 7 exports required symbols', async () => {
  const baileys = await import('@whiskeysockets/baileys');

  assert.ok(baileys.default, 'default makeWASocket export');
  assert.equal(baileys.DisconnectReason.loggedOut, 401);
  assert.ok(baileys.areJidsSameUser);
  assert.ok(baileys.downloadMediaMessage);
  assert.ok(baileys.fetchLatestBaileysVersion);
  assert.ok(baileys.BufferJSON);
  assert.ok(baileys.initAuthCreds);
  assert.ok(baileys.makeCacheableSignalKeyStore);
  assert.ok(baileys.proto?.Message?.AppStateSyncKeyData?.fromObject);
});
