import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { nanoid } from "nanoid";
import { inngest } from "@/inngest/client";
import { Attachment } from "@/common/types/posts";

export const attachmentRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileType: z.enum(["image", "video"]),
        mimeType: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const refId = nanoid();
      const expiresIn = 3600;
      const userId = ctx.auth?.user.id;
      const key = `attachments/${userId}/${refId}_${nanoid()}/${input.fileName}`;
      const { uploadUrl, objectUrl } = await ctx.s3.getUploadUrl(key, input.fileType, expiresIn);
      const fileData: Omit<Attachment, "file"> = {
        id: nanoid(),
        url: objectUrl,
        type: input.fileType,
        mimeType: input.mimeType,
        name: input.fileName,
        size: input.fileSize,
        uploadStatus: "complete",
        uploadProgress: 100,
        key: key,
      }
      await ctx.redis.set(`attachment-create:${refId}`, fileData, { ex: expiresIn });
      await inngest.send({
        name: "attachment/create",
        data: {
          refId,
          key,
        },
        user: {
          id: userId,
        }
      });
      return { refId, uploadUrl };
    }),
});
