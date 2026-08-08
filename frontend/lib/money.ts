const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

export function formatVnd(value: number | string): string {
  const amount = typeof value === 'number' ? value : Number(value)
  return vndFormatter.format(Number.isFinite(amount) ? amount : 0)
}
