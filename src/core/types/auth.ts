export type UserRole = 'maker' | 'checker' | 'viewer'

export interface OrganizationInfo {
  id: number
  name: string
  balance: number
  smart_contract_address?: string
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  organization_id?: number
  organization?: OrganizationInfo
  wallet_address?: string
}

export interface AuthResponse {
  token: string
  user: User
  message?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  organization_name: string
  role: UserRole
}
