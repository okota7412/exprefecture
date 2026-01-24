/**
 * バリデーションユーティリティ
 */

/**
 * UUID形式のバリデーション
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * UUIDが有効かどうかをチェック
 */
export const isValidUUID = (value: string): boolean => {
  return UUID_REGEX.test(value)
}

/**
 * UUIDをバリデーションし、無効な場合はエラーを投げる
 */
export const validateUUID = (value: string, fieldName = 'ID'): void => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid ${fieldName} format: ${value}`)
  }
}
