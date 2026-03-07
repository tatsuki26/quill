import { useMemo } from 'react'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface UsageReportProps {
  transactions: Transaction[]
  selectedMonth?: string
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#95A5A6']

export function UsageReport({ transactions, selectedMonth }: UsageReportProps) {
  const reportData = useMemo(() => {
    // 出金のみを集計
    const withdrawals = transactions.filter(tx => tx.withdrawal_amount !== null && !tx.is_hidden)

    // カテゴリ別集計
    const categoryTotals: Record<string, number> = {}
    withdrawals.forEach(tx => {
      const category = tx.category || 'その他'
      categoryTotals[category] = (categoryTotals[category] || 0) + (tx.withdrawal_amount || 0)
    })

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 月別集計
    const monthlyTotals: Record<string, number> = {}
    withdrawals.forEach(tx => {
      const month = tx.transaction_date.substring(0, 7) // YYYY-MM
      monthlyTotals[month] = (monthlyTotals[month] || 0) + (tx.withdrawal_amount || 0)
    })

    const monthlyData = Object.entries(monthlyTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // 取引先ランキング
    const merchantTotals: Record<string, number> = {}
    withdrawals.forEach(tx => {
      merchantTotals[tx.merchant] = (merchantTotals[tx.merchant] || 0) + (tx.withdrawal_amount || 0)
    })

    const merchantRanking = Object.entries(merchantTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const totalAmount = withdrawals.reduce((sum, tx) => sum + (tx.withdrawal_amount || 0), 0)

    return {
      categoryData,
      monthlyData,
      merchantRanking,
      totalAmount,
    }
  }, [transactions])

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#00C300',
          borderRadius: '8px',
          color: 'white',
        }}>
          <span style={{ fontWeight: 'bold' }}>出金</span>
          <span style={{ fontWeight: 'bold' }}>合計 {formatCurrency(reportData.totalAmount)}</span>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          {reportData.categoryData.map((item, index) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span>{item.name}</span>
              </div>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>

        <div style={{ height: '200px', marginBottom: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#FF6B6B',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 'bold',
          marginBottom: '1rem',
        }}>
          支払ったお店ランキング
        </div>

        {reportData.merchantRanking.map((item, index) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#666',
              minWidth: '24px',
            }}>
              {index + 1}.
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {item.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
            </div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.value)}</div>
          </div>
        ))}

        <div style={{
          fontSize: '12px',
          color: '#999',
          marginTop: '1rem',
          fontStyle: 'italic',
        }}>
          ※PayPayカードでの支払いを除く
        </div>
      </div>

      {reportData.monthlyData.length > 0 && (
        <div style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#4ECDC4',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}>
            月別推移
          </div>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#00C300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
