// content.js
console.log("🧩 content.js yüklendi");

// background.js’den gelen sonucu dinle
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("📥 content.js mesaj aldı:", message);
  if (message.type === 'result') {
    const { location, reason } = message.data;
    alert(`🌍 Yer Tahmini: ${location}\n📌 Sebep: ${reason}`);
  }
});
