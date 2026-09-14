const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'CHANGE_ME';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || '';

const GROUP_NAME = 'খাইয়া খাম আছে';

const replies = [
  'ওই ভাই/বইন 😄 কিতা খবর? খাইয়া খাম আছে নি? 😂',
  'আড্ডা জমাইতেছো নি? 😎',
  'হ, কও কিতা অইছে! 😁'
];

app.get('/', (_req, res) => {
  res.send(`🤖 ${GROUP_NAME} Bot is running.`);
});

// Meta Messenger webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Messenger webhook events
app.post('/webhook', async (req, res) => {
  try {
    if (req.body.object !== 'page') return res.sendStatus(404);

    for (const entry of req.body.entry || []) {
      for (const event of entry.messaging || []) {
        if (!event.message || !event.sender) continue;

        const text = (event.message.text || '').trim().toLowerCase();
        if (!text) continue;

        let reply = null;
        if (['hi', 'hello', 'হাই', 'হ্যালো'].includes(text)) {
          reply = `👋 ${GROUP_NAME}-ত স্বাগতম! আইয়া আড্ডা জমাই দেউ! 😄`;
        } else if (text === 'help' || text === 'হেল্প') {
          reply = '🤖 Commands: help, hi, azan, adda';
        } else if (text === 'azan' || text === 'আজান') {
          reply = '🕌 আজান অইছে গো। নামাজর সময় অইছে—চল সবাই নামাজ পড়ি। 🤲';
        } else if (text === 'adda' || text === 'আড্ডা') {
          reply = replies[Math.floor(Math.random() * replies.length)];
        }

        if (reply && PAGE_ACCESS_TOKEN) {
          await sendMessage(event.sender.id, reply);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

async function sendMessage(recipientId, text) {
  const response = await fetch(
    `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Messenger API error ${response.status}: ${body}`);
  }
}

app.listen(PORT, () => {
  console.log(`${GROUP_NAME} Bot running on port ${PORT}`);
});
