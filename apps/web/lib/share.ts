import type { CandidateDTO, ResultDTO } from '@eleicoes/election-core';
import { formatClock, hasValidVotes } from '@eleicoes/election-core';
import { displayName, fmtInt, fmtPct } from './format';

/** Coloured circle emoji closest to a party colour, so WhatsApp text keeps the visual cue. */
export function colorEmoji(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return '⚪';
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => Number.parseInt(x!, 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.12) return '⚪';
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 330) return '🔴';
  if (h < 40) return '🟠';
  if (h < 70) return '🟡';
  if (h < 170) return '🟢';
  if (h < 260) return '🔵';
  return '🟣';
}

/** Who is shown: the two finalists in a runoff, otherwise the leaders. */
function shown(result: ResultDTO, max: number): CandidateDTO[] {
  return result.candidates.filter(hasValidVotes).slice(0, max);
}

const title = (result: ResultDTO) => `${result.office.name} · ${result.areaName}`;
const status = (result: ResultDTO) =>
  result.final || (result.progress.countedPct ?? 0) >= 100
    ? 'resultado com 100% das urnas'
    : `votos de ${fmtPct(result.progress.countedPct, 1)} das urnas`;

/**
 * WhatsApp-ready text: one line per candidate with a colour dot, the lead in votes, and the link.
 * Plain numbers, like the lists people already forward in groups.
 */
export function shareText(result: ResultDTO, url: string): string {
  const list = shown(result, 4);
  const lines = [`*${title(result)}*`, `${status(result)} · dados oficiais do TSE`, ''];
  for (const c of list) {
    lines.push(
      `${colorEmoji(c.color)} ${displayName(c.ballotName)}: ${fmtInt(c.votes)} (${fmtPct(c.percent)})`,
    );
  }
  const [a, b] = list;
  if (a && b && (a.votes ?? 0) > (b.votes ?? 0)) {
    // "Venceu" only when the TSE marks the winner as elected.
    const won = result.mathematicallyDecided === 'elected' || /^eleit/i.test(a.status ?? '');
    lines.push(
      '',
      `${displayName(a.ballotName)} ${won ? 'venceu por' : 'à frente por'} ${fmtInt((a.votes ?? 0) - (b.votes ?? 0))} votos`,
    );
  }
  lines.push('', `Acompanhe ao vivo: ${url}`);
  return lines.join('\n');
}

/** Rounded rectangle path (canvas `roundRect` where available, plain rectangle otherwise). */
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

const INK = '#111317';
const MUTED = '#6a707a';
const TRACK = '#eceef1';

/**
 * Square PNG of the result (1080 × 1080), light and airy so it reads well in any chat: the flag
 * stripe, the logo, where and what, then one white card with the numbers. Drawn on a canvas with
 * the page's own font.
 */
