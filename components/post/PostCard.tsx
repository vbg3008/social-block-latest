import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  };
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { authorId: author, createdAt, content, media, likesCount, commentsCount, _id } = post;
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent routing if clicking on a link, button, or author avatar specifically
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;
    
    router.push(`/post/${_id}`);
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full">
              <MoreHorizontal size={18} />
            </Button>
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
            <Button variant="ghost" size="sm" className="group flex items-center space-x-2 rounded-full hover:text-blue-500 hover:bg-blue-500/10 -ml-2">
              <div className="p-1 rounded-full group-hover:bg-blue-500/10">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs">{commentsCount > 0 ? commentsCount : ''}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="group flex items-center space-x-2 rounded-full hover:text-pink-500 hover:bg-pink-500/10">
              <div className="p-1 rounded-full group-hover:bg-pink-500/10">
                <Heart size={18} />
              </div>
              <span className="text-xs">{likesCount > 0 ? likesCount : ''}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="group flex items-center space-x-2 rounded-full hover:text-green-500 hover:bg-green-500/10">
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
