"use client";

import { useEffect, useState } from "react";
import { CreatePostInput } from "@/components/shared/CreatePostInput";
import { PostCard } from "@/components/post/PostCard";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Use actual Zustand store for user info now

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/app/store/useUserStore";
import { api } from "@/app/lib/api";

export default function HomePage() {
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.user);

  const { data: postsData, isLoading: loading } = useQuery({
    queryKey: ["posts", "global"],
    queryFn: async () => {
      return await api.get("/api/posts?type=global");
    }
  });

  const posts = (postsData as any)?.data?.posts || [];

  const createPostMutation = useMutation({
    mutationFn: async ({ content, mediaFiles }: { content: string, mediaFiles: File[] }) => {
      const media = [];
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file); // API expects "file" key
          
          const uploadData: any = await api.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          
          return uploadData.data; // returns { url, type, publicId }
        });
        
        const uploadedFiles = await Promise.all(uploadPromises);
        media.push(...uploadedFiles);
      }
      
      return await api.post("/api/posts", { content, media });
    },
    onSuccess: () => {
      toast.success("Post created successfully!");
      queryClient.invalidateQueries({ queryKey: ["posts", "global"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const handleCreatePost = async (content: string, mediaFiles: File[]) => {
    await createPostMutation.mutateAsync({ content, mediaFiles });
  };

  return (
    <div className="pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <h1 className="font-extrabold text-xl p-4 pb-0">Home</h1>
        <div className="flex mt-2">
          <button className="flex-1 font-bold text-sm hover:bg-muted/50 transition-colors py-4 relative flex justify-center">
            <div className="relative">
              For you
              <div className="absolute -bottom-4 left-0 right-0 h-1 bg-primary rounded-full"></div>
            </div>
          </button>
          <button className="flex-1 font-bold text-sm text-muted-foreground hover:bg-muted/50 transition-colors py-4">
            Following
          </button>
        </div>
      </header>
      
      <div className="p-4 border-b border-border/50 hidden md:block">
        <CreatePostInput 
          user={currentUser || { name: "Guest", avatar: "" }}
          onSubmit={handleCreatePost}
          placeholder="What is happening?!"
        />
      </div>

      <div className="divide-y divide-border/50">
        {loading ? (
          // Loading Skeletons
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 flex space-x-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No posts to show. Start following people or write your first post!
          </div>
        ) : (
          posts.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
