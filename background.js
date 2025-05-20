// background.js

// Orijinal prompt’un
const PROMPT = `
You are an expert in visual geolocation. Analyze the image and guess the most likely location (country and city).
Use visual clues like architecture, languages on signs, license plates, vegetation, flags, etc.

Reply in this format:

🕵️ Clues Detected:
- [...]

🌍 Most Likely Location: [Country, City/Region]
Reason: [...]
`;

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== 'screenshot') return;

  console.log("📩 background.js mesaj aldı:", message.type);

  (async () => {
    // 1) Görseli backend’e yolla
    console.log("🚀 Görsel backend’e gönderiliyor...");
    let result;
    try {
      const resp = await fetch("http://localhost:5000/api/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: message.data, prompt: PROMPT })
      });
      result = await resp.json();
      console.log("✅ Backend’den tahmin alındı:", result);
    } catch (err) {
      console.error("❌ Fetch hata:", err);
      result = { location: "Tahmin alınamadı", reason: err.message };
    }

    // 2) Tahmin sonucunu ilgili sekmeye yolla
    const tabId = sender.tab?.id
      || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (!tabId) return console.error("🚨 Tab ID bulunamadı");

    chrome.tabs.sendMessage(tabId, {
      type: 'result',
      data: result
    });
  })();
});
