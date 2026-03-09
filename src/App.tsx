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
import { ArrowLeft, BarChart3, Upload as UploadIcon, Settings, LogOut, RefreshCw } from 'lucide-react'
import { DefaultHiddenSettings } from './components/DefaultHiddenSettings'
import { RecategorizeButton } from './components/RecategorizeButton'
import { CategoryManagement } from './components/CategoryManagement'
import { AssetManagement } from './components/AssetManagement'
import { ManualEntry } from './components/ManualEntry'
import { SettingsPage } from './components/SettingsPage'
import { TransactionDetail } from './components/TransactionDetail'
import { Dashboard } from './components/Dashboard'

function App() {
  const { user, logout, isAdmin } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<FilterType>({})
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCategoryManagement, setShowCategoryManagement] = useState(false)
  const [showAssetManagement, setShowAssetManagement] = useState(false)
  const [showSettingsPage, setShowSettingsPage] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  // URLパラメータから初期状態を取得
  const [showTransactions, setShowTransactions] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('page') === 'transactions'
  })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      initializeDefaultSettings()
      loadTransactions()
      // カテゴリを事前にロード
      import('./components/TransactionList').then(module => {
        module.loadGlobalCategories()
      })
      
      // URLパラメータから状態を復元
      const params = new URLSearchParams(window.location.search)
      if (params.get('page') === 'transactions') {
        setShowTransactions(true)
      }
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
        { setting_type: 'payment_method', value: 'PayPayポイント' },
        { setting_type: 'transaction_type', value: 'ポイント、残高の獲得' },
        { setting_type: 'payment_method', value: '銀行' },
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

  const handleUpdateMemo = async (id: string, memo: string | null) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ memo, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      // ローカル状態を更新
      setTransactions(prev =>
        prev.map(tx => (tx.id === id ? { ...tx, memo } : tx))
      )
      setFilteredTransactions(prev =>
        prev.map(tx => (tx.id === id ? { ...tx, memo } : tx))
      )
    } catch (error) {
      console.error('Error updating memo:', error)
      throw error
    }
  }

  const handleUpdateCategory = async (id: string, merchant: string, category: string) => {
    try {
      // 取引データのカテゴリを更新
      const { error: txError } = await supabase
        .from('transactions')
        .update({ category, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (txError) throw txError

      // カテゴリマッピングを更新（手動編集としてマーク）
      const { error: mappingError } = await supabase
        .from('category_mappings')
        .upsert({
          merchant_name: merchant,
          category,
          is_manual: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'merchant_name',
        })

      if (mappingError) throw mappingError

      // ローカル状態を更新
      setTransactions(prev =>
        prev.map(tx => (tx.id === id ? { ...tx, category } : tx))
      )
      setFilteredTransactions(prev =>
        prev.map(tx => (tx.id === id ? { ...tx, category } : tx))
      )
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

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

      // デバッグ: 取得件数と手動入力の有無を確認
      const manualEntries = (data || []).filter(tx => tx.payment_method === '手動入力')
      console.log('[loadTransactions] 1回目取得件数:', (data || []).length, '手動入力:', manualEntries.length, manualEntries)

      // 既存データの非表示フラグを更新（必要に応じて）
      // 手動入力はユーザーが明示的に追加した取引のため、自動非表示の対象外とする
      const transactionsToUpdate = (data || []).filter(tx => {
        if (tx.payment_method === '手動入力') return false
        const shouldBeHidden = hiddenPaymentMethods.has(tx.payment_method) ||
                               hiddenTransactionTypes.has(tx.transaction_type) ||
                               // 銀行からのチャージを非表示
                               (tx.transaction_type === 'チャージ' && tx.payment_method.includes('銀行'))
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

      // 最新のデータを再取得（非表示データは除外）
      const { data: updatedData, error: updateError } = await supabase
        .from('transactions')
        .select('*')
        .eq('is_hidden', false)
        .order('transaction_date', { ascending: false })

      if (updateError) throw updateError

      // デバッグ: 表示用データの取得結果を確認
      const manualInDisplay = (updatedData || []).filter(tx => tx.payment_method === '手動入力')
      console.log('[loadTransactions] 表示用取得件数:', (updatedData || []).length, '手動入力:', manualInDisplay.length, updatedData?.slice(0, 3))

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

    // 非表示データは全員（管理者含む）に表示しない
    filtered = filtered.filter(tx => !tx.is_hidden)

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
        backgroundColor: '#00a000',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #008000',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          {(showTransactions || showReport || showUpload) && (
            <button
              onClick={() => {
                setShowReport(false)
                setShowUpload(false)
                setShowTransactions(false)
                // URLパラメータを更新
                if (showTransactions) {
                  window.history.replaceState({}, '', window.location.pathname)
                }
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
          )}
          {/* ロゴを戻るボタンの右に表示 */}
          <img
            src="/logo-quill.png"
            alt="Quill"
            onClick={() => {
              setShowReport(false)
              setShowUpload(false)
              setShowSettingsPage(false)
              setShowCategoryManagement(false)
              setShowAssetManagement(false)
              setShowSettings(false)
              setShowManualEntry(false)
              setSelectedTransaction(null)
              setShowTransactions(false)
            }}
            style={{
              maxHeight: '36px',
              height: 'auto',
              width: 'auto',
              maxWidth: '150px',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
            onError={(e) => {
              console.error('ロゴの読み込みに失敗しました:', e)
              // フォールバック: 通常のロゴを試す
              if (e.currentTarget.src.endsWith('logo-quill.png')) {
                e.currentTarget.src = '/logo.png'
              } else {
                e.currentTarget.style.display = 'none'
              }
            }}
          />
        </div>
        
        {/* 中央のスペース（空） */}
        <div style={{ flex: 1 }}></div>

        {/* 右側のボタン */}
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
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
            <button
              onClick={() => setShowUpload(!showUpload)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="CSVアップロード"
            >
              <UploadIcon size={24} />
            </button>
          )}
          <button
            onClick={() => {
              setShowSettingsPage(true)
              setShowCategoryManagement(false)
              setShowAssetManagement(false)
              setShowSettings(false)
            }}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
            title="設定"
          >
            <Settings size={24} />
          </button>
          <button
            onClick={loadTransactions}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              marginRight: '0.5rem',
            }}
            title="画面を更新"
          >
            <RefreshCw size={24} />
          </button>
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
          {/* PayPayアプリへのリンク */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '13px', color: '#666' }}>CSVのダウンロードはこちら：</span>
            <a
              href="paypay://"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.9rem',
                backgroundColor: '#ff0033',
                color: 'white',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              PayPayアプリを開く
            </a>
            <a
              href="https://www.paypay.ne.jp/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: '#888',
                textDecoration: 'underline',
              }}
            >
              ウェブ版
            </a>
          </div>
        </div>
      )}

      {!showUpload && !showReport && !showTransactions && isAdmin && (
        <div style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0' }}>
          <RecategorizeButton onComplete={loadTransactions} />
        </div>
      )}

      {showReport ? (
        <UsageReport transactions={filteredTransactions} />
      ) : (showTransactions || new URLSearchParams(window.location.search).get('page') === 'transactions') ? (
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
              onUpdateMemo={handleUpdateMemo}
              onUpdateCategory={handleUpdateCategory}
              onShowDetail={setSelectedTransaction}
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
      ) : (
        <Dashboard
          transactions={transactions}
          onNavigateToTransactions={() => {
            setShowTransactions(true)
            // URLパラメータを更新
            window.history.pushState({}, '', '?page=transactions')
          }}
        />
      )}

      {showCategoryManagement && isAdmin && (
        <CategoryManagement
          onClose={() => {
            setShowCategoryManagement(false)
            loadTransactions()
          }}
        />
      )}

      {showAssetManagement && isAdmin && (
        <AssetManagement
          onClose={() => {
            setShowAssetManagement(false)
            loadTransactions()
          }}
        />
      )}

      {showSettingsPage && (
        <SettingsPage
          onClose={() => {
            setShowSettingsPage(false)
            loadTransactions()
          }}
        />
      )}

      {showSettings && isAdmin && (
        <DefaultHiddenSettings
          onClose={() => setShowSettings(false)}
          onRecategorizeComplete={loadTransactions}
        />
      )}

      {showManualEntry && (
        <ManualEntry
          onClose={() => setShowManualEntry(false)}
          onSave={loadTransactions}
          onSaveSuccess={(tx) => setSelectedTransaction(tx)}
        />
      )}

      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onDeleteSuccess={loadTransactions}
        />
      )}

      {/* FABボタン（右下） */}
      {!showUpload && !showReport && !showSettings && !showCategoryManagement && !showAssetManagement && !showSettingsPage && !showManualEntry && !selectedTransaction && showTransactions && (
        <button
          onClick={() => setShowManualEntry(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 0,
          }}
          title="明細を追加"
        >
          <img
            src="/logo.png"
            alt="明細を追加"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain',
            }}
            onError={(e) => {
              console.error('ロゴの読み込みに失敗しました:', e)
              // フォールバック: プラスアイコンを表示
              e.currentTarget.style.display = 'none'
              const button = e.currentTarget.parentElement
              if (button) {
                button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
                button.style.backgroundColor = '#00C300'
                button.style.color = 'white'
              }
            }}
          />
        </button>
      )}
    </div>
  )
}

export default App
