import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

// Fetch secret tokens strictly from environment variables as said 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// 1. Webhook Verification Endpoint (GET)
app.get('/webhook', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook successfully verified.');
    return c.text(challenge, 200);
  }

  return c.text('Forbidden', 403);
});

// 2. Incoming Messages Endpoint (POST)
app.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const senderNumber = message.from;
        const messageBody = message.text?.body;

        console.log(`\n💬 New Message from ${senderNumber}: "${messageBody}"`);
      }

      return c.json({ status: 'success' }, 200);
    }

    return c.text('Not Found', 404);
  } catch (error) {
    console.error('Error parsing WhatsApp payload:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`Hono Webhook server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});