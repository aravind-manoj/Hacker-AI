import { z } from "zod";
import { nanoid } from "nanoid";
import { createTRPCRouter, protectedProcedure } from "../init";
import { platformAccounts, posts } from "@/db/schema";
import { eq, desc, sql, getTableColumns, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { PlatformMetadata } from "@/common/types/integrations";
import { PLATFORMS, PLATFORMS_LIST } from "@/common/types/platforms";
import { Attachment, Post } from "@/common/types/posts";
import { inngest } from "@/inngest/client";
import { x_createPost } from "@/platform/x/core";
import { linkedin_createPost } from "@/platform/linkedin/core";
import { instagram_createPost } from "@/platform/instagram/core";
import { facebook_createPost } from "@/platform/facebook/core";

const platformsSchema = z.array(z.enum(PLATFORMS));

const validatePublishPostInput = async ({ input, next }: { input: any; next: () => Promise<any> }) => {
  if (!input.content) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Content is required",
    });
  }
  if (!input.accounts.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Account is required",
    });
  }
  return next();
};

const validateSchedulePostInput = async ({ input, next }: { input: any; next: () => Promise<any> }) => {
  if (!input.content) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Content is required",
    });
  }
  if (!input.accounts.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Account is required",
    });
  }
  if (!input.scheduledTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Scheduled time is required",
    });
  }

  const now = new Date();
  const diffInMinutes = (input.scheduledTime - now.getTime()) / 60000;
  if (diffInMinutes < 10) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Scheduled time must be at least 10 minutes from now",
    });
  }

  return next();
};

const validateDraftPostInput = async ({ input, next }: { input: any; next: () => Promise<any> }) => {
  if (!input.content) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Content is required",
    });
  }
  return next();
};

/**
 * Post Engine - Handles posting to multiple platforms
 * @param ctx - TRPC context with database and other utilities
 * @param accountIds - Array of platform account IDs to post to
 * @param content - Post content/caption
 * @param attachments - Array of attachment objects with URLs
 * @returns Array of results for each account
 */
