import { format, parse, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale/ja'

export function formatTransactionDate(dateString: string): string {
  try {
    const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date())
    return format(date, 'yyyy年M月d日 H時mm分', { locale: ja })
  } catch {
    return dateString
  }
}

export function formatMonthHeader(dateString: string): string {
  try {
    const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date())
    return format(date, 'yyyy年M月', { locale: ja })
  } catch {
    return dateString
  }
}

export function getMonthRange(dateString: string): { start: string; end: string } {
  try {
    const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date())
    const start = format(startOfMonth(date), 'yyyy/MM/dd')
    const end = format(endOfMonth(date), 'yyyy/MM/dd')
    return { start, end }
  } catch {
    return { start: dateString, end: dateString }
  }
}

export function parseDate(dateString: string): Date {
  try {
    return parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date())
  } catch {
    return new Date()
  }
}
