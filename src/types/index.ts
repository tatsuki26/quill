export interface Transaction {
  id: string
  transaction_date: string
  withdrawal_amount: number | null
  deposit_amount: number | null
  foreign_withdrawal_amount: number | null
  currency: string | null
  exchange_rate: number | null
  country: string | null
  transaction_type: string
  merchant: string
  payment_method: string
  payment_category: string | null
  user: string | null
  transaction_number: string
  category: string | null
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export interface CategoryMapping {
  id: string
  merchant_name: string
  category: string
  created_at: string
  updated_at: string
}

export interface DefaultHiddenSetting {
  id: string
  setting_type: 'payment_method' | 'transaction_type'
  value: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  username: string
  role: 'admin' | 'viewer'
  created_at: string
}

export type FilterType = {
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  paymentMethod?: string
  transactionType?: string
  category?: string
  searchText?: string
}
