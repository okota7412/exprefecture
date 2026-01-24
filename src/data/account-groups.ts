// アカウントグループの型定義

export type AccountGroup = {
  id: string
  name: string
  description?: string
  type: 'personal' | 'shared'
  createdBy: string
  memberCount?: number
  createdAt: string
  updatedAt: string
}

export type AccountGroupMember = {
  id: string
  userId: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

export type AccountGroupInvitation = {
  id: string
  accountGroupId: string
  accountGroupName: string
  inviterId: string
  inviterEmail: string
  inviteeId: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  expiresAt?: string
  createdAt: string
  updatedAt: string
}
