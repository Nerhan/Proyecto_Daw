import type { CSSProperties } from 'react'

export function SkeletonBlock({ w, h = 14, style }: { w?: number | string; h?: number; style?: CSSProperties }) {
  return <span className="skl" style={{ display: 'block', width: w ?? '100%', height: h, ...style }} />
}

export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="card table-wrap" aria-hidden="true">
      <table className="data">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i}>
                <SkeletonBlock w={70 + ((i * 37) % 50)} h={10} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}>
                  <SkeletonBlock w={`${45 + (((r + c) * 23) % 45)}%`} h={13} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid stat-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card stat">
          <SkeletonBlock w={90} h={10} />
          <SkeletonBlock w={70} h={34} style={{ marginTop: 12 }} />
          <SkeletonBlock w={110} h={9} style={{ marginTop: 12 }} />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="card chart-card" aria-hidden="true">
      <SkeletonBlock w={140} h={14} />
      <SkeletonBlock w={200} h={10} style={{ marginTop: 8 }} />
      <SkeletonBlock h={height - 60} style={{ marginTop: 16, borderRadius: 12 }} />
    </div>
  )
}
