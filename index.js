const express = require('express');
const login = require('fca-unofficial');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('খাইয়া খাম আছে - Sylheti Bot is Active!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let appState;
try {
  appState = JSON.parse(process.env.FB_APPSTATE);
} catch (err) {
  console.error('FB_APPSTATE JSON parse error!');
  process.exit(1);
}

const ADMIN_ID = process.env.ADMIN_ID || "61593514827236";

// অ্যান্ড্রয়েড ব্রাউজারের ইউজার এজেন্ট ব্যবহার করে ব্লক বাইপাস
const loginOptions = {
  appState: appState,
  userAgent: "Mozilla/5.0 (Linux; Android 12; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
};

login(loginOptions, (err, api) => {
  if (err) {
    console.error('Login Error:', err);
    return;
  }

  api.setOptions({
    listenEvents: true,
    selfListen: false,
    logLevel: 'silent',
    forceLogin: true,
    listenTyping: false,
    autoMarkDelivery: false,
    userAgent: "Mozilla/5.0 (Linux; Android 12; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
  });

  console.log('Bot successfully logged in!');

  // Safe Listener Function
  const listenMessages = () => {
    api.listenMqtt((err, event) => {
      if (err) {
        // MQTT ব্লক এড়িয়ে নীরব রি-কানেক্ট
        return setTimeout(listenMessages, 3000);
      }

      // 👋 ১. ওয়েলকাম ও গুডবাই
      if (event.type === "event") {
        if (event.logMessageType === "log:subscribe") {
          const memberName = event.logMessageData.addedParticipants[0].fullName;
          api.sendMessage(`👋 আহারে আহো! ${memberName} ভাই/বাইন, আমড়ার "খাইয়া খাম আছে" গ্রুপে আপনারে স্বাগতম! বইয়া চা খাওকা।`, event.threadID);
        } else if (event.logMessageType === "log:unsubscribe") {
          api.sendMessage(`👋 অউ দেখইন নি কারবার! না খাইয়া অউ বায়দি থাকি ভাগি গেলা। বাই বাই!`, event.threadID);
        }
      }

      // 🤖 ২. চ্যাট মেসেজ
      if (event.type === "message" || event.type === "message_reply") {
        const msg = event.body ? event.body.toLowerCase() : '';
        const senderID = event.senderID;

        // 🔥 রোস্ট
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

        // 🎵 গান
        if (msg.startsWith('!play') || msg.startsWith('!song')) {
          const songName = msg.replace('!play', '').replace('!song', '').trim();
          if (!songName) {
            return api.sendMessage('🎵 খানি গানের নাম তো কওয়া লাগবো ভাই! যেমন: !play সিলেটি গান', event.threadID, event.messageID);
          }
          return api.sendMessage(`🎶 "${songName}" গান সার্চ করা ইয়ার... YouTube থাকি শুনি নেওগা ভাই: https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`, event.threadID, event.messageID);
        }

        // 👑 অ্যাডমিন
        if (msg.startsWith('!admin')) {
          if (senderID !== ADMIN_ID) {
            return api.sendMessage('🚫 তুইন বটের মালিক নায়! অতো গরম দেখাইও না।', event.threadID, event.messageID);
          }
          return api.sendMessage('👑 জিউ মালিক! কইন কিতা করতাম? বটের সব কন্ট্রোল আপনার আতাত।', event.threadID, event.messageID);
        }

        // 🧠 সিলেটি অটো উত্তর
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
  };

  listenMessages();
});