export async function shareImage(result: ResultDTO, siteLabel: string): Promise<Blob | null> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const valid = result.candidates.filter(hasValidVotes);
  const pair = valid.length === 2;
  const list = shown(result, pair ? 2 : 3);
  const pad = 72;
  const over = result.final || (result.progress.countedPct ?? 0) >= 100;

  // Ground and the flag stripe.
  ctx.fillStyle = '#f5f6f8';
  ctx.fillRect(0, 0, size, size);
  const stripe = ['#12A15F', '#F6C343', '#2563D9'];
  stripe.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect((size / 3) * i, 0, size / 3 + 1, 12);
  });

  // Logo (the three bars) and name; on the right, live or final.
  [
    { x: 0, y: 18, h: 10, c: stripe[0]! },
    { x: 9, y: 11, h: 17, c: stripe[1]! },
    { x: 18, y: 4, h: 24, c: stripe[2]! },
  ].forEach((b) => {
    ctx.fillStyle = b.c;
    rounded(ctx, pad + b.x * 1.6, 76 + b.y * 1.6, 9.6, b.h * 1.6, 4.8);
    ctx.fill();
  });
  ctx.fillStyle = INK;
  ctx.font = `600 34px ${font}`;
  ctx.fillText('Eleições Brasil', pad + 62, 116);
  ctx.textAlign = 'right';
  ctx.font = `600 28px ${font}`;
  const tag = over ? 'Resultado final' : 'Ao vivo';
  const tagW = ctx.measureText(tag).width + 64;
  ctx.fillStyle = over ? 'rgba(12,138,78,.1)' : 'rgba(229,56,59,.1)';
  rounded(ctx, size - pad - tagW, 78, tagW, 52, 26);
  ctx.fill();
  ctx.fillStyle = over ? '#0c8a4e' : '#d93036';
  ctx.beginPath();
  ctx.arc(size - pad - tagW + 30, 104, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(tag, size - pad - 22, 114);
  ctx.textAlign = 'left';

  // What and where.
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${font}`;
  ctx.fillText(result.office.name.toUpperCase(), pad, 222, size - pad * 2);
  ctx.fillStyle = INK;
  ctx.font = `700 72px ${font}`;
  ctx.fillText(result.areaName, pad, 296, size - pad * 2);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${font}`;
  const at = result.provenance?.retrievedAt ?? result.updatedAt;
  ctx.fillText(`${status(result)} · ${formatClock(at).slice(0, 5)}`, pad, 344, size - pad * 2);

  // The card.
  const cardY = 392;
  const cardH = 470;
  ctx.save();
  ctx.shadowColor = 'rgba(17,19,23,.08)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#ffffff';
  rounded(ctx, pad, cardY, size - pad * 2, cardH, 36);
  ctx.fill();
  ctx.restore();
  const inX = pad + 48;
  const inW = size - pad * 2 - 96;

  if (pair && list.length === 2) {
    const [a, b] = list as [CandidateDTO, CandidateDTO];
    [a, b].forEach((c, i) => {
      const right = i === 1;
      const x = right ? inX + inW : inX;
      ctx.textAlign = right ? 'right' : 'left';
      ctx.fillStyle = c.color;
      ctx.beginPath();
      const name = displayName(c.ballotName);
      ctx.font = `600 38px ${font}`;
      const nameW = Math.min(ctx.measureText(name).width, inW / 2 - 40);
      ctx.arc(right ? x - nameW - 22 : x + 9, cardY + 86, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(name, right ? x : x + 30, cardY + 99, inW / 2 - 40);
      ctx.font = `700 100px ${font}`;
      ctx.fillText(fmtPct(c.percent), x, cardY + 226, inW / 2 - 10);
      ctx.fillStyle = MUTED;
      ctx.font = `400 28px ${font}`;
      ctx.fillText(`${fmtInt(c.votes)} votos`, x, cardY + 272);
    });
    ctx.textAlign = 'left';
    const total = (a.votes ?? 0) + (b.votes ?? 0);
    const left = total ? (a.votes ?? 0) / total : 0.5;
    const barY = cardY + 318;
    ctx.save();
    rounded(ctx, inX, barY, inW, 26, 13);
    ctx.clip();
    ctx.fillStyle = b.color;
    ctx.fillRect(inX, barY, inW, 26);
    ctx.fillStyle = a.color;
    ctx.fillRect(inX, barY, inW * left, 26);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(inX + inW / 2 - 1.5, barY - 4, 3, 34);
  } else {
    list.forEach((c, i) => {
      const y = cardY + 92 + i * 100;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(inX + 9, y - 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = `600 38px ${font}`;
      ctx.fillText(displayName(c.ballotName), inX + 32, y, inW - 260);
      ctx.textAlign = 'right';
      ctx.font = `700 52px ${font}`;
      ctx.fillText(fmtPct(c.percent), inX + inW, y + 4);
      ctx.textAlign = 'left';
      ctx.fillStyle = TRACK;
      rounded(ctx, inX, y + 26, inW, 14, 7);
      ctx.fill();
      ctx.fillStyle = c.color;
      rounded(
        ctx,
        inX,
        y + 26,
        Math.max(14, (inW * Math.max(0, Math.min(100, c.percent ?? 0))) / 100),
        14,
        7,
      );
      ctx.fill();
    });
  }

  // The lead, in words, at the bottom of the card.
  const [first, second] = list;
  const gap = (first?.votes ?? 0) - (second?.votes ?? 0);
  if (first && second && gap > 0) {
    // "Venceu" only when the TSE says so (elected); a 1st-round leader below 50% has not won.
    const won = result.mathematicallyDecided === 'elected' || /^eleit/i.test(first.status ?? '');
    ctx.fillStyle = TRACK;
    ctx.fillRect(inX, cardY + cardH - 104, inW, 2);
    ctx.fillStyle = INK;
    ctx.font = `600 32px ${font}`;
    ctx.fillText(
      `${displayName(first.ballotName)} ${won ? 'venceu por' : 'à frente por'} ${fmtInt(gap)} votos`,
      inX,
      cardY + cardH - 46,
      inW,
    );
  }

  // Footer.
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${font}`;
  ctx.fillText('Dados oficiais do TSE', pad, size - 78);
  ctx.textAlign = 'right';
  ctx.fillStyle = INK;
  ctx.font = `600 30px ${font}`;
  ctx.fillText(siteLabel, size - pad, size - 78);
  ctx.textAlign = 'left';
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
