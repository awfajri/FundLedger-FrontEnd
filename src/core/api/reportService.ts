import apiClient from './client'
import { transactionService } from './transactionService'
import type { FinancialReportData, ReportFilter, CategoryBreakdown } from '../types/report'

export const reportService = {
  async getReportData(filter: ReportFilter): Promise<FinancialReportData> {
    try {
      // 1. Cek jika backend memiliki endpoint khusus /reports
      const response = await apiClient.get('/reports', { params: filter })
      const d = response.data.data || response.data
      return {
        periodLabel: d.period_label || d.periodLabel || 'Periode Berjalan',
        startDate: d.start_date || d.startDate || new Date().toISOString().slice(0, 10),
        endDate: d.end_date || d.endDate || new Date().toISOString().slice(0, 10),
        openingBalance: Number(d.opening_balance ?? d.openingBalance ?? 0),
        totalIncome: Number(d.total_income ?? d.totalIncome ?? 0),
        totalExpense: Number(d.total_expense ?? d.totalExpense ?? 0),
        netCashflow: Number(d.net_cashflow ?? d.netCashflow ?? 0),
        closingBalance: Number(d.closing_balance ?? d.closingBalance ?? 0),
        incomeCategories: d.income_categories || d.incomeCategories || [],
        expenseCategories: d.expense_categories || d.expenseCategories || [],
        transactionsCount: Number(d.transactions_count ?? d.transactionsCount ?? 0),
      }
    } catch {
      // 2. Hitung dinamis dari transaksi riil di database backend dan saldo kas terkini
      const [allTx, metrics] = await Promise.all([
        transactionService.getTransactions({ status: 'completed' }),
        transactionService.getMetrics(),
      ])

      const currentBalance = metrics.balance
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      let startDateStr = `${currentYear}-01-01`
      let endDateStr = new Date().toISOString().slice(0, 10)
      let periodLabel = 'Semua Periode'

      // Filter tanggal
      const filteredTx = allTx.filter((t) => {
        const txDate = new Date(t.created_at)
        if (filter.period === 'this_month') {
          periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          startDateStr = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10)
          endDateStr = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10)
          return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth
        } else if (filter.period === 'last_month') {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
          periodLabel = new Date(prevYear, prevMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          startDateStr = new Date(prevYear, prevMonth, 1).toISOString().slice(0, 10)
          endDateStr = new Date(prevYear, prevMonth + 1, 0).toISOString().slice(0, 10)
          return txDate.getFullYear() === prevYear && txDate.getMonth() === prevMonth
        } else if (filter.period === 'this_quarter') {
          const quarter = Math.floor(currentMonth / 3) + 1
          periodLabel = `Kuartal ${quarter} Tahun ${currentYear}`
          startDateStr = new Date(currentYear, (quarter - 1) * 3, 1).toISOString().slice(0, 10)
          endDateStr = new Date(currentYear, quarter * 3, 0).toISOString().slice(0, 10)
          return txDate >= new Date(startDateStr) && txDate <= new Date(endDateStr)
        } else if (filter.period === 'this_year') {
          periodLabel = `Tahun Anggaran ${currentYear}`
          startDateStr = `${currentYear}-01-01`
          endDateStr = `${currentYear}-12-31`
          return txDate.getFullYear() === currentYear
        } else if (filter.period === 'custom' && filter.startDate && filter.endDate) {
          periodLabel = `Kustom (${filter.startDate} s/d ${filter.endDate})`
          startDateStr = filter.startDate
          endDateStr = filter.endDate
          return txDate >= new Date(filter.startDate) && txDate <= new Date(filter.endDate + 'T23:59:59')
        }
        return true
      })

      // Hitung Total Pemasukan & Pengeluaran dari transaksi nyata
      let totalIncome = 0
      let totalExpense = 0
      const incomeMap: Record<string, { total: number; count: number }> = {}
      const expenseMap: Record<string, { total: number; count: number }> = {}

      for (const tx of filteredTx) {
        const amount = Number(tx.amount) || 0
        if (tx.type === 'cash_in') {
          totalIncome += amount
          const existing = incomeMap[tx.category] || { total: 0, count: 0 }
          existing.total += amount
          existing.count += 1
          incomeMap[tx.category] = existing
        } else if (tx.type === 'cash_out') {
          totalExpense += amount
          const existing = expenseMap[tx.category] || { total: 0, count: 0 }
          existing.total += amount
          existing.count += 1
          expenseMap[tx.category] = existing
        }
      }

      const netCashflow = totalIncome - totalExpense
      const closingBalance = currentBalance
      const openingBalance = Math.max(0, closingBalance - netCashflow)

      const incomeCategories: CategoryBreakdown[] = Object.entries(incomeMap).map(([category, val]) => ({
        category,
        total: val.total,
        count: val.count,
        percentage: totalIncome > 0 ? Math.round((val.total / totalIncome) * 1000) / 10 : 0,
      }))

      const expenseCategories: CategoryBreakdown[] = Object.entries(expenseMap).map(([category, val]) => ({
        category,
        total: val.total,
        count: val.count,
        percentage: totalExpense > 0 ? Math.round((val.total / totalExpense) * 1000) / 10 : 0,
      }))

      return {
        periodLabel,
        startDate: startDateStr,
        endDate: endDateStr,
        openingBalance,
        totalIncome,
        totalExpense,
        netCashflow,
        closingBalance,
        incomeCategories,
        expenseCategories,
        transactionsCount: filteredTx.length,
      }
    }
  },
}
