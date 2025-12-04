/**
 * ID generation utilities for database entities
 */

export function generateUserId(): string {
	return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generateUserToolSubscriptionId(): string {
	return `usersub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generateSettingsId(): string {
	return `settings_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generateSyncLogId(): string {
	return `synclog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generateAuditLogId(): string {
	return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generateCommentId(): string {
	return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generateReactionId(): string {
	return `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
