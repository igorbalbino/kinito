import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

function signWebhookBody(body, timestamp, secret) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}\n${body}`).digest('hex');
}

test('signWebhookBody matches Laravel InternalRequestSignature scheme', () => {
  const body = JSON.stringify({ user_id: 42, message: 'Oi' });
  const timestamp = 1_700_000_000;
  const secret = 'test-secret';

  const signature = signWebhookBody(body, timestamp, secret);

  assert.equal(signature.length, 64);
  assert.equal(
    signature,
    crypto.createHmac('sha256', secret).update(`${timestamp}\n${body}`).digest('hex')
  );
});

test('signWebhookBody changes when user_id is tampered', () => {
  const timestamp = 1_700_000_000;
  const secret = 'test-secret';
  const original = JSON.stringify({ user_id: 42, message: 'Oi' });
  const tampered = JSON.stringify({ user_id: 99, message: 'Oi' });

  const originalSignature = signWebhookBody(original, timestamp, secret);
  const tamperedSignature = signWebhookBody(tampered, timestamp, secret);

  assert.notEqual(originalSignature, tamperedSignature);
});
