import { pgTable, unique, text, boolean, timestamp, index, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	phone: text(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "account_user_id_user_id_fk"
	}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "session_user_id_user_id_fk"
	}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

// Report
export const report = pgTable("report", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id"),
	name: text(),
	description: text(),
	url: text(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "report_user_id_fkey"
	}).onDelete("cascade"),
]);

// Pentester
export const attack = pgTable("attack", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	userId: text("user_id").notNull(),
	targetName: text("target_name"),
	targetList: text("target_list").array(),
	attackVectors: text("attack_vectors").array(),
	status: text(),
	report: text(),
	note: text(),
	vulnerabilities: text().array(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "attacks_user_id_fkey"
	}).onDelete("cascade"),
]);

export const attackVm = pgTable("attack_vm", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	attackId: text("attack_id").notNull(),
	subagentId: text("subagent_id").notNull(),
	task: text(),
	buffer: text(),
	status: text(),
	completedSteps: text("completed_steps").array(),
	findings: text().array(),
}, (table) => [
	foreignKey({
		columns: [table.attackId],
		foreignColumns: [attack.id],
		name: "attack_vm_attack_id_fkey"
	}).onDelete("cascade"),
]);

// System
export const system = pgTable("system", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id"),
	name: text(),
	sshHost: text("ssh_host"),
	sshPort: text("ssh_port"),
	sshUsername: text("ssh_username"),
	sshPassword: text("ssh_password"),
	sshKey: text("ssh_key"),
	secretKey: text("secret_key"),
	status: text(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "system_user_id_fkey"
	}).onDelete("cascade"),
]);

// Vulnerability
export const vulnerability = pgTable("vulnerability", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id"),
	systemId: text("system_id"),
	vulnId: text("vuln_id"),
	title: text(),
	description: text(),
	severity: text(),
	isFixed: boolean("is_fixed"),
	fixedAt: timestamp("fixed_at", { withTimezone: true, mode: 'string' }),
	fixLogBuffer: text("fix_log_buffer"),
	fixAgentReport: text("fix_agent_report"),
	status: text(),
}, (table) => [
	foreignKey({
		columns: [table.systemId],
		foreignColumns: [system.id],
		name: "vulnerability_system_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "vulnerability_user_id_fkey"
	}).onDelete("cascade"),
]);

// Business Context
export const businessContext = pgTable("business_context", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id").notNull(),
	url: text(),
	name: text(),
	description: text(),
	industry: text(),
	services: text(),
	contactEmail: text("contact_email"),
	phone: text(),
	address: text(),
	socialLinks: text("social_links"),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "business_context_user_id_fkey"
	}).onDelete("cascade"),
]);