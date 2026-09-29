import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const u = 180 / 32;
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
    <div style={{ width: 180, height: 180, background: '#0f1519', display: 'flex', position: 'relative' }}>
      {bar(8, 17, '#b6c2bf')}
      {bar(14, 12, '#b6c2bf')}
      {bar(20, 7, '#34c38f')}
    </div>,
    size,
  );
}
