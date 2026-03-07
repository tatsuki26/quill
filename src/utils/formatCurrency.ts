export function formatCurrency(amount: number | null): string {
  if (amount === null) return '-'
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

export function formatAmount(amount: number | null): string {
  if (amount === null) return '-'
  return new Intl.NumberFormat('ja-JP').format(amount)
}
