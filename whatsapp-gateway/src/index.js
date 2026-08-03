import 'dotenv/config';
import express from 'express';
import {
  connectSession,
  disconnectSession,
  getSessionStatus,
  restoreSessions,
  sendMessage,
  sendMediaMessage,
  startTickLoop,
} from './session-manager.js';
import { assertSafeOutboundUrl } from './safe-url.js';
import { assertSafeSessionId, logSessionStorageMode } from './secure-session-store.js';

// Baileys/WebSocket may reject with raw close codes (e.g. "1006") — log instead of crashing Node 22+.
process.on('unhandledRejection', (reason) => {
  console.error('[gateway] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[gateway] Uncaught exception:', err?.message ?? err);
});

const app = express();
app.use(express.json());

const PORT = process.env.WHATSAPP_GATEWAY_PORT || 3001;
const API_KEY = process.env.GATEWAY_API_KEY || 'medflow-gateway-dev';

function authMiddleware(req, res, next) {
  const key = req.headers['x-gateway-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'medflow-whatsapp-gateway' });
});

app.use(authMiddleware);

function parseSessionId(req, res, next) {
  try {
    req.sessionId = assertSafeSessionId(req.params.sessionId);
    next();
  } catch {
    res.status(422).json({ error: 'Invalid session id' });
  }
}

app.get('/sessions/:sessionId/status', parseSessionId, (req, res) => {
  res.json(getSessionStatus(req.sessionId));
});

app.post('/sessions/:sessionId/connect', parseSessionId, async (req, res) => {
  try {
    const webhookSecret = req.body?.webhook_secret;
    const status = await connectSession(req.sessionId, {
      webhookSecret: typeof webhookSecret === 'string' && webhookSecret !== '' ? webhookSecret : null,
    });
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/sessions/:sessionId', parseSessionId, async (req, res) => {
  try {
    const status = await disconnectSession(req.sessionId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/sessions/:sessionId/send', parseSessionId, async (req, res) => {
  const { phone, message, jid } = req.body || {};
  if (!message || (!phone && !jid)) {
    return res.status(422).json({ error: 'message and phone or jid are required' });
  }

  try {
    const result = await sendMessage(req.sessionId, { phone, message, jid });
    res.json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

app.post('/sessions/:sessionId/send-media', parseSessionId, async (req, res) => {
  const { phone, url, caption, jid } = req.body || {};
  if (!url || (!phone && !jid)) {
    return res.status(422).json({ error: 'url and phone or jid are required' });
  }

  try {
    assertSafeOutboundUrl(url);
    const result = await sendMediaMessage(req.sessionId, { phone, url, caption, jid });
    res.json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  logSessionStorageMode();
  console.log(`[gateway] MedFlow WhatsApp Gateway listening on port ${PORT}`);
  restoreSessions().catch((err) => {
    console.error('[gateway] restoreSessions failed:', err?.message ?? err);
  });
  startTickLoop();
});
