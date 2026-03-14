import { createTRPCRouter, publicProcedure } from "../init";
import { reportsRouter } from "./reports";
import { systemsRouter } from "./systems";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async (opts) => {
    return {
      status: "success",
    };
  }),
  reports: reportsRouter,
  systems: systemsRouter,
});

export type AppRouter = typeof appRouter;

