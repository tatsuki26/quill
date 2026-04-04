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

/**
 * DB保存用: 日付文字列と時刻から `yyyy/MM/dd HH:mm:ss` を組み立てる
 */
export function formatDateTimeForDb(dateStr: string, timeStr: string): string {
  const dateMatch = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (!dateMatch) return dateStr
  const [, year, month, day] = dateMatch
  const normalizedDate = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
  const h = timeMatch ? timeMatch[1].padStart(2, '0') : '12'
  const m = timeMatch ? timeMatch[2].padStart(2, '0') : '00'
  const s = timeMatch?.[3]?.padStart(2, '0') ?? '00'
  return `${normalizedDate} ${h}:${m}:${s}`
}

/**
 * 取引日時文字列を日付・時刻入力用に分解する
 */
export function splitTransactionDateForInput(dateString: string): { date: string; time: string } {
  const withTime = dateString.match(
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
  )
  if (withTime) {
    const [, y, mo, d, h, mi, s] = withTime
    const date = `${y}/${mo.padStart(2, '0')}/${d.padStart(2, '0')}`
    const time = `${h.padStart(2, '0')}:${mi.padStart(2, '0')}:${(s ?? '00').padStart(2, '0')}`
    return { date, time }
  }
  const dateOnly = dateString.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (dateOnly) {
    const [, y, mo, d] = dateOnly
    return {
      date: `${y}/${mo.padStart(2, '0')}/${d.padStart(2, '0')}`,
      time: '12:00:00',
    }
  }
  const today = new Date()
  const y = today.getFullYear()
  const mo = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return { date: `${y}/${mo}/${d}`, time: '12:00:00' }
}
