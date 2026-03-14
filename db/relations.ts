import { relations } from "drizzle-orm/relations";
import { user, account, session, report, attack, attackVm, system } from "./schema";

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

// Report
export const reportRelations = relations(report, ({ one }) => ({
	user: one(user, {
		fields: [report.userId],
		references: [user.id]
	}),
}));

// Pentester
export const attackRelations = relations(attack, ({ one, many }) => ({
	user: one(user, {
		fields: [attack.userId],
		references: [user.id]
	}),
	attackVms: many(attackVm),
}));

export const attackVmRelations = relations(attackVm, ({ one }) => ({
	attack: one(attack, {
		fields: [attackVm.attackId],
		references: [attack.id]
	}),
}));

// System
export const systemRelations = relations(system, ({ one }) => ({
	user: one(user, {
		fields: [system.userId],
		references: [user.id]
	}),
}));