async function postEngine(
  ctx: any,
  accountIds: string[],
  content: string,
  attachments: Omit<Attachment, "file">[] = []
) {
  const results = [];

  for (const accountId of accountIds) {
    try {
      // Lookup platform account from database
      const accountData = await ctx.db
        .select()
        .from(platformAccounts)
        .where(eq(platformAccounts.id, accountId));

      if (!accountData || accountData.length === 0) {
        results.push({
          accountId,
          success: false,
          error: "Account not found",
        });
        continue;
      }

      const account = accountData[0];
      const platform = account.platform;
      const metadata = account.metadata as any;
      const data = account.data as any;

      // Extract media URLs from attachments
      const mediaUrls = attachments.map((attachment) => attachment.url);

      // Route to appropriate platform function
      let postId: string | undefined;

      switch (platform) {
        case "x":
          // X/Twitter requires accessToken
          if (!data.accessToken) {
            throw new Error("Access token not found for X account");
          }
          postId = await x_createPost(data.accessToken, content, mediaUrls);
          break;

        case "linkedin":
          // LinkedIn requires accessToken
          if (!data.accessToken) {
            throw new Error("Access token not found for LinkedIn account");
          }
          postId = await linkedin_createPost(data.accessToken, {
            text: content,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          });
          break;

        case "instagram":
          // Instagram requires accessToken and media type determination
          if (!data.accessToken) {
            throw new Error("Access token not found for Instagram account");
          }
          // Determine media type based on number of attachments
          let mediaType: "IMAGE" | "VIDEO" | "CAROUSEL" | "REELS" = "IMAGE";
          if (mediaUrls.length > 1) {
            mediaType = "CAROUSEL";
          } else if (mediaUrls.length === 1) {
            // Check if it's a video based on attachment type
            const firstAttachment = attachments[0];
            if (firstAttachment.type === "video") {
              mediaType = "REELS";
            }
          }
          postId = await instagram_createPost(data.accessToken, content, mediaType, mediaUrls);
          break;

        case "facebook":
          // Facebook requires pageAccessToken
          if (!data.pageAccessToken) {
            throw new Error("Page access token not found for Facebook account");
          }
          postId = await facebook_createPost(data.pageAccessToken, content, mediaUrls);
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      results.push({
        accountId,
        platform,
        success: true,
        postId,
      });
    } catch (error: any) {
      results.push({
        accountId,
        success: false,
        error: error.message || "Unknown error occurred",
      });
    }
  }

  return results;
}

export const postsRouter = createTRPCRouter({
  getPosts: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        totalItems: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.totalItems;
      const limit = input.totalItems;
      const userPosts = await ctx.db
        .select({
          ...getTableColumns(posts),
          totalCount: sql<number>`count(*) over()`.mapWith(Number),
        })
        .from(posts)
        .offset(offset)
        .limit(limit)
        .where(eq(posts.userId, ctx.auth?.user.id as string))
        .orderBy(desc(posts.creationTime));
      const postList = await Promise.all(
        userPosts.map(async ({ totalCount, ...post }) => {
          const accounts = post.accounts
            ? (
              await Promise.all(
                post.accounts.map(async (accountId) => {
                  if (!accountId) return null;
                  const platformAccountData = await ctx.db
                    .select()
                    .from(platformAccounts)
                    .where(eq(platformAccounts.id, accountId));
                  if (!platformAccountData[0]) return null;
                  return {
                    id: platformAccountData[0].id,
                    platform: platformAccountData[0].platform,
                    label: PLATFORMS_LIST.find((p) => p.id === platformAccountData[0].platform)?.label!,
                    accountId: (platformAccountData[0].metadata as any).id,
                    accountName: (platformAccountData[0].metadata as any).username,
                  };
                })
              )
            ).filter((acc) => acc !== null)
            : [];
          return { ...post, accounts };
        })
      );

      return {
        posts: postList as Post[],
        total: userPosts[0]?.totalCount ?? 0,
      };
    }),
  publishPost: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        content: z.string(),
        attachmentsRef: z.array(z.string()),
        accounts: z.array(z.string()),
      })
    )
    .use(validatePublishPostInput)
    .mutation(async ({ ctx, input }) => {
      const attachments: any = [];
      await Promise.all(
        input.attachmentsRef.map(async (refId) => {
          const attachment: string | null = await ctx.redis.get(`attachment-create:${refId}`);
          if (attachment) {
            attachments.push(attachment);
            await inngest.send({
              name: "posts/created",
              data: { refId },
              user: { id: ctx.auth?.user.id }
            });
          }
        })
      );
      if (input.id) {
        // existing draft to publish
        const existingPost = await ctx.db
          .select()
          .from(posts)
          .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
        if (existingPost.length > 0 && existingPost[0].status === "draft") {
          await ctx.db
            .update(posts)
            .set({
              status: "published",
              content: input.content,
              attachments: [...(existingPost[0].attachments ?? []), ...attachments],
              accounts: input.accounts,
              updatedTime: new Date().toISOString(),
              publishedTime: new Date().toISOString(),
            })
            .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }
      } else {
        // new publish
        await ctx.db.insert(posts).values({
          id: nanoid(),
          status: "published",
          creationTime: new Date().toISOString(),
          content: input.content,
          attachments: attachments,
          accounts: input.accounts,
          updatedTime: new Date().toISOString(),
          publishedTime: new Date().toISOString(),
          userId: ctx.auth?.user.id as string,
        });
      }
      return {
        status: "success",
        message: "Post published successfully",
      };
    }),
  schedulePost: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        content: z.string(),
        attachmentsRef: z.array(z.string()),
        accounts: z.array(z.string()),
        scheduledTime: z.number(),
      })
    )
    .use(validateSchedulePostInput)
    .mutation(async ({ ctx, input }) => {
      const attachments: any = [];
      await Promise.all(
        input.attachmentsRef.map(async (refId) => {
          const attachment: string | null = await ctx.redis.get(`attachment-create:${refId}`);
          if (attachment) {
            attachments.push(attachment);
            await inngest.send({
              name: "posts/created",
              data: { refId },
              user: { id: ctx.auth?.user.id }
            });
          }
        })
      );
      if (input.id) {
        // existing schedule to publish
        const existingPost = await ctx.db
          .select()
          .from(posts)
          .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
        if (existingPost.length > 0 && existingPost[0].status === "draft") {
          await ctx.db
            .update(posts)
            .set({
              status: "scheduled",
              content: input.content,
              attachments: [...(existingPost[0].attachments ?? []), ...attachments],
              accounts: input.accounts,
              scheduledTime: new Date(input.scheduledTime).toISOString(),
              updatedTime: new Date().toISOString(),
            })
            .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }
      } else {
        // new schedule
        await ctx.db.insert(posts).values({
          id: nanoid(),
          status: "scheduled",
          creationTime: new Date().toISOString(),
          content: input.content,
          attachments: attachments,
          accounts: input.accounts,
          scheduledTime: new Date(input.scheduledTime).toISOString(),
          updatedTime: new Date().toISOString(),
          userId: ctx.auth?.user.id as string,
        });
      }
      return {
        status: "success",
        message: "Post scheduled successfully",
      };
    }),
  scheduleToPublishPost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // existing schedule to publish
      const existingPost = await ctx.db
        .select()
        .from(posts)
        .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
      if (existingPost.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }
      await ctx.db
        .update(posts)
        .set({
          status: "published",
          updatedTime: new Date().toISOString(),
          publishedTime: new Date().toISOString(),
          scheduledTime: null,
        })
        .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
      return {
        status: "success",
        message: "Post published successfully",
      };
    }),
  draftPost: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        content: z.string(),
        attachmentsRef: z.array(z.string()),
        accounts: z.array(z.string()),
      })
    )
    .use(validateDraftPostInput)
    .mutation(async ({ ctx, input }) => {
      const attachments: any = [];
      await Promise.all(
        input.attachmentsRef.map(async (refId) => {
          const attachment: string | null = await ctx.redis.get(`attachment-create:${refId}`);
          if (attachment) {
            attachments.push(attachment);
            await inngest.send({
              name: "posts/created",
              data: { refId },
              user: { id: ctx.auth?.user.id }
            });
          }
        })
      );
      if (input.id) {
        // existing draft to draft
        const existingPost = await ctx.db
          .select()
          .from(posts)
          .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
        if (existingPost.length > 0 && existingPost[0].status === "draft") {
          await ctx.db
            .update(posts)
            .set({
              status: "draft",
              content: input.content,
              attachments: [...(existingPost[0].attachments ?? []), ...attachments],
              accounts: input.accounts,
              updatedTime: new Date().toISOString(),
            })
            .where(and(eq(posts.id, input.id as string), eq(posts.userId, ctx.auth?.user.id as string)));
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }
      } else {
        // new draft
        await ctx.db.insert(posts).values({
          id: nanoid(),
          status: "draft",
          creationTime: new Date().toISOString(),
          content: input.content,
          attachments: attachments,
          accounts: input.accounts,
          updatedTime: new Date().toISOString(),
          userId: ctx.auth?.user.id as string,
        });
      }
      return {
        status: "success",
        message: "Post drafted successfully",
      };
    }),
  deletePost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingPost = await ctx.db.select().from(posts).where(and(eq(posts.id, input.id), eq(posts.userId, ctx.auth?.user.id as string)));
      if (existingPost.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }
      // Delete attachments
      if (existingPost[0].attachments) {
        const attachments = existingPost[0].attachments as Omit<Attachment, "file">[];
        await Promise.all(
          attachments.map(async (attachment) => {
            if (attachment.key) await ctx.s3.deleteObject(attachment.key);
          })
        );
      }
      await ctx.db.delete(posts).where(and(eq(posts.id, input.id), eq(posts.userId, ctx.auth?.user.id as string)));
      return {
        message: "Post deleted successfully",
      };
    }),
});
