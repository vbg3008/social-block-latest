"use client";

import { useState, use } from "react";
import { PostCard } from "@/components/post/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import SocialBlockABI from "@/components/shared/SocialBlock.json";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const postId = unwrappedParams.id;
  const router = useRouter();
  
  const [replyContent, setReplyContent] = useState("");

  const { data: postContractData, isLoading: loadingPost } = useReadContract({
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: SocialBlockABI.abi,
    functionName: "posts",
    args: [BigInt(postId)],
  });

  const p: any = postContractData;
  const post = p && p.author !== "0x0000000000000000000000000000000000000000" ? {
    _id: p.id.toString(),
    content: `IPFS Hash: ${p.contentCid}`,
    media: [],
    authorId: {
      _id: p.author,
      name: `${p.author.slice(0, 6)}...${p.author.slice(-4)}`,
      username: p.author,
    },
    likesCount: Number(p.likesCount),
    commentsCount: 0,
    createdAt: new Date(Number(p.timestamp) * 1000).toISOString()
  } : null;

  const comments: any[] = []; // Comments not yet supported in Phase 1 Smart Contract

  const handleReply = () => {
    toast.error("Comments are not yet supported in the Phase 1 Smart Contract MVP.");
  };

  const isReplying = false;

  if (loadingPost) {
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
    return <div className="p-10 text-center font-bold text-xl">Post not found on the Blockchain</div>;
  }

  return (
    <div className="pb-20 md:pb-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-3 flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-bold text-xl">Post</h1>
      </header>
      
      <PostCard post={post} />
      
      <div className="p-4 border-b flex space-x-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea 
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none px-0 py-2 text-lg min-h-[50px]" 
            placeholder="Post your reply (Coming Soon)"
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
      
      <div className="divide-y">
        <div className="p-10 text-center text-muted-foreground">
          No replies yet! (Decentralized comments coming in Phase 2).
        </div>
      </div>
    </div>
  );
}
