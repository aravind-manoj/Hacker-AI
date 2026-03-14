import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { postsRouter } from "./posts";
import { integrationsRouter } from "./integrations";
import { attachmentRouter } from "./attachment";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(async (opts) => {
    return {
      status: "success",
    };
  }),
  posts: postsRouter,
  attachment: attachmentRouter,
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter;
