/**
 * アカウントグループリポジトリ（データアクセス層）
 */
import type {
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
} from '../dto/account-group.dto.js'
import prisma from '../utils/prisma.js'

export interface AccountGroup {
  id: string
  name: string
  description: string | null
  type: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface AccountGroupMember {
  id: string
  accountGroupId: string
  userId: string
  role: string
  joinedAt: Date
}

export interface AccountGroupInvitation {
  id: string
  accountGroupId: string
  inviterId: string
  inviteeId: string
  status: string
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IAccountGroupRepository {
  create(
    data: CreateAccountGroupDto & { createdBy: string; type?: string }
  ): Promise<AccountGroup>
  findById(id: string): Promise<AccountGroup | null>
  findByUserId(userId: string): Promise<AccountGroup[]>
  findByMemberId(userId: string): Promise<AccountGroup[]>
  update(id: string, data: UpdateAccountGroupDto): Promise<AccountGroup>
  delete(id: string): Promise<void>
  countMembers(accountGroupId: string): Promise<number>
  findPersonalGroupByUserId(userId: string): Promise<AccountGroup | null>
  // メンバー関連
  addMember(
    accountGroupId: string,
    userId: string,
    role?: string
  ): Promise<AccountGroupMember>
  removeMember(accountGroupId: string, userId: string): Promise<void>
  findMember(
    accountGroupId: string,
    userId: string
  ): Promise<AccountGroupMember | null>
  findMembersByAccountGroupId(
    accountGroupId: string
  ): Promise<
    Array<AccountGroupMember & { user: { id: string; email: string } }>
  >
  // 招待関連
  createInvitation(
    accountGroupId: string,
    inviterId: string,
    inviteeId: string,
    expiresAt?: Date
  ): Promise<AccountGroupInvitation>
  findInvitationById(id: string): Promise<AccountGroupInvitation | null>
  findInvitationsByInviteeId(
    inviteeId: string,
    status?: string
  ): Promise<
    Array<
      AccountGroupInvitation & {
        accountGroup: AccountGroup
        inviter: { id: string; email: string }
      }
    >
  >
  findInvitationsByAccountGroupId(
    accountGroupId: string
  ): Promise<AccountGroupInvitation[]>
  updateInvitationStatus(
    id: string,
    status: string
  ): Promise<AccountGroupInvitation>
}

export class AccountGroupRepository implements IAccountGroupRepository {
  async create(
    data: CreateAccountGroupDto & { createdBy: string; type?: string }
  ): Promise<AccountGroup> {
    const accountGroup = await prisma.accountGroup.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type || 'shared',
        createdBy: data.createdBy,
      },
    })

    return accountGroup
  }

  async findById(id: string): Promise<AccountGroup | null> {
    const accountGroup = await prisma.accountGroup.findUnique({
      where: { id },
    })

    return accountGroup
  }

  async findByUserId(userId: string): Promise<AccountGroup[]> {
    // 作成したグループ
    const createdGroups = await prisma.accountGroup.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    })

    return createdGroups
  }

  async findByMemberId(userId: string): Promise<AccountGroup[]> {
    // メンバーとして参加しているグループ
    const memberships = await prisma.accountGroupMember.findMany({
      where: { userId },
      include: { accountGroup: true },
      orderBy: { joinedAt: 'desc' },
    })

    return memberships.map(m => m.accountGroup)
  }

  async update(id: string, data: UpdateAccountGroupDto): Promise<AccountGroup> {
    const accountGroup = await prisma.accountGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
    })

    return accountGroup
  }

  async delete(id: string): Promise<void> {
    await prisma.accountGroup.delete({
      where: { id },
    })
  }

  async countMembers(accountGroupId: string): Promise<number> {
    const count = await prisma.accountGroupMember.count({
      where: { accountGroupId },
    })

    return count
  }

  async findPersonalGroupByUserId(
    userId: string
  ): Promise<AccountGroup | null> {
    const accountGroup = await prisma.accountGroup.findFirst({
      where: {
        createdBy: userId,
        type: 'personal',
      },
    })

    return accountGroup
  }

  // メンバー関連
  async addMember(
    accountGroupId: string,
    userId: string,
    role: string = 'member'
  ): Promise<AccountGroupMember> {
    const member = await prisma.accountGroupMember.create({
      data: {
        accountGroupId,
        userId,
        role,
      },
    })

    return member
  }

  async removeMember(accountGroupId: string, userId: string): Promise<void> {
    await prisma.accountGroupMember.deleteMany({
      where: {
        accountGroupId,
        userId,
      },
    })
  }

  async findMember(
    accountGroupId: string,
    userId: string
  ): Promise<AccountGroupMember | null> {
    const member = await prisma.accountGroupMember.findUnique({
      where: {
        accountGroupId_userId: {
          accountGroupId,
          userId,
        },
      },
    })

    return member
  }

  async findMembersByAccountGroupId(
    accountGroupId: string
  ): Promise<
    Array<AccountGroupMember & { user: { id: string; email: string } }>
  > {
    const members = await prisma.accountGroupMember.findMany({
      where: { accountGroupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return members
  }

  // 招待関連
  async createInvitation(
    accountGroupId: string,
    inviterId: string,
    inviteeId: string,
    expiresAt?: Date
  ): Promise<AccountGroupInvitation> {
    const invitation = await prisma.accountGroupInvitation.create({
      data: {
        accountGroupId,
        inviterId,
        inviteeId,
        expiresAt,
      },
    })

    return invitation
  }

  async findInvitationById(id: string): Promise<AccountGroupInvitation | null> {
    const invitation = await prisma.accountGroupInvitation.findUnique({
      where: { id },
    })

    return invitation
  }

  async findInvitationsByInviteeId(
    inviteeId: string,
    status?: string
  ): Promise<
    Array<
      AccountGroupInvitation & {
        accountGroup: AccountGroup
        inviter: { id: string; email: string }
      }
    >
  > {
    const invitations = await prisma.accountGroupInvitation.findMany({
      where: {
        inviteeId,
        ...(status && { status }),
      },
      include: {
        accountGroup: true,
        inviter: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return invitations
  }

  async findInvitationsByAccountGroupId(
    accountGroupId: string
  ): Promise<AccountGroupInvitation[]> {
    const invitations = await prisma.accountGroupInvitation.findMany({
      where: { accountGroupId },
      orderBy: { createdAt: 'desc' },
    })

    return invitations
  }

  async updateInvitationStatus(
    id: string,
    status: string
  ): Promise<AccountGroupInvitation> {
    const invitation = await prisma.accountGroupInvitation.update({
      where: { id },
      data: { status },
    })

    return invitation
  }
}

export const accountGroupRepository = new AccountGroupRepository()
