import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useFollow() {
  const queryClient = useQueryClient();

  const toggleFollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      // The backend toggle endpoint is typically a POST or PATCH. 
      // Assuming a standard POST /api/users/[id]/follow based on typical architecture
      return await api.post(`/api/users/${userId}/follow`);
    },
    onSuccess: (_, userId) => {
      // Invalidate relevant queries (e.g. suggestions, viewing profile, own following list)
      queryClient.invalidateQueries({ queryKey: ["users", "suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Follow status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update follow status");
    }
  });

  return {
    toggleFollow: (userId: string) => toggleFollowMutation.mutate(userId),
    isLoading: toggleFollowMutation.isPending
  };
}
