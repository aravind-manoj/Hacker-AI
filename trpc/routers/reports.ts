import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { report, user } from "@/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";

export const reportsRouter = createTRPCRouter({
  // Get all reports for the authenticated user
  getMyReports: protectedProcedure.query(async ({ ctx }) => {
    const reports = await ctx.db
      .select({
        id: report.id,
        name: report.name,
        description: report.description,
        url: report.url,
        createdAt: report.createdAt,
        userId: report.userId,
      })
      .from(report)
      .where(eq(report.userId, ctx.auth!.user.id))
      .orderBy(desc(report.createdAt));

    return reports;
  }),

  // Get all reports (admin-level) with joined user info
  getAllReports: protectedProcedure.query(async ({ ctx }) => {
    const reports = await ctx.db
      .select({
        id: report.id,
        name: report.name,
        description: report.description,
        url: report.url,
        createdAt: report.createdAt,
        userId: report.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(report)
      .leftJoin(user, eq(report.userId, user.id))
      .orderBy(desc(report.createdAt));

    return reports;
  }),

  // Get stats: total reports, reports this week, reports this month
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult] = await ctx.db
      .select({ count: count() })
      .from(report)
      .where(eq(report.userId, ctx.auth!.user.id));

    const [weekResult] = await ctx.db
      .select({ count: count() })
      .from(report)
      .where(
        sql`${report.userId} = ${ctx.auth!.user.id} AND ${report.createdAt} >= ${startOfWeek.toISOString()}`
      );

    const [monthResult] = await ctx.db
      .select({ count: count() })
      .from(report)
      .where(
        sql`${report.userId} = ${ctx.auth!.user.id} AND ${report.createdAt} >= ${startOfMonth.toISOString()}`
      );

    return {
      total: totalResult?.count ?? 0,
      thisWeek: weekResult?.count ?? 0,
      thisMonth: monthResult?.count ?? 0,
    };
  }),

  // Create a new report
  createReport: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(255),
        description: z.string().optional(),
        url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [newReport] = await ctx.db
        .insert(report)
        .values({
          id,
          name: input.name,
          description: input.description ?? null,
          url: input.url || null,
          userId: ctx.auth!.user.id,
        })
        .returning();

      return newReport;
    }),

  // Delete a report
  deleteReport: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(report)
        .where(
          sql`${report.id} = ${input.id} AND ${report.userId} = ${ctx.auth!.user.id}`
        );
      return { success: true };
    }),
});
