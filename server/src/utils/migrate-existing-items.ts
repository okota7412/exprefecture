/**
 * 既存のアイテムを「その他」グループに移行する処理
 * このスクリプトは、既存のアイテムを持っているユーザーに対して
 * 「その他」グループを自動作成し、既存のアイテムをそのグループに紐づけます
 */
import { groupRepository } from '../repositories/group.repository.js'
import { itemRepository } from '../repositories/item.repository.js'

import prisma from './prisma.js'

export async function migrateExistingItemsToGroups() {
  console.log('既存アイテムの移行処理を開始します...')

  try {
    // 全てのユーザーを取得
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    })

    console.log(`${users.length}人のユーザーが見つかりました`)

    for (const user of users) {
      // ユーザーが既にグループを持っているか確認
      const existingGroups = await groupRepository.findByUserId(user.id)

      // 既にグループがある場合はスキップ（既に移行済み）
      if (existingGroups.length > 0) {
        console.log(
          `ユーザー ${user.email} は既にグループを持っています。スキップします。`
        )
        continue
      }

      // ユーザーのアイテムを取得
      const items = await itemRepository.findByUserId(user.id)

      if (items.length === 0) {
        console.log(
          `ユーザー ${user.email} にはアイテムがありません。スキップします。`
        )
        continue
      }

      console.log(
        `ユーザー ${user.email} のアイテム ${items.length} 件を処理します...`
      )

      // 「その他」グループを作成
      const otherGroup = await groupRepository.create({
        name: 'その他',
        description: '既存のアイテムを自動的にグループ化しました',
        userId: user.id,
      })

      console.log(`「その他」グループを作成しました: ${otherGroup.id}`)

      // 各アイテムをグループに紐づけ
      for (const item of items) {
        await groupRepository.addItemToGroup(item.id, otherGroup.id)
      }

      console.log(
        `ユーザー ${user.email} の ${items.length} 件のアイテムを「その他」グループに紐づけました`
      )
    }

    console.log('既存アイテムの移行処理が完了しました')
  } catch (error) {
    console.error('既存アイテムの移行処理でエラーが発生しました:', error)
    throw error
  }
}

// 直接実行された場合（例: ts-node migrate-existing-items.ts）
if (require.main === module) {
  migrateExistingItemsToGroups()
    .then(() => {
      console.log('移行処理が正常に完了しました')
      process.exit(0)
    })
    .catch(error => {
      console.error('移行処理でエラーが発生しました:', error)
      process.exit(1)
    })
}
