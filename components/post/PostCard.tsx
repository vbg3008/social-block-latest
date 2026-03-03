import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal, Link as LinkIcon, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLike } from "@/app/hooks/useLike";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    _id: string;
    content: string;
    media: { url: string; type: string }[];
    authorId: {
      _id: string;
      name: string;
      username: string;
      avatar?: string;
    };
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isLiked?: boolean; // Ideally the backend tells us if the user liked it
  };
  isDeletable?: boolean;
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/app/lib/api";

export function PostCard({ post, isDeletable }: PostCardProps) {
  // console.log("PostCard post:", post);  
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toggleLike } = useLike();
  const { authorId: author, createdAt, content, media, likesCount, commentsCount, _id, isLiked: initialIsLiked } = post;
  
  // Local state for instant optimistic UI feedback while React Query processes
  const [optimisticLiked, setOptimisticLiked] = useState(initialIsLiked || false);
  const [optimisticLikesCount, setOptimisticLikesCount] = useState(likesCount || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/posts/${_id}`);
    },
    onSuccess: () => {
      toast.success("Post deleted");
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "global"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete post");
      setShowDeleteDialog(false);
    }
  });

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  // Sync state if server data changes (e.g. after a refetch)
  useEffect(() => {
    setOptimisticLiked(initialIsLiked || false);
    setOptimisticLikesCount(likesCount || 0);
  }, [initialIsLiked, likesCount]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent routing if clicking on a link, button, or author avatar specifically
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[role="menuitem"]')) return;
    
    router.push(`/post/${_id}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Toggle local state for instant feedback
    setOptimisticLiked(!optimisticLiked);
    setOptimisticLikesCount(prev => optimisticLiked ? prev - 1 : prev + 1);
    
    // Fire mutation
    toggleLike(_id, optimisticLiked);
  };

  const handleShareClick = async (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent | Event) => {
    e.stopPropagation(); // Prevent card click
    
    const url = `${window.location.origin}/post/${_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${author.name}`,
          text: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          url: url,
        });
      } catch (error) {
        // User might have canceled the share, ignore
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <article 
      onClick={handleCardClick}
      className="p-4 border-b border-border/50 hover:bg-muted/30 transition-all duration-300 cursor-pointer hover:shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:z-10 relative"
    >
      <div className="flex space-x-3">
        <Link href={`/profile/${author.username}`}>
          <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
            <AvatarImage src={author.avatar || ""} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 truncate">
              <Link href={`/profile/${author.username}`} className="font-bold hover:underline truncate">
                {author.name}
              </Link>
              <Link href={`/profile/${author.username}`} className="text-muted-foreground truncate">
                @{author.username}
              </Link>
              <span className="text-muted-foreground px-1">·</span>
              <span className="text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/post/${_id}`); }}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <span>Copy link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Post reported. Thank you."); }} className="text-destructive focus:text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Report post</span>
                </DropdownMenuItem>
                {isDeletable && (
                  <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete post</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Custom Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Delete Post</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this post? This action cannot be undone and will permanently remove all associated media.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                  <Button 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(false); }}
                    disabled={deleteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-1 text-foreground whitespace-pre-wrap word-break-words">
            {content}
          </div>
          
          {media && media.length > 0 && (
            <div className={`mt-3 grid gap-1 rounded-2xl overflow-hidden ${
              media.length === 1 ? 'grid-cols-1' : 
              media.length === 2 ? 'grid-cols-2' : 
              media.length === 3 ? 'grid-cols-2' : 
              'grid-cols-2 grid-rows-2'
            }`}>
              {media.slice(0, 4).map((m, idx) => (
                <div key={idx} className="relative aspect-video bg-muted">
                  {m.type.startsWith('video/') ? (
                    <video src={m.url} controls className="object-cover w-full h-full" />
                  ) : (
                    <img src={m.url} alt="Post media" className="object-cover w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between mt-3 text-muted-foreground w-full sm:w-4/5 max-w-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); router.push(`/post/${_id}`) }}
              className="group flex items-center space-x-2 rounded-full hover:text-blue-500 hover:bg-blue-500/10 -ml-2"
            >
              <div className="p-1 rounded-full group-hover:bg-blue-500/10">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs">{commentsCount > 0 ? commentsCount : ''}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLikeClick}
              className={`group flex items-center space-x-2 rounded-full hover:bg-pink-500/10 ${optimisticLiked ? 'text-pink-600 hover:text-pink-700' : 'hover:text-pink-500'}`}
            >
              <div className="p-1 rounded-full group-hover:bg-pink-500/10">
                <Heart size={18} className={optimisticLiked ? "fill-current" : ""} />
              </div>
              <span className="text-xs">{optimisticLikesCount > 0 ? optimisticLikesCount : ''}</span>
            </Button>
            
            <Button 
              onClick={handleShareClick}
              variant="ghost" 
              size="sm" 
              className="group flex items-center space-x-2 rounded-full hover:text-green-500 hover:bg-green-500/10"
            >
              <div className="p-1 rounded-full group-hover:bg-green-500/10">
                <Share2 size={18} />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
