export const AUTH_CONFIG = {
  DEFAULT_USER_STATUS: 'APPROVED' as const, // 誰でも即座に承認済み
  DEFAULT_USER_ROLE: 'USER' as const,
  DEFAULT_ADMIN_ROLE: 'ADMIN' as const,
  ADMIN_EMAILS: ['admin@example.com'], // 本番では実際の管理者メールに変更
  PRE_APPROVED_EMAILS: ['partner@example.com'], // 事前承認メールリスト
}