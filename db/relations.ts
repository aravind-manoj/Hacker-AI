import { relations } from "drizzle-orm/relations";
import { user, account, session, report } from "./schema";

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

export const reportRelations = relations(report, ({ one }) => ({
	user: one(user, {
		fields: [report.userId],
		references: [user.id]
	}),
}));