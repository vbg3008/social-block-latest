import { getAuthSession } from "@/app/lib/auth";
import { ResponseUtil } from "@/app/lib/api-response";
import { PostService } from "@/app/lib/services/post.service";
import { CreatePostSchema, GetPostsQuerySchema } from "@/app/lib/validations/post.schema";

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get post feed
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Feed type (global or following)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);
    
    // Validate Input
    const queryDTO = GetPostsQuerySchema.parse({
      type: searchParams.get("type"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit")
    });

    // Execute Service
    const data = await PostService.getFeed(queryDTO, session?.userId);

    // Standard Response
    return ResponseUtil.success(data, "Posts retrieved successfully");
  } catch (error) {
    console.error("Feed error:", error);
    return ResponseUtil.error(error, "Failed to fetch feed");
  }
}

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               visibility:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return ResponseUtil.unauthorized();

    const body = await req.json();

    // Validate Input
    const dto = CreatePostSchema.parse(body);

    // Execute Service
    const post = await PostService.createPost(dto, session.userId);

    // Standard Response
    return ResponseUtil.success(post, "Post created successfully", 201);
  } catch (error) {
    console.error("Create post error:", error);
    return ResponseUtil.error(error, "Failed to create post");
  }
}
