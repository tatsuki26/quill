import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { TransactionList } from './components/TransactionList'
import { FilterBar } from './components/FilterBar'
import { FilterPanel } from './components/FilterPanel'
import { CSVUpload } from './components/CSVUpload'
import { UsageReport } from './components/UsageReport'
import { supabase } from './lib/supabase'
import { Transaction, FilterType } from './types'
import { ArrowLeft, BarChart3, Upload as UploadIcon, Settings, LogOut } from 'lucide-react'
import { DefaultHiddenSettings } from './components/DefaultHiddenSettings'

function App() {
  const { user, logout, isAdmin } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<FilterType>({})
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      initializeDefaultSettings()
      loadTransactions()
    }
  }, [user])

  const initializeDefaultSettings = async () => {
    try {
      // 既存の設定を確認
      const { data: existingSettings } = await supabase
        .from('default_hidden_settings')
        .select('setting_type, value')

      const existingSet = new Set(
        existingSettings?.map(s => `${s.setting_type}:${s.value}`) || []
      )

      // デフォルト設定を追加（存在しない場合のみ）
      const defaultSettings = [
        { setting_type: 'payment_method', value: 'PayPay残高' },
        { setting_type: 'transaction_type', value: 'ポイント、残高の獲得' },
      ]

      const settingsToInsert = defaultSettings.filter(
        setting => !existingSet.has(`${setting.setting_type}:${setting.value}`)
      )

      if (settingsToInsert.length > 0) {
        await supabase.from('default_hidden_settings').insert(settingsToInsert)
      }
    } catch (error) {
      console.error('Error initializing default settings:', error)
      // エラーが発生してもアプリは続行
    }
  }

  useEffect(() => {
    applyFilters()
  }, [transactions, filters])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      
      // デフォルト非表示設定を取得
      const { data: hiddenSettings } = await supabase
        .from('default_hidden_settings')
        .select('setting_type, value')

      const hiddenPaymentMethods = new Set(
        hiddenSettings?.filter(s => s.setting_type === 'payment_method').map(s => s.value) || []
      )
      const hiddenTransactionTypes = new Set(
        hiddenSettings?.filter(s => s.setting_type === 'transaction_type').map(s => s.value) || []
      )

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })

      if (error) throw error

      // 既存データの非表示フラグを更新（必要に応じて）
      const transactionsToUpdate = (data || []).filter(tx => {
        const shouldBeHidden = hiddenPaymentMethods.has(tx.payment_method) ||
                               hiddenTransactionTypes.has(tx.transaction_type)
        return shouldBeHidden && !tx.is_hidden
      })

      if (transactionsToUpdate.length > 0) {
        // バッチで更新
        const updatePromises = transactionsToUpdate.map(tx =>
          supabase
            .from('transactions')
            .update({ is_hidden: true })
            .eq('id', tx.id)
        )
        await Promise.all(updatePromises)
      }

      // 最新のデータを再取得
      const { data: updatedData, error: updateError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })

      if (updateError) throw updateError
      setTransactions(updatedData || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // デフォルト非表示設定を適用
    if (!isAdmin) {
      // 閲覧者は非表示設定を適用
      filtered = filtered.filter(tx => !tx.is_hidden)
    }

    // フィルター適用
    if (filters.dateFrom) {
      filtered = filtered.filter(tx => tx.transaction_date >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(tx => tx.transaction_date <= filters.dateTo!)
    }
    if (filters.amountMin !== undefined) {
      filtered = filtered.filter(tx =>
        (tx.withdrawal_amount && tx.withdrawal_amount >= filters.amountMin!) ||
        (tx.deposit_amount && tx.deposit_amount >= filters.amountMin!)
      )
    }
    if (filters.amountMax !== undefined) {
      filtered = filtered.filter(tx =>
        (tx.withdrawal_amount && tx.withdrawal_amount <= filters.amountMax!) ||
        (tx.deposit_amount && tx.deposit_amount <= filters.amountMax!)
      )
    }
    if (filters.paymentMethod) {
      filtered = filtered.filter(tx => tx.payment_method.includes(filters.paymentMethod!))
    }
    if (filters.transactionType) {
      filtered = filtered.filter(tx => tx.transaction_type === filters.transactionType)
    }
    if (filters.category) {
      filtered = filtered.filter(tx => tx.category === filters.category)
    }
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(tx =>
        tx.merchant.toLowerCase().includes(searchLower) ||
        tx.transaction_type.toLowerCase().includes(searchLower)
      )
    }

    setFilteredTransactions(filtered)
  }

  const handleToggleHide = async (id: string, isHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_hidden: isHidden })
        .eq('id', id)

      if (error) throw error

      setTransactions(prev =>
        prev.map(tx => (tx.id === id ? { ...tx, is_hidden: isHidden } : tx))
      )
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('非表示設定の更新に失敗しました')
    }
  }

  const paymentMethods = Array.from(new Set(transactions.map(tx => tx.payment_method)))
  const transactionTypes = Array.from(new Set(transactions.map(tx => tx.transaction_type)))
  const categories = Array.from(
    new Set(transactions.map(tx => tx.category).filter(Boolean) as string[])
  )

  if (!user) {
    return <Login />
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#00C300',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => {
              setShowReport(false)
              setShowUpload(false)
            }}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>取引履歴</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowReport(!showReport)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <BarChart3 size={24} />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setShowUpload(!showUpload)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <UploadIcon size={24} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <Settings size={24} />
              </button>
            </>
          )}
          <button
            onClick={logout}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {showUpload && isAdmin && (
        <div style={{ padding: '1rem' }}>
          <CSVUpload onUploadComplete={loadTransactions} />
        </div>
      )}

      {showReport ? (
        <UsageReport transactions={filteredTransactions} />
      ) : (
        <>
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            onToggleFilterPanel={() => setShowFilterPanel(true)}
          />

          {loading ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
            }}>
              読み込み中...
            </div>
          ) : (
            <TransactionList
              transactions={filteredTransactions}
              onToggleHide={isAdmin ? handleToggleHide : undefined}
              isAdmin={isAdmin}
            />
          )}

          {showFilterPanel && (
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              onClose={() => setShowFilterPanel(false)}
              paymentMethods={paymentMethods}
              transactionTypes={transactionTypes}
              categories={categories}
            />
          )}
        </>
      )}

      {showSettings && isAdmin && (
        <DefaultHiddenSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
