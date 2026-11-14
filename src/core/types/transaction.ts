import type { User } from './auth'

export type TransactionType = 'cash_in' | 'cash_out' | 'reversal'
export type TransactionStatus = 'pending' | 'completed' | 'rejected'

export interface Transaction {
  id: number
  type: TransactionType
  category: string
  amount: number
  description: string
  proof_path?: string
  status: TransactionStatus
  tx_hash?: string
  block_number?: number
  maker_id: number
  maker?: User
  maker_name?: string
  checker_id?: number
  checker?: User
  checker_name?: string
  checker_wallet_address?: string
  rejection_reason?: string
  reversing_hash?: string
  is_reversal?: boolean
  created_at: string
  updated_at: string
}

export interface CreateCashInDTO {
  category: string
  amount: number
  description: string
  proofFile: File
}

export interface CreateCashOutDTO {
  category: string
  amount: number
  description: string
  proofFile: File
}

export interface ReversingEntryDTO {
  original_tx_id: number
  original_tx_hash: string
  reason: string
}

export interface AuditVerificationResult {
  is_valid: boolean
  tx_hash: string
  block_number: number
  on_chain_amount: number
  off_chain_amount: number
  on_chain_category: string
  off_chain_category: string
  maker_name: string
  maker_address: string
  checker_name: string
  checker_address: string
  timestamp: string
  cryptographic_proof: string
  anomaly_detected: boolean
  anomaly_details?: string
}

export interface DashboardMetrics {
  balance: number
  incomeThisMonth: number
  expenseThisMonth: number
  incomeYTD: number
  expenseYTD: number
  totalTransactionsCount: number
  pendingCount: number
}
