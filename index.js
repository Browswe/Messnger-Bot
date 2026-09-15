const express = require('express');
const login = require('fca-unofficial');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('খাইয়া খাম আছে - Sylheti Bot is Active!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Base64 and Raw JSON AppState Handler
let appState;
try {
  const rawData = process.env.FB_APPSTATE || "";
  const cleanedData = rawData.trim();

  if (!cleanedData) {
    throw new Error("FB_APPSTATE is empty or undefined in Railway Variables!");
  }

  // Base64 নাকি JSON তা চেক করে ডিকোড করার লজিক
  const decodedData = cleanedData.startsWith('[')
    ? cleanedData
    : Buffer.from(cleanedData, 'base64').toString('utf-8');

  appState = JSON.parse(decodedData);
  console.log("AppState successfully parsed!");
} catch (err) {
  console.error('FB_APPSTATE Parsing Failed:', err.message);
  process.exit(1);
}

const ADMIN_ID = process.env.ADMIN_ID || "61593514827236";

login({ appState }, (err, api) => {
  if (err) {
    console.error('Login Error:', err);
    return;
  }

  api.setOptions({
    listenEvents: true,
    selfListen: false,
    logLevel: 'silent',
    forceLogin: true
  });

  console.log('Bot successfully logged in!');

  api.listenMqtt((err, event) => {
    if (err) return;

    if (event.type === "event") {
      if (event.logMessageType === "log:subscribe") {
        const memberName = event.logMessageData.addedParticipants[0].fullName;
        api.sendMessage(`👋 আহারে আহো! ${memberName} ভাই/বাইন, আমড়ার "খাইয়া খাম আছে" গ্রুপে আপনারে স্বাগতম! বইয়া চা খাওকা।`, event.threadID);
      } else if (event.logMessageType === "log:unsubscribe") {
        api.sendMessage(`👋 অউ দেখইন নি কারবার! না খাইয়া অউ বায়দি থাকি ভাগি গেলা। বাই বাই!`, event.threadID);
      }
    }

    if (event.type === "message" || event.type === "message_reply") {
      const msg = event.body ? event.body.toLowerCase() : '';
      const senderID = event.senderID;

      if (msg.startsWith('!roast')) {
        const roasts = [
          "তুইন ভাই অউ চ্যাটে না আইয়া গিয়া ২ বস্তা ময়দা মেখে আইলে বেশি সুন্দর লাগবো!",
          "তোমার বুদ্ধি আর ডিমের খোসা, দুইটাই সমান পাতলা ভাই!",
          "অতো খাইজলামি না করি গিয়া পানের দোকানে গিয়া চুন বেচো গা!",
          "তোমার লগে কথা কইলে মাথার চুল এক একটা করি হড়ি যায় ভাই!"
        ];
        const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
        return api.sendMessage(randomRoast, event.threadID, event.messageID);
      }

      if (msg.startsWith('!play') || msg.startsWith('!song')) {
        const songName = msg.replace('!play', '').replace('!song', '').trim();
        if (!songName) {
          return api.sendMessage('🎵 খানি গানের নাম তো কওয়া লাগবো ভাই! যেমন: !play সিলেটি গান', event.threadID, event.messageID);
        }
        return api.sendMessage(`🎶 "${songName}" গান সার্চ করা ইয়ার... YouTube থাকি শুনি নেওগা ভাই: https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`, event.threadID, event.messageID);
      }

      if (msg.startsWith('!admin')) {
        if (senderID !== ADMIN_ID) {
          return api.sendMessage('🚫 তুইন বটের মালিক নায়! অতো গরম দেখাইও না।', event.threadID, event.messageID);
        }
        return api.sendMessage('👑 জিউ মালিক! কইন কিতা করতাম? বটের সব কন্ট্রোল আপনার আতাত।', event.threadID, event.messageID);
      }

      if (msg.includes('কেমন আছ') || msg.includes('kemon aso')) {
        return api.sendMessage('আলহামদুলিল্লাহ ভাই, খাইয়া খাম নাই তাও ভালা আছি! আপনার কিতা খবর?', event.threadID, event.messageID);
      } else if (msg.includes('কিতা কর') || msg.includes('kita kor')) {
        return api.sendMessage('বইয়া বইয়া মেম্বারদের ফালতু প্যাচাল শুনিয়ার!', event.threadID, event.messageID);
      } else if (msg.includes('আজান') || msg.includes('namaz')) {
        return api.sendMessage('🕌 সময়মতো নামাজ পড়া খুব দরকার ভাই। খাম-কাজ বাদ দিয়া মসজিদে যাওক।', event.threadID, event.messageID);
      } else if (msg.includes('খাইছ নি') || msg.includes('khaiso ni')) {
        return api.sendMessage('আমারে কিতা মানুষ পাইছ নি? আমি কারেন্ট খাইয়া চলি!', event.threadID, event.messageID);
      }
    }
  });
});
