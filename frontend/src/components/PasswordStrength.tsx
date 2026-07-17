const LEVELS = [
  { label: 'Muy débil', cls: 'on-1' },
  { label: 'Débil', cls: 'on-1' },
  { label: 'Regular', cls: 'on-2' },
  { label: 'Buena', cls: 'on-3' },
  { label: 'Fuerte', cls: 'on-4' },
]

function score(value: string): number {
  let s = 0
  if (value.length >= 8) s++
  if (value.length >= 12) s++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++
  if (/\d/.test(value)) s++
  if (/[^A-Za-z0-9]/.test(value)) s++
  return Math.min(4, s)
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const level = score(value)
  const info = LEVELS[level]
  return (
    <div className="pw-meter" aria-live="polite">
      <div className="pw-bars">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`pw-bar ${i <= level ? info.cls : ''}`} />
        ))}
      </div>
      <span className="pw-label">Seguridad: {info.label}</span>
    </div>
  )
}
