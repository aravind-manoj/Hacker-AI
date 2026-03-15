import { createTRPCRouter, publicProcedure } from "../init";
import { reportsRouter } from "./reports";
import { systemsRouter } from "./systems";
import { pentesterRouter } from "./pentester";
import { overviewRouter } from "./overview";
import { vulnerabilitiesRouter } from "./vulnerabilities";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async (opts) => {
    return {
      status: "success",
    };
  }),
  reports: reportsRouter,
  systems: systemsRouter,
  pentester: pentesterRouter,
  overview: overviewRouter,
  vulnerabilities: vulnerabilitiesRouter,
});

export type AppRouter = typeof appRouter;

