export const AUTH_CONFIG = {
  DEFAULT_USER_STATUS: 'APPROVED' as const, // 誰でも即座に承認済み
  DEFAULT_USER_ROLE: 'USER' as const,
  DEFAULT_ADMIN_ROLE: 'ADMIN' as const,
  ADMIN_EMAILS: [] as string[], // Add actual admin emails as needed
  PRE_APPROVED_EMAILS: [] as string[], // Add pre-approved emails as needed
}