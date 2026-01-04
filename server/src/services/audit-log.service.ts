/**
 * 監査ログサービス
 * セキュリティイベントを記録
 */
export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  REFRESH_TOKEN_USED = 'REFRESH_TOKEN_USED',
  REFRESH_TOKEN_FAILED = 'REFRESH_TOKEN_FAILED',
}

export interface AuditLogEntry {
  type: AuditEventType
  userId?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * シンプルな監査ログサービス（本番環境では外部ログサービスへの送信を推奨）
 */
export class AuditLogService {
  /**
   * 監査ログを記録
   */
  log(entry: AuditLogEntry): void {
    // 本番環境では、構造化ログとして外部サービス（CloudWatch、Datadog等）に送信
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    }

    if (process.env.NODE_ENV === 'production') {
      // 本番環境では、構造化ログとして出力
      console.log(JSON.stringify({ level: 'audit', ...logEntry }))
    } else {
      // 開発環境では、読みやすい形式で出力
      console.log('[AUDIT]', logEntry)
    }
  }

  /**
   * ログイン成功を記録
   */
  logLoginSuccess(params: {
    userId: string
    email: string
    ipAddress?: string
    userAgent?: string
  }): void {
    this.log({
      type: AuditEventType.LOGIN_SUCCESS,
      userId: params.userId,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    })
  }

  /**
   * ログイン失敗を記録
   */
  logLoginFailure(params: {
    email?: string
    ipAddress?: string
    userAgent?: string
    reason?: string
  }): void {
    this.log({
      type: AuditEventType.LOGIN_FAILURE,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
      metadata: params.reason ? { reason: params.reason } : undefined,
    })
  }

  /**
   * ログアウトを記録
   */
  logLogout(params: {
    userId: string
    email?: string
    ipAddress?: string
    userAgent?: string
  }): void {
    this.log({
      type: AuditEventType.LOGOUT,
      userId: params.userId,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    })
  }

  /**
   * サインアップを記録
   */
  logSignup(params: {
    userId: string
    email: string
    ipAddress?: string
    userAgent?: string
  }): void {
    this.log({
      type: AuditEventType.SIGNUP,
      userId: params.userId,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    })
  }

  /**
   * リフレッシュトークン使用を記録
   */
  logRefreshTokenUsed(params: {
    userId: string
    ipAddress?: string
    userAgent?: string
  }): void {
    this.log({
      type: AuditEventType.REFRESH_TOKEN_USED,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    })
  }

  /**
   * リフレッシュトークン失敗を記録
   */
  logRefreshTokenFailed(params: {
    ipAddress?: string
    userAgent?: string
    reason?: string
  }): void {
    this.log({
      type: AuditEventType.REFRESH_TOKEN_FAILED,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
      metadata: params.reason ? { reason: params.reason } : undefined,
    })
  }
}

export const auditLogService = new AuditLogService()
