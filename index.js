const login = require("fca-unofficial");
const cron = require("node-cron");
const express = require("express");

// Render-এ সার্ভিস অ্যাক্টিভ রাখার জন্য ডামি Server সেটআপ
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.send('🤖 "খাইয়া খাম আছে" সিলেটি চ্যাটবট রানিং আছে!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

const GROUP_NAME = 'খাইয়া খাম আছে';

const replies = [
  'ওই ভাই/বাইন 😄 কিতা খবর? খাইয়া খাম আছে নি? 😂',
  'আড্ডা জমাইতেছো নি? 😎',
  'হ, কও কিতা অইছে! 😁'
];

// Environment Variables থেকে তথ্য সংগ্রহ
const appState = JSON.parse(process.env.FB_APPSTATE || "[]");
const ADMIN_ID = process.env.ADMIN_ID || "";
const TARGET_GROUP_ID = process.env.TARGET_GROUP_ID || "";

// ফেসবুক আইডিতে লগইন ও মেসেঞ্জার হ্যান্ডলিং
login({ appState }, (err, api) => {
  if (err) return console.error("Login Error:", err);

  console.log(`🤖 ${GROUP_NAME} Bot successfully logged in!`);

  api.listenMqtt((err, event) => {
    if (err) return console.error("Listen Error:", err);

    // ১. গ্রুপে নতুন সদস্য যুক্ত হলে (Welcome Message)
    if (event.type === "event" && event.logMessageType === "log:subscribe") {
      api.sendMessage(`👋 ${GROUP_NAME}-ত স্বাগতম! আইয়া আড্ডা জমাই দেউ! 😄`, event.threadID);
    }

    // ২. গ্রুপ থেকে সদস্য বের হলে (Goodbye Message)
    if (event.type === "event" && event.logMessageType === "log:unsubscribe") {
      api.sendMessage("অউগো যাইরা গা? আউক্কা তবে, খেয়াল রাখিও আপনার! 👋", event.threadID);
    }

    // ৩. মেসেজ আসলে সিলেটি রিপ্লাই দেওয়া
    if (event.type === "message" || event.type === "message_reply") {
      const text = (event.body || "").trim().toLowerCase();
      const senderId = event.senderID;
      if (!text) return;

      let reply = null;

      if (['hi', 'hello', 'হাই', 'হ্যালো'].includes(text)) {
        reply = `👋 ${GROUP_NAME}-ত স্বাগতম! আইয়া আড্ডা জমাই দেউ! 😄`;
      } 
      else if (['bye', 'যাই', 'বিদায়'].includes(text)) {
        reply = 'অউগো যাইরা গা? আউক্কা তবে, খেয়াল রাখিও আপনার! 👋';
      }
      else if (text.startsWith('/admin')) {
        if (senderId === ADMIN_ID) {
          reply = '👑 এডমিন সাব! হুকুম খরুইন, খিতা করতাম?';
        } else {
          reply = '❌ আপনি তো এডমিন না ভাই, বাহাদুরি খরইন কেনে? 😂';
        }
      }
      else if (text === 'help' || text === 'হেল্প') {
        reply = '🤖 Commands: help, hi, bye, azan, adda, /admin';
      } 
      else if (text === 'azan' || text === 'আজান') {
        reply = '🕌 আজান অইছে গো। নামাজর সময় অইছে—চল সবাই নামাজ পড়ি। 🤲';
      } 
      else if (text === 'adda' || text === 'আড্ডা') {
        reply = replies[Math.floor(Math.random() * replies.length)];
      } 
      else if (text.startsWith('bot') || text.startsWith('বট')) {
        reply = '🧠 ওমা! অতো শক্ত সওয়াল প্রমপ্ট করছইন? অখনও হিকিয়া শেষ হয় নাই, তবে বুঝছি বিষয়ডা!';
      }

      if (reply) {
        api.sendMessage(reply, event.threadID);
      }
    }
  });

  // প্রতিদিন নির্দিষ্ট সময়ে আজানের অটো রিমাইন্ডার
  cron.schedule('0 13 * * *', () => { // দুপুর ১টায় জোহরের আজান
    if (TARGET_GROUP_ID) {
      api.sendMessage("🕌 জোহরের আজান অইছে গো। নামাজর সময় অইছে—চল সবাই নামাজ পড়ি। 🤲", TARGET_GROUP_ID);
    }
  });
});
