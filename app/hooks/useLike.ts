import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useLike() {
  const queryClient = useQueryClient();

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string, isLiked: boolean }) => {
      if (isLiked) {
        return await api.delete(`/api/posts/${postId}/like`);
      } else {
        return await api.post(`/api/posts/${postId}/like`);
      }
    },
    // When mutate is called:
    onMutate: async ({ postId, isLiked }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["posts", "global"]);

      // Optimistically update to the new value
      // Note: A robust implementation would update the specific post in the cache correctly
      // depending on where the post lives (global feed, following feed, user profile, single post)
      
      return { previousPosts };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err: any, newLike, context: any) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", "global"], context.previousPosts);
      }
      toast.error(err.message || "Failed to update like status");
    },
    // Always refetch after error or success:
    onSettled: (data, error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  return {
    toggleLike: (postId: string, isLiked: boolean) => toggleLikeMutation.mutate({ postId, isLiked }),
    isLoading: toggleLikeMutation.isPending
  };
}
