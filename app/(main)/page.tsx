"use client";

import { useEffect } from "react";
import { CreatePostInput } from "@/components/shared/CreatePostInput";
import { PostCard } from "@/components/post/PostCard";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/app/store/useUserStore";

// Web3 Hooks
import { usePosts, useCreatePost } from "@/app/hooks/usePosts";

export default function HomePage() {
  const currentUser = useUserStore((state) => state.user);

  // Wagmi-based Custom Hooks
  const { data: allPosts, isLoading: loading, error, refetch } = usePosts({ limit: 50, offset: 0 });
  const { createPost, isLoading: isCreating } = useCreatePost();

  const handleCreatePost = async (content: string, mediaFiles: File[]) => {
    try {
      // Create local offchain media uploading placeholder (since IPFS logic runs in useCreatePost wrapper)
      await createPost({ 
        content, 
        media: mediaFiles.map(file => ({
          url: URL.createObjectURL(file), // Mock URL for the DTO
          type: file.type.startsWith("video/") ? "video" : "image",
          publicId: file.name
        })),
        visibility: "public"
      });
      toast.success("Transaction submitted! Waiting for blocks...");
      // In a real dapp, you'd listen for the Tx Receipt before refetching
      setTimeout(() => refetch(), 4000); 
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    }
  };

  if (error) {
    return <div className="p-10 text-destructive">Error loading Web3 posts: {error}</div>;
  }

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
        {isCreating ? (
          <div className="flex items-center space-x-2 p-4 text-muted-foreground">
             <Loader2 className="animate-spin w-5 h-5" /> <span>Confirming Transaction...</span>
          </div>
        ) : (
          <CreatePostInput 
            user={currentUser || { name: "Guest", avatar: "" }}
            onSubmit={handleCreatePost}
            placeholder="What is happening on Web3?!"
          />
        )}
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
        ) : allPosts.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No posts to show. Write your first post onto the blockchain!
          </div>
        ) : (
          <>
            {allPosts.map((post: any) => (
              <PostCard 
                key={post.id} 
                post={{
                   _id: post.id.toString(),
                   content: `IPFS Hash: ${post.contentCid}`,
                   media: [],
                   authorId: {
                     _id: post.author,
                     name: `${post.author.slice(0, 6)}...${post.author.slice(-4)}`,
                     username: post.author,
                   },
                   likesCount: post.likesCount,
                   commentsCount: 0,
                   createdAt: new Date(post.timestamp * 1000).toISOString()
                }} 
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
