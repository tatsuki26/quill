import { format, parse, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale/ja'

const DATE_FORMATS = ['yyyy/MM/dd HH:mm:ss', 'yyyy/MM/dd', 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd'] as const

function parseTransactionDate(dateString: string): Date | null {
  for (const fmt of DATE_FORMATS) {
    try {
      return parse(dateString, fmt, new Date())
    } catch {
      continue
    }
  }
  return null
}

export function formatTransactionDate(dateString: string): string {
  const date = parseTransactionDate(dateString)
  if (!date) return dateString
  try {
    return format(date, 'yyyy年M月d日 H時mm分', { locale: ja })
  } catch {
    return dateString
  }
}

/**
 * 年月を抽出して一貫した「yyyy年M月」形式で返す
 * 日付フォーマットが異なる取引でも同じ月は同じキーになる
 */
export function formatMonthHeader(dateString: string): string {
  // YYYY/MM/DD または YYYY-MM-DD 形式から年月を抽出（時刻あり/なし両対応）
  const match = dateString.match(/^(\d{4})[\/\-](\d{1,2})/)
  if (match) {
    const year = match[1]
    const month = parseInt(match[2], 10)
    return `${year}年${month}月`
  }
  const date = parseTransactionDate(dateString)
  if (!date) return dateString
  try {
    return format(date, 'yyyy年M月', { locale: ja })
  } catch {
    return dateString
  }
}

export function getMonthRange(dateString: string): { start: string; end: string } {
  const date = parseTransactionDate(dateString)
  if (!date) return { start: dateString, end: dateString }
  try {
    const start = format(startOfMonth(date), 'yyyy/MM/dd')
    const end = format(endOfMonth(date), 'yyyy/MM/dd')
    return { start, end }
  } catch {
    return { start: dateString, end: dateString }
  }
}

export function parseDate(dateString: string): Date {
  const date = parseTransactionDate(dateString)
  return date ?? new Date()
}
