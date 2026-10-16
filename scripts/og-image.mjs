// Draws apps/web/public/og.png, the image link previews show (WhatsApp, X, Telegram): 1200x630.
// Run from the repository root: node scripts/og-image.mjs  (then bump "?v=" in apps/web/app/layout.tsx,
// since apps that share links keep the old image for the same URL).
//
// Neutral on purpose: the map is in the site's own three colours, never in any candidate's.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from '../apps/web/node_modules/@playwright/test/index.mjs';

const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const brazil = require('@svg-maps/brazil').default ?? require('@svg-maps/brazil');
const font = readFileSync(
  require.resolve('@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2'),
).toString('base64');

const [GREEN, YELLOW, BLUE] = ['#12A15F', '#F6C343', '#2563D9'];
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: Archivo;
    src: url(data:font/woff2;base64,${font}) format('woff2');
    font-weight: 100 900;
    font-stretch: 62% 125%;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    font-family: Archivo, sans-serif; color: #eceef1; background: #0e1013;
  }
  /* Two soft lights in the brand's colours, so the dark never looks flat. */
  .glow { position: absolute; border-radius: 50%; filter: blur(90px); }
  .glow.a { width: 620px; height: 620px; right: -120px; top: -160px; background: ${BLUE}; opacity: .34; }
  .glow.b { width: 520px; height: 520px; right: 180px; bottom: -300px; background: ${GREEN}; opacity: .26; }
  .glow.c { width: 380px; height: 380px; left: -160px; bottom: -220px; background: ${YELLOW}; opacity: .10; }
  .stripe { position: absolute; inset: 0 0 auto 0; height: 10px; display: flex; }
  .stripe i { flex: 1; }
  .left { position: absolute; left: 72px; top: 58px; bottom: 50px; width: 690px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 700; letter-spacing: -.01em; }
  .brand small { display: block; font-size: 17px; font-weight: 500; color: #8b93a1; letter-spacing: 0; }
  .chip {
    margin-top: 34px; align-self: flex-start; display: flex; align-items: center; gap: 12px;
    padding: 10px 20px 10px 16px; border-radius: 999px; font-size: 23px; font-weight: 600;
    background: rgb(255 255 255 / .07); border: 1px solid rgb(255 255 255 / .14);
  }
  .dot { width: 13px; height: 13px; border-radius: 50%; background: #ff4d4d; box-shadow: 0 0 0 6px rgb(255 77 77 / .22); }
  .chip b { color: #ff6b6b; font-weight: 700; letter-spacing: .04em; }
  .chip span { color: #c9ced6; }
  h1 { white-space: nowrap; margin-top: 16px; font-size: 86px; line-height: .93; font-weight: 800; letter-spacing: -.035em; font-stretch: 96%; }
  h1 em { font-style: normal; background: linear-gradient(100deg, ${GREEN}, ${YELLOW} 52%, #4f8bff); -webkit-background-clip: text; color: transparent; }
  /* The main features, big enough to read in a chat's small preview. */
  .features { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .feature {
    display: flex; align-items: center; gap: 16px; padding: 14px 18px 14px 14px; border-radius: 18px;
    background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .13);
  }
  .feature .icon {
    flex: none; width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center;
    justify-content: center; color: #0e1013;
  }
  .feature b { display: block; font-size: 26px; white-space: nowrap; font-weight: 700; letter-spacing: -.01em; line-height: 1.1; }
  .feature span { display: block; margin-top: 3px; font-size: 19px; color: #aab1bc; white-space: nowrap; }
  .foot { margin-top: auto; display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 600; }
  .foot .url { padding: 8px 16px; border-radius: 12px; background: #eceef1; color: #0e1013; font-size: 22px; }
  .map { position: absolute; right: 34px; top: 84px; width: 400px; height: 450px; }
  .map svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 24px 50px rgb(0 0 0 / .55)); }
  .map path { fill: url(#brand); stroke: #0e1013; stroke-width: 1.6; stroke-linejoin: round; }
</style>
</head>
<body>
  <div class="glow a"></div><div class="glow b"></div><div class="glow c"></div>
  <div class="stripe"><i style="background:${GREEN}"></i><i style="background:${YELLOW}"></i><i style="background:${BLUE}"></i></div>
  <div class="left">
    <div class="brand">
      <svg viewBox="0 0 32 32" width="50" height="50">
        <rect x="4" y="18" width="6" height="10" rx="3" fill="${GREEN}"/>
        <rect x="13" y="11" width="6" height="17" rx="3" fill="${YELLOW}"/>
        <rect x="22" y="4" width="6" height="24" rx="3" fill="${BLUE}"/>
      </svg>
      <div>Eleições Brasil<small>by lucianookdp</small></div>
    </div>
    <div class="chip"><i class="dot"></i><b>AO VIVO</b><span>2º turno · 25 de outubro</span></div>
    <h1>Eleições <em>2026</em></h1>
    <div class="features">
      <div class="feature"><div class="icon" style="background:${GREEN}"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></div><div><b>Resultado ao vivo</b><span>Sem recarregar</span></div></div>
      <div class="feature"><div class="icon" style="background:${YELLOW}"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg></div><div><b>Sua cidade</b><span>Em destaque</span></div></div>
      <div class="feature"><div class="icon" style="background:#4f8bff"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div><div><b>Modo telão</b><span>TV e transmissão</span></div></div>
      <div class="feature"><div class="icon" style="background:#c9ced6"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8 18 4v16L6 16V8Z"/><path d="m6 8 12 4-12 4"/></svg></div><div><b>Polymarket</b><span>Apostas ao vivo</span></div></div>
    </div>
    <div class="foot"><span class="url">eleicoes.lucianookdp.dev</span></div>
  </div>
  <div class="map">
    <svg viewBox="${brazil.viewBox}" aria-hidden="true">
      <defs>
        <linearGradient id="brand" gradientUnits="userSpaceOnUse" x1="90" y1="60" x2="520" y2="560">
          <stop offset="0" stop-color="${GREEN}"/>
          <stop offset=".5" stop-color="${YELLOW}"/>
          <stop offset="1" stop-color="#3b7bff"/>
        </linearGradient>
      </defs>
      ${brazil.locations.map((l) => `<path d="${l.path}"/>`).join('')}
    </svg>
  </div>
</body>
</html>`;

const out = new URL('../apps/web/public/og.png', import.meta.url);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out.pathname.replace(/^\/([A-Za-z]:)/, '$1'), type: 'png' });
await browser.close();
console.log('wrote apps/web/public/og.png');
