import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { system } from "@/db/schema";
import { eq } from "drizzle-orm";

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
      const newSystem = await ctx.db
        .insert(system)
        .values({
          id: crypto.randomUUID(),
          userId: ctx.auth!.user.id,
          name: input.name,
          sshHost: input.sshHost,
          sshPort: input.sshPort,
          sshUsername: input.sshUsername,
          sshPassword: input.sshPassword || null,
          sshKey: input.sshKey || null,
          status: "connected", // Mocking initial connection status
        })
        .returning();

      return newSystem[0];
    }),

  deleteSystem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(system).where(eq(system.id, input.id));
    }),
});
