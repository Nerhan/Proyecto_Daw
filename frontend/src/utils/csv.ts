const BOM = String.fromCharCode(0xfeff)

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const esc = (s: string) => '"' + s.replace(/"/g, '""') + '"'
  const lines = [headers, ...rows].map((r) => r.map(esc).join(';'))
  const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
