import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// The favicon's mark (app/icon.svg) as glyphs: a ▲ in a field of dots.
export default function AppleIcon() {
  const rows = ['·  ·  ·', '   ▲   ', '·  ·  ·']
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: '#e4e4e4', fontFamily: 'monospace', fontSize: 44, lineHeight: 1, whiteSpace: 'pre' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', color: i === 1 ? '#e4e4e4' : '#6a6a6a' }}>
            {r}
          </div>
        ))}
      </div>
    ),
    size,
  )
}
