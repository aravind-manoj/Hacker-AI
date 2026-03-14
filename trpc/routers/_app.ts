import { createTRPCRouter, publicProcedure } from "../init";
import { reportsRouter } from "./reports";
import { systemsRouter } from "./systems";
import { pentesterRouter } from "./pentester";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async (opts) => {
    return {
      status: "success",
    };
  }),
  reports: reportsRouter,
  systems: systemsRouter,
  pentester: pentesterRouter,
});

export type AppRouter = typeof appRouter;

