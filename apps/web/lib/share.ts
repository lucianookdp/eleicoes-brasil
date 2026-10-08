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

/** Square PNG of the result (1080 × 1080), drawn on a canvas with the page's own font. */
export async function shareImage(result: ResultDTO, siteLabel: string): Promise<Blob | null> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  // Two finalists in a runoff, the top three otherwise: room for the lead line and the footer.
  const list = shown(result, result.candidates.filter(hasValidVotes).length === 2 ? 2 : 3);

  ctx.fillStyle = '#0e1013';
  ctx.fillRect(0, 0, size, size);
  const pad = 80;
  ctx.fillStyle = '#28b870';
  ctx.font = `600 34px ${font}`;
  ctx.fillText('Eleições Brasil', pad, 120);
  ctx.fillStyle = '#eceef1';
  ctx.font = `700 64px ${font}`;
  ctx.fillText(title(result), pad, 210, size - pad * 2);
  ctx.fillStyle = '#8a909a';
  ctx.font = `400 34px ${font}`;
  const at = result.provenance?.retrievedAt ?? result.updatedAt;
  ctx.fillText(`${status(result)} · ${formatClock(at).slice(0, 5)}`, pad, 265, size - pad * 2);

  const rowH = list.length <= 2 ? 230 : 165;
  list.forEach((c, i) => {
    const y = 360 + i * rowH;
    ctx.fillStyle = '#eceef1';
    ctx.font = `600 44px ${font}`;
    ctx.fillText(displayName(c.ballotName), pad, y, 640);
    ctx.textAlign = 'right';
    ctx.fillStyle = c.color;
    ctx.font = `700 56px ${font}`;
    ctx.fillText(fmtPct(c.percent), size - pad, y + 6);
    ctx.fillStyle = '#8a909a';
    ctx.font = `400 32px ${font}`;
    ctx.fillText(`${fmtInt(c.votes)} votos`, size - pad, y + 50);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#272b31';
    ctx.fillRect(pad, y + 30, 620, 18);
    ctx.fillStyle = c.color;
    ctx.fillRect(pad, y + 30, (620 * Math.max(0, Math.min(100, c.percent ?? 0))) / 100, 18);
  });

  const [first, second] = list;
  const gap = (first?.votes ?? 0) - (second?.votes ?? 0);
  if (first && second && gap > 0) {
    // "Venceu" only when the TSE says so (elected); a 1st-round leader below 50% has not won.
    const won = result.mathematicallyDecided === 'elected' || /^eleit/i.test(first.status ?? '');
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(pad, 360 + list.length * rowH - 40, size - pad * 2, 110);
    ctx.textAlign = 'center';
    ctx.fillStyle = first.color;
    ctx.font = `700 40px ${font}`;
    ctx.fillText(
      `${displayName(first.ballotName)} ${won ? 'venceu por' : 'à frente por'} ${fmtInt(gap)} votos`,
      size / 2,
      360 + list.length * rowH + 28,
      size - pad * 2 - 40,
    );
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#8a909a';
  ctx.font = `400 30px ${font}`;
  ctx.fillText('Dados oficiais do TSE · acompanhe ao vivo em', pad, size - 110);
  ctx.fillStyle = '#eceef1';
  ctx.font = `600 34px ${font}`;
  ctx.fillText(siteLabel, pad, size - 64, size - pad * 2);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
