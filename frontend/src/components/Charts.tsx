export interface DonutSlice {
  label: string
  value: number
  color: string
}

export function Donut({ data, centerLabel }: { data: DonutSlice[]; centerLabel: string }) {
  const size = 170
  const thickness = 20
  const r = (size - thickness) / 2
  const C = 2 * Math.PI * r
  const total = data.reduce((a, d) => a + d.value, 0)
  let acc = 0

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total > 0 &&
            data
              .filter((d) => d.value > 0)
              .map((d) => {
                const frac = d.value / total
                const seg = (
                  <circle
                    key={d.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={thickness}
                    strokeDasharray={`${frac * C} ${C - frac * C}`}
                    strokeDashoffset={-acc * C}
                  >
                    <title>{`${d.label}: ${d.value}`}</title>
                  </circle>
                )
                acc += frac
                return seg
              })}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          fill="var(--text)"
          fontSize="26"
          fontWeight="700"
          fontFamily="var(--font-mono)"
        >
          {total}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="var(--font-mono)">
          {centerLabel.toUpperCase()}
        </text>
      </svg>
      <div className="legend">
        {data.map((d) => (
          <div className="legend-item" key={d.label}>
            <span className="legend-dot" style={{ background: d.color }} />
            <span>{d.label}</span>
            <b>{d.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HBars({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return <div className="chart-empty">Sin datos todavía</div>
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      {data.map((d, i) => (
        <div className="hbar-row" key={`${d.label}-${i}`}>
          <span className="hbar-label" title={d.label}>
            {d.label}
          </span>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{ width: `${(d.value / max) * 100}%`, animationDelay: `${i * 60}ms` }}
            />
          </div>
          <span className="hbar-val">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

export interface TrendSeries {
  name: string
  color: string
  values: number[]
}

export function TrendChart({ labels, series }: { labels: string[]; series: TrendSeries[] }) {
  const W = 600
  const H = 180
  const P = 14
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const n = labels.length
  const x = (i: number) => (n <= 1 ? W / 2 : P + (i * (W - 2 * P)) / (n - 1))
  const y = (v: number) => H - P - (v / max) * (H - 2 * P)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Actividad mensual">
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={P}
            x2={W - P}
            y1={H - P - t * (H - 2 * P)}
            y2={H - P - t * (H - 2 * P)}
            stroke="var(--border)"
            strokeDasharray="4 7"
          />
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
          return (
            <g key={s.name}>
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={s.color}>
                  <title>{`${s.name} · ${labels[i]}: ${v}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="trend-labels">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="legend legend-row">
        {series.map((s) => (
          <div className="legend-item legend-inline" key={s.name}>
            <span className="legend-dot" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  )
}
