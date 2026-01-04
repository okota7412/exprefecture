/**
 * パスワードサービス（ハッシュ化・検証）
 */
import bcrypt from 'bcryptjs'

/**
 * bcryptのsalt rounds
 * 12以上を推奨（OWASP推奨値）
 */
const SALT_ROUNDS = 12

export interface IPasswordService {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
  /**
   * タイミング攻撃対策: 存在しないユーザーでも同じ時間がかかるようにする
   * ダミーハッシュを検証する
   */
  verifyWithTimingProtection(
    password: string,
    hash: string | null
  ): Promise<boolean>
}

export class PasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * ユーザー列挙耐性のため、存在しないユーザーでも同じ時間がかかるようにする
   * ダミーハッシュ（常に失敗するハッシュ）を使用してタイミング攻撃を防ぐ
   */
  async verifyWithTimingProtection(
    password: string,
    hash: string | null
  ): Promise<boolean> {
    // ハッシュが存在しない場合、ダミーハッシュで検証（常に失敗するが時間は同じ）
    const hashToVerify =
      hash || '$2a$12$dummyHashForTimingAttackPrevention.dummy'

    // 両方のケースでbcrypt.compareを実行することで、レスポンス時間を統一
    return bcrypt.compare(password, hashToVerify)
  }
}

export const passwordService = new PasswordService()
