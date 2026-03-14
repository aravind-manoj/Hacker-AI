import { z } from "zod";
import { nanoid } from "nanoid";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import { platformAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { linkedin_generateAuthUrl, linkedin_getAccessToken, linkedin_getProfile, linkedin_createPost } from "@/platform/linkedin/core";
import { x_generateAuthUrl, x_getAccessToken, x_getProfile, x_createPost } from "@/platform/x/core";
import { instagram_generateAuthUrl, instagram_getAccessToken, instagram_getProfile, instagram_createPost } from "@/platform/instagram/core";
import { facebook_generateAuthUrl, facebook_getAccessToken, facebook_createPost } from "@/platform/facebook/core";
import { inngest } from "@/inngest/client";
import { PlatformMetadata } from "@/common/types/integrations";
import { PLATFORMS_LIST } from "@/common/types/platforms";

export const integrationsRouter = createTRPCRouter({
  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accountsData = await ctx.db.select().from(platformAccounts).where(eq(platformAccounts.userId, ctx.auth?.user.id!));
    const platformMetadata = accountsData.map((account) => {
      return {
        id: account.id,
        platform: account.platform,
        label: PLATFORMS_LIST.find((p) => p.id === account.platform)?.label!,
        accountId: (account.metadata as Record<string, unknown>).id,
        accountName: (account.metadata as Record<string, unknown>).username,
        connectedAt: account.createdAt,
      } as PlatformMetadata;
    });
    return platformMetadata;
  }),
  connectPlatform: protectedProcedure
    .input(
      z.object({
        platform: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      switch (input.platform) {
        case "facebook":
          return await facebook_generateAuthUrl(ctx.auth?.user.id!);
        case "instagram":
          return await instagram_generateAuthUrl(ctx.auth?.user.id!);
        case "x":
          return await x_generateAuthUrl(ctx.auth?.user.id!);
        case "linkedin":
          return await linkedin_generateAuthUrl(ctx.auth?.user.id!);
      }
    }),
  linkedinCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.redis.get(input.state);
      if (!userId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const token = await linkedin_getAccessToken(input.code);
      if (!token.access_token) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const profile = await linkedin_getProfile(token.access_token);
      const refId = `${userId}:${profile.sub}`;
      const existingAccount = await ctx.db.select().from(platformAccounts).where(eq(platformAccounts.refId, refId));
      if (existingAccount.length > 0) {
        await ctx.db.update(platformAccounts).set({
          metadata: {
            id: profile.sub,
            username: profile.name,
          },
          data: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_in,
            scope: token.scope,
          },
        }).where(eq(platformAccounts.refId, refId));
      } else {
        await ctx.db.insert(platformAccounts).values({
          id: nanoid(),
          userId: userId as string,
          refId: refId,
          platform: "linkedin",
          metadata: {
            id: profile.sub,
            username: profile.name,
          },
          data: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_in,
            scope: token.scope,
          },
        });
      }
    }),
  xCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.redis.get(input.state);
      if (!userId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const token = await x_getAccessToken(input.code, input.state);
      if (!token.access_token) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const profile = await x_getProfile(token.access_token);
      const refId = `${userId}:${profile.id}`;
      const existingAccount = await ctx.db.select().from(platformAccounts).where(eq(platformAccounts.refId, refId));
      if (existingAccount.length > 0) {
        await ctx.db.update(platformAccounts).set({
          metadata: {
            id: profile.id,
            username: profile.username,
          },
          data: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_in,
            scope: token.scope,
          },
        }).where(eq(platformAccounts.refId, refId));
      } else {
        await ctx.db.insert(platformAccounts).values({
          id: nanoid(),
          userId: userId as string,
          refId: refId,
          platform: "x",
          metadata: {
            id: profile.id,
            username: profile.username,
          },
          data: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_in,
            scope: token.scope,
          },
        });
      }
    }),
  instagramCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.redis.get(input.state);
      if (!userId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const token = await instagram_getAccessToken(input.code);
      if (!token.access_token) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const profile = await instagram_getProfile(token.access_token);
      const refId = `${userId}:${profile.user_id}`;
      const existingAccount = await ctx.db.select().from(platformAccounts).where(eq(platformAccounts.refId, refId));
      if (existingAccount.length > 0) {
        await ctx.db.update(platformAccounts).set({
          metadata: {
            id: profile.user_id,
            username: profile.username,
          },
          data: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_in,
            scope: token.scope,
          },
        }).where(eq(platformAccounts.refId, refId));
      } else {
        await ctx.db.insert(platformAccounts).values({
          id: nanoid(),
          userId: userId as string,
          refId: refId,
          platform: "instagram",
          metadata: {
            id: profile.user_id,
            username: profile.username,
          },
          data: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: token.expires_in,
            scope: token.scope,
          },
        });
      }
    }),
  facebookCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.redis.get(input.state);
      if (!userId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const { token, pages } = await facebook_getAccessToken(input.code);
      if (!token.access_token) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      for (const page of pages) {
        const refId = `${userId}:${page.id}`;
        const existingAccount = await ctx.db.select().from(platformAccounts).where(eq(platformAccounts.refId, refId));
        if (existingAccount.length > 0) {
          await ctx.db.update(platformAccounts).set({
            metadata: {
              id: page.id,
              username: page.name,
            },
            data: {
              pageAccessToken: page.access_token,
              accessToken: token.access_token,
              refreshToken: token.refresh_token,
              expiresAt: token.expires_in,
              scope: token.scope,
            },
          }).where(eq(platformAccounts.refId, refId));
        } else {
          await ctx.db.insert(platformAccounts).values({
            id: nanoid(),
            userId: userId as string,
            refId: refId,
            platform: "facebook",
            metadata: {
              id: page.id,
              username: page.name,
            },
            data: {
              pageAccessToken: page.access_token,
              accessToken: token.access_token,
              refreshToken: token.refresh_token,
              expiresAt: token.expires_in,
              scope: token.scope,
            },
          });
        }
      }
    }),
});
