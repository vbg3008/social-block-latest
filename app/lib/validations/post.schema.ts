import { z } from "zod";

export const CreatePostSchema = z.object({
  content: z.string().optional(),
  media: z.array(z.object({
    url: z.string(),
    type: z.enum(["image", "video"]),
    publicId: z.string().optional()
  })).optional(),
  hashtags: z.array(z.string()).optional(),
  visibility: z.enum(["public", "followers-only", "private"]).default("public")
}).refine(data => {
  const hasContent = data.content && data.content.trim().length > 0;
  const hasMedia = data.media && data.media.length > 0;
  return hasContent || hasMedia;
}, {
  message: "Post must contain text content or media",
  path: ["content"] // Attach error to content field
});

export type CreatePostDTO = z.infer<typeof CreatePostSchema>;

export const GetPostsQuerySchema = z.object({
  type: z.enum(["global", "following"]).nullable().optional().transform(v => v || "global"),
  page: z.preprocess(val => val ? Number(val) : 1, z.number().min(1)),
  limit: z.preprocess(val => val ? Number(val) : 20, z.number().min(1).max(50)),
});

export type GetPostsQueryDTO = z.infer<typeof GetPostsQuerySchema>;
