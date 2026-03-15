import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../init";
import { db } from "@/db";
import { vulnerability } from "@/db/schema";
import { eq, and, desc, asc, ilike, or, sql } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { redis } from "@/lib/redis";

export const vulnerabilitiesRouter = createTRPCRouter({
  getVulnerabilities: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10),
        search: z.string().optional(),
        isFixed: z.boolean().optional(),
        severity: z.string().optional(),
        sortBy: z.enum(["createdAt", "severity", "title"]).default("createdAt"),
        sortDesc: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(vulnerability.userId, ctx.auth!.user.id)];
      
      if (input.search) {
        conditions.push(
          or(
            ilike(vulnerability.title, `%${input.search}%`),
            ilike(vulnerability.description, `%${input.search}%`)
          )!
        );
      }
      
      if (input.isFixed !== undefined) {
        conditions.push(eq(vulnerability.isFixed, input.isFixed));
      }
      
      if (input.severity) {
        conditions.push(eq(vulnerability.severity, input.severity));
      }

      const whereClause = and(...conditions);

      const sortColumn = vulnerability[input.sortBy];
      const orderByClause = input.sortDesc ? desc(sortColumn) : asc(sortColumn);

      const items = await db
        .select()
        .from(vulnerability)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);

      const totalCountQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(vulnerability)
        .where(whereClause);
      
      const totalCount = Number(totalCountQuery[0].count);

      return {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / input.pageSize),
      };
    }),

  getVulnerability: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(vulnerability)
        .where(
          and(
            eq(vulnerability.id, input.id),
            eq(vulnerability.userId, ctx.auth!.user.id)
          )
        )
        .limit(1);
      
      return result[0] ?? null;
    }),

  fixVulnerability: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find the vulnerability to ensure it exists and belongs to the user
      const result = await db
        .select()
        .from(vulnerability)
        .where(
          and(
            eq(vulnerability.id, input.id),
            eq(vulnerability.userId, ctx.auth!.user.id)
          )
        )
        .limit(1);
        
      if (result.length === 0) {
        throw new Error("Vulnerability not found");
      }
      
      await db.update(vulnerability)
        .set({ status: "fixing" })
        .where(eq(vulnerability.id, input.id));

      await inngest.send({
        name: "fix/start",
        data: {
          id: result[0].id,
          title: result[0].title || "Unknown",
          description: result[0].description || "No description",
          severity: result[0].severity || "low",
          vuln_id: result[0].vulnId || "none",
          systemId: result[0].systemId || "none",
        },
      });
      
      return { success: true };
    }),

  stopFixVulnerability: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(vulnerability)
        .where(
          and(
            eq(vulnerability.id, input.id),
            eq(vulnerability.userId, ctx.auth!.user.id)
          )
        )
        .limit(1);
        
      if (result.length === 0) {
        throw new Error("Vulnerability not found");
      }
      
      await redis.set(`forcestop_${input.id}`, "true", { ex: 86400 });
      await db.update(vulnerability)
        .set({ status: "stopped", isFixed: false })
        .where(eq(vulnerability.id, input.id));
      
      return { success: true };
    }),
});
