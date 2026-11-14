import type { UserRole } from './auth'

export interface Member {
  id: number
  name: string
  email: string
  role: UserRole
  wallet_address?: string
  joined_at: string
}

export interface OrganizationDetails {
  id: number
  name: string
  balance: number
  smart_contract_address: string
  network: string
  members_count: number
  created_at: string
  members: Member[]
}

export interface AddMemberPayload {
  name: string
  email: string
  role: UserRole
  wallet_address?: string
}
