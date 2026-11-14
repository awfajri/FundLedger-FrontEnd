export type ReportPeriod = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom'

export interface ReportFilter {
  period: ReportPeriod
  startDate?: string
  endDate?: string
}

export interface CategoryBreakdown {
  category: string
  total: number
  count: number
  percentage: number
}

export interface FinancialReportData {
  periodLabel: string
  startDate: string
  endDate: string
  openingBalance: number
  totalIncome: number
  totalExpense: number
  netCashflow: number
  closingBalance: number
  incomeCategories: CategoryBreakdown[]
  expenseCategories: CategoryBreakdown[]
  transactionsCount: number
}
