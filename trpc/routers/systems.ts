import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { system } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { inngest } from "@/inngest/client";

export const systemsRouter = createTRPCRouter({
  getSystems: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(system).where(eq(system.userId, ctx.auth!.user.id));
  }),

  addSystem: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        sshHost: z.string(),
        sshPort: z.string(),
        sshUsername: z.string(),
        sshPassword: z.string().optional(),
        sshKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const systemId = uuidv4();
      const secretKey = uuidv4();

      await ctx.db.insert(system).values({
        id: systemId,
        userId: ctx.auth!.user.id,
        name: input.name,
        sshHost: input.sshHost,
        sshPort: input.sshPort,
        sshUsername: input.sshUsername,
        sshPassword: input.sshPassword,
        sshKey: input.sshKey,
        secretKey: secretKey,
        status: "pending"
      });

      return { id: systemId, secretKey };
    }),

  getSystem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(system).where(eq(system.id, input.id));
      return result[0];
    }),

  deleteSystem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(system).where(eq(system.id, input.id));
    }),
});
