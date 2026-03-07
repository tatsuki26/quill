import Papa from 'papaparse'
import { Transaction } from '../types'

export interface CSVRow {
  取引日: string
  出金金額（円）: string
  入金金額（円）: string
  海外出金金額: string
  通貨: string
  変換レート（円）: string
  利用国: string
  取引内容: string
  取引先: string
  取引方法: string
  支払い区分: string
  利用者: string
  取引番号: string
}

export function parseCSV(csvText: string): CSVRow[] {
  const result = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
  })

  return result.data
}

export function convertToTransaction(row: CSVRow, index: number): Omit<Transaction, 'id' | 'category' | 'is_hidden' | 'created_at' | 'updated_at'> {
  // 金額の処理（カンマと引用符を除去）
  const withdrawalAmount = row['出金金額（円）'] && row['出金金額（円）'] !== '-'
    ? parseFloat(row['出金金額（円）'].replace(/,/g, '').replace(/"/g, ''))
    : null

  const depositAmount = row['入金金額（円）'] && row['入金金額（円）'] !== '-'
    ? parseFloat(row['入金金額（円）'].replace(/,/g, '').replace(/"/g, ''))
    : null

  const foreignWithdrawalAmount = row['海外出金金額'] && row['海外出金金額'] !== '-'
    ? parseFloat(row['海外出金金額'])
    : null

  const exchangeRate = row['変換レート（円）'] && row['変換レート（円）'] !== '-'
    ? parseFloat(row['変換レート（円）'])
    : null

  return {
    transaction_date: row['取引日'],
    withdrawal_amount: withdrawalAmount,
    deposit_amount: depositAmount,
    foreign_withdrawal_amount: foreignWithdrawalAmount,
    currency: row['通貨'] !== '-' ? row['通貨'] : null,
    exchange_rate: exchangeRate,
    country: row['利用国'] !== '-' ? row['利用国'] : null,
    transaction_type: row['取引内容'],
    merchant: row['取引先'],
    payment_method: row['取引方法'],
    payment_category: row['支払い区分'] !== '-' ? row['支払い区分'] : null,
    user: row['利用者'] !== '-' ? row['利用者'] : null,
    transaction_number: row['取引番号'],
  }
}
