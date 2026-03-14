import { createTRPCRouter, publicProcedure } from "../init";
import { reportsRouter } from "./reports";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async (opts) => {
    return {
      status: "success",
    };
  }),
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;

