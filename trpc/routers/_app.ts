import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async (opts) => {
    return {
      status: "success",
    };
  }),
});

export type AppRouter = typeof appRouter;
