function esc(val) {
  if (val == null) return ''
  const s = String(val).replace(/"/g, '""')
  if (/[",\n\r]/.test(s)) return `"${s}"`
  return s
}

export function toCSV(rows, columns) {
  if (!rows?.length || !columns?.length) return ''
  const header = columns.map((c) => esc(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => esc(c.value(row))).join(','))
    .join('\r\n')
  return `${header}\r\n${body}`
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}