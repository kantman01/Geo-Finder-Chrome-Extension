console.log("📌 popup.js yüklendi");

document.getElementById('captureBtn').addEventListener('click', () => {
  console.log("📸 Butona tıklandı");
  html2canvas(document.body).then(canvas => {
    console.log("🖼️ Ekran görüntüsü alındı");
    const base64img = canvas.toDataURL('image/png');
    chrome.runtime.sendMessage({ type: 'screenshot', data: base64img });
  }).catch(err => {
    console.error("html2canvas Hatası:", err);
  });
});
