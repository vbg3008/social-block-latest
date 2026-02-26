"use client";

import { useEffect, useState, use } from "react";
import { PostCard } from "@/components/post/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/app/lib/api";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const postId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [replyContent, setReplyContent] = useState("");

  const { data: postData, isLoading: loadingPost } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      return await api.get(`/api/posts/${postId}`);
    }
  });

  const { data: commentsData } = useQuery({
    queryKey: ["postComments", postId],
    queryFn: async () => {
      return await api.get(`/api/posts/${postId}/comments`);
    },
    enabled: !!postId // Wait until we have the ID resolved
  });

  const post = (postData as any)?.data;
  const comments = (commentsData as any)?.data || [];

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return await api.post(`/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setReplyContent("");
      toast.success("Reply posted!");
      // Refetch post and comments
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  const loading = loadingPost;
  const isReplying = replyMutation.isPending;

  if (loading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return <div className="p-10 text-center font-bold text-xl">Post not found</div>;
  }

  return (
    <div className="pb-20 md:pb-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-3 flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-bold text-xl">Post</h1>
      </header>
      
      {/* Main Post (reusing PostCard but it could be tailored for full view) */}
      <PostCard post={post} />
      
      {/* Reply Input */}
      <div className="p-4 border-b flex space-x-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea 
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none px-0 py-2 text-lg min-h-[50px]" 
            placeholder="Post your reply"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            disabled={isReplying}
          />
          <div className="flex justify-end mt-2 pt-2">
            <Button 
              className="rounded-full font-bold px-6" 
              onClick={handleReply}
              disabled={isReplying || !replyContent.trim()}
            >
              {isReplying ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Reply
            </Button>
          </div>
        </div>
      </div>
      
      {/* Comments section */}
      <div className="divide-y">
        {comments.map((comment: any) => (
          <article key={comment._id} className="p-4 flex space-x-3 hover:bg-muted/30 transition-colors">
            <Link href={`/profile/${comment.authorId.username}`}>
              <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
                <AvatarImage src={comment.authorId.avatar || ""} />
                <AvatarFallback>{comment.authorId.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center space-x-1 truncate">
                <Link href={`/profile/${comment.authorId.username}`} className="font-bold hover:underline truncate">
                  {comment.authorId.name}
                </Link>
                <Link href={`/profile/${comment.authorId.username}`} className="text-muted-foreground truncate">
                  @{comment.authorId.username}
                </Link>
                <span className="text-muted-foreground px-1">·</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false })}
                </span>
              </div>
              
              <div className="mt-1 text-foreground whitespace-pre-wrap word-break-words">
                {comment.content}
              </div>
            </div>
          </article>
        ))}
        {comments.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            No replies yet! Be the first to join the conversation.
          </div>
        )}
      </div>
    </div>
  );
}
