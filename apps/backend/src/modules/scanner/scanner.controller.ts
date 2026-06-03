import { Controller, Get, Post, Body, Res, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { ScannerService } from './scanner.service';

@Controller('scanner')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  @Get()
  getPage(@Res() res: Response) {
    res.type('html').send(SCANNER_HTML);
  }

  @Post('barcode')
  @HttpCode(200)
  receive(@Body() body: { barcode: string }) {
    if (body?.barcode) this.scanner.setBarcode(body.barcode);
    return { ok: true };
  }

  @Get('pending')
  pending() {
    return { barcode: this.scanner.getPending() };
  }
}

const SCANNER_HTML = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Dauran Scanner</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000; color: #fff;
      font-family: -apple-system, sans-serif;
      height: 100dvh; overflow: hidden;
      display: flex; flex-direction: column;
    }

    /* Kamera viewfinder — butun ekran */
    #videoWrap {
      position: relative; flex: 1; overflow: hidden; background: #000;
    }
    #video {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }

    /* Markaziy scanning ramkasi */
    .frame {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 70vw; height: 160px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      pointer-events: none;
    }
    .frame::before, .frame::after,
    .frame-tl::before, .frame-tl::after {
      content: ''; position: absolute;
      width: 24px; height: 24px;
      border-color: #3b82f6; border-style: solid;
    }
    .frame::before  { top: -2px; left: -2px;  border-width: 3px 0 0 3px; border-radius: 10px 0 0 0; }
    .frame::after   { top: -2px; right: -2px; border-width: 3px 3px 0 0; border-radius: 0 10px 0 0; }
    .frame-tl::before { bottom: -2px; left: -2px;  border-width: 0 0 3px 3px; border-radius: 0 0 0 10px; }
    .frame-tl::after  { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; border-radius: 0 0 10px 0; }

    /* Skanerlash animatsiyasi */
    .scan-line {
      position: absolute; left: 4px; right: 4px; height: 2px;
      background: linear-gradient(90deg, transparent, #3b82f6, transparent);
      animation: scanMove 1.8s ease-in-out infinite;
      top: 0;
    }
    @keyframes scanMove {
      0%   { top: 8px;  opacity: 1; }
      50%  { top: calc(100% - 10px); opacity: 1; }
      100% { top: 8px;  opacity: 1; }
    }

    /* Qorong'ilik overlay (ramkadan tashqari) */
    .overlay-top, .overlay-bottom, .overlay-left, .overlay-right {
      position: absolute; background: rgba(0,0,0,0.55); pointer-events: none;
    }
    .overlay-top    { top: 0; left: 0; right: 0; height: calc(50% - 80px); }
    .overlay-bottom { bottom: 0; left: 0; right: 0; height: calc(50% - 80px); }
    .overlay-left   { top: calc(50% - 80px); left: 0; width: calc(15vw); height: 160px; }
    .overlay-right  { top: calc(50% - 80px); right: 0; width: calc(15vw); height: 160px; }

    /* Holat paneli — pastda */
    .bottom-panel {
      background: #0f172a; padding: 12px 16px;
      display: flex; flex-direction: column; gap: 8px;
      border-top: 1px solid #1e293b;
    }
    .status-row {
      display: flex; align-items: center; gap-10px;
      justify-content: space-between;
    }
    .status {
      font-size: 14px; font-weight: 600;
      padding: 6px 12px; border-radius: 8px; flex: 1;
      text-align: center;
    }
    .status.scanning { background: #1e293b; color: #60a5fa; }
    .status.success  { background: #14532d; color: #4ade80; animation: flash 0.3s; }
    .status.error    { background: #450a0a; color: #f87171; }
    @keyframes flash { 0%{opacity:0.2} 100%{opacity:1} }

    .last-row {
      display: flex; align-items: center; gap: 8px;
    }
    .last-code {
      flex: 1; font-family: monospace; font-size: 15px;
      color: #94a3b8; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count-badge {
      background: #1e3a5f; color: #60a5fa;
      font-size: 12px; font-weight: 700;
      padding: 3px 8px; border-radius: 6px; white-space: nowrap;
    }

    /* Qo'lda kiritish */
    .manual-row {
      display: flex; gap: 6px;
    }
    .manual-input {
      flex: 1; background: #1e293b; border: 1px solid #334155;
      border-radius: 8px; padding: 8px 10px; color: white;
      font-size: 14px; font-family: monospace; outline: none;
    }
    .manual-input:focus { border-color: #3b82f6; }
    .manual-btn {
      background: #3b82f6; color: white; border: none;
      border-radius: 8px; padding: 8px 14px; font-size: 13px;
      font-weight: 700; cursor: pointer; white-space: nowrap;
    }

    /* Kamera yo'q holda — fallback tugma */
    #fallbackWrap {
      display: none; flex: 1;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding: 24px; text-align: center;
    }
    .big-btn {
      width: 100%; max-width: 320px; padding: 18px;
      background: #3b82f6; color: white; border: none;
      border-radius: 14px; font-size: 18px; font-weight: 700; cursor: pointer;
    }
    #fallbackPreview {
      width: 100%; max-width: 320px; border-radius: 10px; display: none;
    }
    #fallbackFileInput { display: none; }
  </style>
</head>
<body>

<!-- Live kamera viewfinder -->
<div id="videoWrap">
  <video id="video" autoplay playsinline muted></video>
  <div class="overlay-top"></div>
  <div class="overlay-bottom"></div>
  <div class="overlay-left"></div>
  <div class="overlay-right"></div>
  <div class="frame">
    <div class="frame-tl"></div>
    <div class="scan-line"></div>
  </div>
</div>

<!-- Fallback: HTTPS yo'q bo'lsa oddiy foto -->
<div id="fallbackWrap">
  <div style="color:#94a3b8;font-size:13px;">
    Live kamera uchun<br>
    <strong style="color:#f59e0b;">https://192.168.0.101:3443/api/v1/scanner</strong><br>
    manzilini ishlating
  </div>
  <button class="big-btn" onclick="openFallbackCamera()">Suratga olish</button>
  <input type="file" id="fallbackFileInput" accept="image/*" capture="environment">
  <img id="fallbackPreview">
</div>

<!-- Pastki panel -->
<div class="bottom-panel">
  <div class="status scanning" id="status">Barkodni ramkaga to'g'rilang...</div>

  <div class="last-row">
    <div class="last-code" id="lastCode">—</div>
    <div class="count-badge" id="countBadge">0 ta yuborildi</div>
  </div>

  <div class="manual-row">
    <input type="text" id="manualInput" class="manual-input" inputmode="numeric" placeholder="Qo'lda kiritish...">
    <button class="manual-btn" onclick="sendManual()">Yuborish</button>
  </div>
</div>

<script>
  const statusEl   = document.getElementById('status');
  const lastCodeEl = document.getElementById('lastCode');
  const countEl    = document.getElementById('countBadge');
  const manualEl   = document.getElementById('manualInput');
  const video      = document.getElementById('video');
  const videoWrap  = document.getElementById('videoWrap');
  const fallback   = document.getElementById('fallbackWrap');

  // API bazaviy URL — HTTP va HTTPS ikkalasida ham ishlaydi
  const API_BASE = location.protocol + '//' + location.hostname + ':3000/api/v1';

  let scanCount = 0;
  let lastSent  = '';
  let lastSentAt = 0;
  let scanning  = false;
  let detector  = null;

  function setStatus(type, msg) {
    statusEl.className = 'status ' + type;
    statusEl.textContent = msg;
  }

  function onSuccess(code) {
    if (code === lastSent && Date.now() - lastSentAt < 2000) return; // dedup 2s
    lastSent = code; lastSentAt = Date.now();
    scanCount++;
    lastCodeEl.textContent = code;
    countEl.textContent = scanCount + ' ta yuborildi';
    setStatus('success', '✓ ' + code);
    sendBarcode(code);
    setTimeout(() => setStatus('scanning', 'Barkodni ramkaga to\'g\'rilang...'), 1500);
  }

  async function sendBarcode(barcode) {
    try {
      await fetch(API_BASE + '/scanner/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });
    } catch {}
  }

  // BarcodeDetector (iOS 17+, Chrome 83+)
  function initDetector() {
    if (!('BarcodeDetector' in window)) return null;
    try {
      return new BarcodeDetector({
        formats: ['ean_13','ean_8','code_128','code_39','code_93',
                  'upc_a','upc_e','qr_code','data_matrix','pdf417','itf']
      });
    } catch { return null; }
  }

  // BarcodeDetector bilan video frame scan qilish
  async function scanLoop() {
    if (!scanning || !detector) return;
    try {
      if (video.readyState >= 2) {
        const results = await detector.detect(video);
        if (results.length > 0) onSuccess(results[0].rawValue);
      }
    } catch {}
    requestAnimationFrame(scanLoop);
  }

  // ZXing bilan continuous scan (BarcodeDetector yo'q bo'lganda)
  let zxingReader = null;
  function startZxing() {
    if (typeof ZXingBrowser === 'undefined') return;
    const hints = new Map(); hints.set(3, true);
    zxingReader = new ZXingBrowser.BrowserMultiFormatReader(hints);
    zxingReader.decodeFromVideoDevice(null, 'video', (result, err) => {
      if (result) onSuccess(result.getText());
    });
  }

  async function startLiveCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        scanning = true;
        detector = initDetector();
        if (detector) {
          setStatus('scanning', 'Barkodni ramkaga to\'g\'rilang...');
          scanLoop();
        } else {
          setStatus('scanning', 'ZXing bilan skanerlanyabdi...');
          startZxing();
        }
      };
    } catch (err) {
      // getUserMedia ishlamadi (HTTP yoki ruxsat yo'q)
      videoWrap.style.display = 'none';
      fallback.style.display  = 'flex';
      setStatus('error', 'Live kamera yo\'q — foto rejim');
      startFallbackMode();
    }
  }

  // ---- Fallback: foto rejim (HTTP uchun) ----
  function openFallbackCamera() {
    document.getElementById('fallbackFileInput').click();
  }

  function startFallbackMode() {
    const fileInput = document.getElementById('fallbackFileInput');
    const preview   = document.getElementById('fallbackPreview');

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      setStatus('scanning', 'Tahlil qilinmoqda...');

      const img = await loadImg(file);
      preview.src = img.src; preview.style.display = 'block';

      const avgBr = measureBr(img);
      const gamma = avgBr < 70 ? 2.8 : avgBr < 120 ? 2.0 : 1.0;

      const c1 = toCanvas(img, 1280, gamma, 1.6);
      const c2 = toCanvas(img, 1280, gamma * 1.3, 2.2);

      let code = null;

      // Native BarcodeDetector bilan
      const det = initDetector();
      if (det) {
        for (const [c, deg] of [[c1,0],[c1,45],[c1,90],[c1,135],[c2,0],[c2,45]]) {
          try {
            const bm = await createImageBitmap(deg ? rotCanvas(c, deg) : c);
            const r  = await det.detect(bm); bm.close();
            if (r.length) { code = r[0].rawValue; break; }
          } catch {}
        }
      }

      // ZXing fallback
      if (!code) {
        const hints = new Map(); hints.set(3, true);
        const rd = new ZXingBrowser.BrowserMultiFormatReader(hints);
        for (const [c, deg] of [[c1,0],[c1,45],[c1,90],[c1,135],[c2,0],[c2,45],[c2,90],
                                 [toCanvas(img,2000,gamma,1.6),0],[toCanvas(img,2000,gamma,1.6),45]]) {
          try {
            const src = deg ? rotCanvas(c, deg) : c;
            const res = await rd.decodeFromImageUrl(src.toDataURL('image/jpeg', 0.92));
            code = res.getText(); break;
          } catch {}
        }
      }

      fileInput.value = '';
      if (code) { onSuccess(code); }
      else { setStatus('error', 'Aniqlanmadi — yaqinroq, yoritilgan joyda suring'); }
    });
  }

  function loadImg(file) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = URL.createObjectURL(file);
    });
  }
  function measureBr(img) {
    const c = document.createElement('canvas'); c.width = c.height = 80;
    c.getContext('2d').drawImage(img, 0, 0, 80, 80);
    const d = c.getContext('2d').getImageData(0,0,80,80).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
    return s / (d.length / 4);
  }
  function toCanvas(img, maxPx, gamma, contrast) {
    let w = img.naturalWidth, h = img.naturalHeight;
    const r = Math.min(maxPx/w, maxPx/h, 1);
    w = Math.round(w*r); h = Math.round(h*r);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0,0,w,h); const d = id.data;
    const inv = 1/gamma;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
      const b = 255*Math.pow(g/255, inv);
      const e = Math.min(255, Math.max(0, (b-128)*contrast+128));
      d[i] = d[i+1] = d[i+2] = e;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }
  function rotCanvas(canvas, deg) {
    const rad = deg*Math.PI/180;
    const ac = Math.abs(Math.cos(rad)), as = Math.abs(Math.sin(rad));
    const out = document.createElement('canvas');
    out.width  = Math.ceil(canvas.width*ac + canvas.height*as);
    out.height = Math.ceil(canvas.width*as + canvas.height*ac);
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,out.width,out.height);
    ctx.translate(out.width/2, out.height/2);
    ctx.rotate(rad);
    ctx.drawImage(canvas, -canvas.width/2, -canvas.height/2);
    return out;
  }

  function sendManual() {
    const v = manualEl.value.trim();
    if (!v) return;
    onSuccess(v); manualEl.value = '';
  }
  manualEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendManual(); });

  startLiveCamera();
</script>
<script src="https://unpkg.com/@zxing/browser@0.1.5/umd/index.min.js" defer></script>
</body>
</html>`;
