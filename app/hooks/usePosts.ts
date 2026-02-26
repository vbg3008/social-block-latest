import { useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";
import { CreatePostDTO, GetPostsQueryDTO } from "../lib/validations/post.schema";
import { ApiContract } from "../lib/types/api";

/**
 * Hook to manage fetching the post feed with loading/error states.
 */
export function usePosts(params?: GetPostsQueryDTO) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (queryParams?: GetPostsQueryDTO) => {
    setIsLoading(true);
    setError(null);
    try {
      // Create query string manually
      const searchParams = new URLSearchParams();
      const finalParams: Partial<GetPostsQueryDTO> = queryParams || params || {};
      
      if (finalParams.type) searchParams.set("type", finalParams.type);
      if (finalParams.page) searchParams.set("page", finalParams.page.toString());
      if (finalParams.limit) searchParams.set("limit", finalParams.limit.toString());

      const res = await api.get<any, ApiContract>(`/api/posts?${searchParams.toString()}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch posts");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  // Optionally auto-fetch on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { data, isLoading, error, refetch: fetchPosts };
}

/**
 * Hook for creating a post with associated states.
 */
export function useCreatePost() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createPost = async (dto: CreatePostDTO) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<any, ApiContract>("/api/posts", dto);
      return res.data; // Newly created post
    } catch (err: any) {
      // Keep details if validation failed
      setError({
        message: err.message,
        details: err.details
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createPost, isLoading, error };
}
