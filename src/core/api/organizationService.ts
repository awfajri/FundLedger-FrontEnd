import apiClient from './client'
import type { OrganizationDetails, AddMemberPayload, Member } from '../types/organization'
import { INITIAL_MOCK_ORGANIZATION } from './mockData'

let localOrg: OrganizationDetails = { ...INITIAL_MOCK_ORGANIZATION }

export const organizationService = {
  async getOrganizationDetails(): Promise<OrganizationDetails> {
    try {
      const response = await apiClient.get('/organization')
      return response.data.data || response.data
    } catch {
      return localOrg
    }
  },

  async addMember(payload: AddMemberPayload): Promise<{ success: boolean; member?: Member }> {
    try {
      const response = await apiClient.post('/organization/members', payload)
      return { success: true, member: response.data.data || response.data }
    } catch {
      const newMember: Member = {
        id: Date.now(),
        name: payload.name,
        email: payload.email,
        role: payload.role,
        wallet_address: payload.wallet_address || '0x' + Math.random().toString(16).substring(2, 8) + '...f0bE',
        joined_at: new Date().toISOString().slice(0, 10),
      }
      localOrg.members.push(newMember)
      localOrg.members_count = localOrg.members.length
      return { success: true, member: newMember }
    }
  },
}
