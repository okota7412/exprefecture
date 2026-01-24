import { pathToFileURL } from 'url'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 既存データをアカウントグループにマイグレーション
 * - 各ユーザーに対して個人用アカウントグループを作成
 * - 既存のItemとGroupに個人用グループを割り当て
 */
export async function migrateToAccountGroups() {
  console.log('アカウントグループへのマイグレーションを開始します...')

  try {
    // すべてのユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    })

    console.log(`${users.length}人のユーザーが見つかりました`)

    for (const user of users) {
      // 既に個人用グループが存在するかチェック
      const existingPersonalGroup = await prisma.accountGroup.findFirst({
        where: {
          createdBy: user.id,
          type: 'personal',
        },
      })

      let personalGroupId: string

      if (existingPersonalGroup) {
        console.log(`ユーザー ${user.email} の個人用グループは既に存在します`)
        personalGroupId = existingPersonalGroup.id
      } else {
        // 個人用アカウントグループを作成
        const personalGroup = await prisma.accountGroup.create({
          data: {
            name: '自分のみ',
            description: '個人用のアカウントグループ',
            type: 'personal',
            createdBy: user.id,
          },
        })

        // 作成者をメンバーとして追加（ownerロール）
        await prisma.accountGroupMember.create({
          data: {
            accountGroupId: personalGroup.id,
            userId: user.id,
            role: 'owner',
          },
        })

        personalGroupId = personalGroup.id
        console.log(
          `ユーザー ${user.email} の個人用グループを作成しました: ${personalGroupId}`
        )
      }

      // 既存のItemに個人用グループを割り当て（accountGroupIdがnullのもののみ）
      const itemsUpdated = await prisma.item.updateMany({
        where: {
          userId: user.id,
          accountGroupId: null,
        },
        data: {
          accountGroupId: personalGroupId,
        },
      })

      console.log(
        `ユーザー ${user.email} の ${itemsUpdated.count} 件のItemを個人用グループに割り当てました`
      )

      // 既存のGroupに個人用グループを割り当て（accountGroupIdがnullのもののみ）
      const groupsUpdated = await prisma.group.updateMany({
        where: {
          userId: user.id,
          accountGroupId: null,
        },
        data: {
          accountGroupId: personalGroupId,
        },
      })

      console.log(
        `ユーザー ${user.email} の ${groupsUpdated.count} 件のGroupを個人用グループに割り当てました`
      )
    }

    console.log('マイグレーションが完了しました')
  } catch (error) {
    console.error('マイグレーション中にエラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプトとして直接実行された場合（ESモジュール対応）
const isMainModule = (() => {
  if (!process.argv[1]) return false
  try {
    const scriptUrl = pathToFileURL(process.argv[1]).href
    return import.meta.url === scriptUrl
  } catch {
    // パス変換に失敗した場合は、ファイル名で判定
    return process.argv[1].includes('migrate-to-account-groups')
  }
})()

if (isMainModule) {
  migrateToAccountGroups()
    .then(() => {
      console.log('マイグレーションが正常に完了しました')
      process.exit(0)
    })
    .catch(error => {
      console.error('マイグレーションが失敗しました:', error)
      process.exit(1)
    })
}
