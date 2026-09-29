import { ImageResponse } from 'next/og';

export function generateImageMetadata() {
  return [32, 192, 512].map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: 'image/png',
  }));
}

/** App icon: three rising tallies, the last in the "live" green. Drawn, not loaded. */
export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  const u = size / 32;
  const bar = (left: number, top: number, color: string) => (
    <div
      style={{
        position: 'absolute',
        left: left * u,
        top: top * u,
        width: 4 * u,
        height: (25 - top) * u,
        borderRadius: 1.5 * u,
        background: color,
      }}
    />
  );
  return new ImageResponse(
    <div style={{ width: size, height: size, background: '#0f1519', display: 'flex', position: 'relative' }}>
      {bar(8, 17, '#b6c2bf')}
      {bar(14, 12, '#b6c2bf')}
      {bar(20, 7, '#34c38f')}
    </div>,
    { width: size, height: size },
  );
}
