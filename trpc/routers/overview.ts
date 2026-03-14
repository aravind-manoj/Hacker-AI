import { createTRPCRouter, protectedProcedure } from "../init";
import { system, attack, vulnerability } from "@/db/schema";
import { eq, and, count, or, isNull } from "drizzle-orm";

export const overviewRouter = createTRPCRouter({
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.auth!.user.id;

        const [
            systemsResult,
            totalAttacksResult,
            activeAttacksResult,
            totalVulnsResult,
            patchedVulnsResult,
            unpatchedVulnsResult,
        ] = await Promise.all([
            ctx.db
                .select({ count: count() })
                .from(system)
                .where(eq(system.userId, userId)),
            ctx.db
                .select({ count: count() })
                .from(attack)
                .where(eq(attack.userId, userId)),
            ctx.db
                .select({ count: count() })
                .from(attack)
                .where(and(eq(attack.userId, userId), eq(attack.status, "running"))),
            ctx.db
                .select({ count: count() })
                .from(vulnerability)
                .where(eq(vulnerability.userId, userId)),
            ctx.db
                .select({ count: count() })
                .from(vulnerability)
                .where(
                    and(eq(vulnerability.userId, userId), eq(vulnerability.isFixed, true))
                ),
            ctx.db
                .select({ count: count() })
                .from(vulnerability)
                .where(
                    and(
                        eq(vulnerability.userId, userId),
                        or(eq(vulnerability.isFixed, false), isNull(vulnerability.isFixed))
                    )
                ),
        ]);

        return {
            totalSystems: systemsResult[0]?.count ?? 0,
            totalAttacks: totalAttacksResult[0]?.count ?? 0,
            activeAttacks: activeAttacksResult[0]?.count ?? 0,
            totalVulnerabilities: totalVulnsResult[0]?.count ?? 0,
            patchedVulnerabilities: patchedVulnsResult[0]?.count ?? 0,
            unpatchedVulnerabilities: unpatchedVulnsResult[0]?.count ?? 0,
        };
    }),
});
