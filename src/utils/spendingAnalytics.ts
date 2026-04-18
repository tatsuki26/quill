import { endOfMonth, format, getDate } from 'date-fns'
import { Transaction } from '../types'
import { parseDate, transactionMatchesDateFilter } from './dateUtils'

/** 出金のみ（非表示は呼び出し側で除外済み想定） */
export function withdrawalAmount(tx: Transaction): number {
  return tx.withdrawal_amount ?? 0
}

export function transactionInCalendarMonth(tx: Transaction, year: number, month0: number): boolean {
  const d = parseDate(tx.transaction_date)
  return d.getFullYear() === year && d.getMonth() === month0
}

export function filterWithdrawalsInMonth(
  transactions: Transaction[],
  year: number,
  month0: number
): Transaction[] {
  return transactions.filter(
    tx =>
      !tx.is_hidden &&
      tx.withdrawal_amount !== null &&
      tx.withdrawal_amount > 0 &&
      transactionInCalendarMonth(tx, year, month0)
  )
}

export function aggregateCategoryAmounts(transactions: Transaction[]): { category: string; amount: number }[] {
  const map: Record<string, number> = {}
  transactions.forEach(tx => {
    const cat = tx.category || 'その他'
    map[cat] = (map[cat] || 0) + withdrawalAmount(tx)
  })
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/** 月内の各日の出金合計（キー yyyy-MM-dd） */
export function dailyWithdrawalTotals(
  transactions: Transaction[],
  year: number,
  month0: number
): Record<string, number> {
  const out: Record<string, number> = {}
  filterWithdrawalsInMonth(transactions, year, month0).forEach(tx => {
    const d = parseDate(tx.transaction_date)
    const key = format(d, 'yyyy-MM-dd')
    out[key] = (out[key] || 0) + withdrawalAmount(tx)
  })
  return out
}

/** 月を「1〜7日」形式の週に分割し、週ごとのカテゴリ別出金（積み上げ棒用） */
export function weeklyCategoryStacksForMonth(
  transactions: Transaction[],
  year: number,
  month0: number
): { weekLabel: string; [category: string]: number | string }[] {
  const txs = filterWithdrawalsInMonth(transactions, year, month0)
  const lastDay = endOfMonth(new Date(year, month0, 1)).getDate()
  const weeks: { start: number; end: number; label: string }[] = []
  for (let start = 1; start <= lastDay; start += 7) {
    const end = Math.min(start + 6, lastDay)
    weeks.push({ start, end, label: `${start}〜${end}日` })
  }

  const catSet = new Set<string>()
  txs.forEach(tx => catSet.add(tx.category || 'その他'))

  return weeks.map(w => {
    const row: { weekLabel: string; [k: string]: number | string } = { weekLabel: w.label }
    catSet.forEach(c => {
      row[c] = 0
    })
    txs.forEach(tx => {
      const day = getDate(parseDate(tx.transaction_date))
      if (day >= w.start && day <= w.end) {
        const c = tx.category || 'その他'
        row[c] = (row[c] as number) + withdrawalAmount(tx)
      }
    })
    return row
  })
}

export function transactionsOnCalendarDay(
  transactions: Transaction[],
  yyyyMmDd: string
): Transaction[] {
  return transactions.filter(
    tx =>
      !tx.is_hidden &&
      tx.withdrawal_amount !== null &&
      transactionMatchesDateFilter(tx.transaction_date, yyyyMmDd, yyyyMmDd)
  )
}

export function allVisibleTransactionsInMonth(
  transactions: Transaction[],
  year: number,
  month0: number
): Transaction[] {
  return transactions.filter(
    tx => !tx.is_hidden && transactionInCalendarMonth(tx, year, month0)
  )
}
