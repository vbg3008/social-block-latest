import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UserCardProps {
  user: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  isFollowing?: boolean;
  onFollowToggle?: (userId: string) => void;
  showBio?: boolean;
}

export function UserCard({ user, isFollowing = false, onFollowToggle, showBio = false }: UserCardProps) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3 overflow-hidden">
        <Link href={`/profile/${user.username}`}>
          <Avatar className="w-12 h-12 hover:opacity-80 transition-opacity">
            <AvatarImage src={user.avatar || ""} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col truncate">
          <Link href={`/profile/${user.username}`} className="font-bold hover:underline truncate text-sm">
            {user.name}
          </Link>
          <Link href={`/profile/${user.username}`} className="text-muted-foreground text-sm truncate">
            @{user.username}
          </Link>
          {showBio && user.bio && (
            <p className="text-sm mt-1 truncate max-w-[200px] sm:max-w-xs">{user.bio}</p>
          )}
        </div>
      </div>
      
      {onFollowToggle && (
        <Button 
          variant={isFollowing ? "outline" : "default"} 
          size="sm" 
          className={`rounded-full font-bold ${isFollowing ? 'hover:text-destructive hover:border-destructive hover:bg-destructive/10' : ''}`}
          onClick={() => onFollowToggle(user._id)}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
