"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { api } from "@/app/lib/api";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading: loading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      return []; // Notifications not supported in Phase 1
    }
  });

  const notifications: any[] = (notificationsData as any)?.data || [];

  const markReadMutation = useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: () => {
      // Optimistically update or refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      console.error(err);
    }
  });

  const markAllAsRead = () => {
    markReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-pink-500 fill-pink-500" size={24} />;
      case 'comment':
        return <MessageCircle className="text-blue-500 fill-blue-500" size={24} />;
      case 'follow':
        return <UserPlus className="text-primary fill-primary" size={24} />;
      default:
        return <Bell className="text-yellow-500 fill-yellow-500" size={24} />;
    }
  };

  const getNotificationMessage = (type: string, actorName: string) => {
    switch (type) {
      case 'like': return <span className="text-foreground"><span className="font-bold">{actorName}</span> liked your post</span>;
      case 'comment': return <span className="text-foreground"><span className="font-bold">{actorName}</span> replied to your post</span>;
      case 'follow': return <span className="text-foreground"><span className="font-bold">{actorName}</span> followed you</span>;
      default: return <span className="text-foreground"><span className="font-bold">{actorName}</span> interacted with your profile</span>;
    }
  };

  const getLinkHref = (notification: any) => {
    if (notification.type === 'follow') return `/profile/${notification.actorId?.username}`;
    if (notification.postId) return `/post/${notification.postId}`;
    return "#";
  };

  return (
    <div className="pb-20 md:pb-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <h1 className="font-bold text-xl">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </header>
      
      <div className="divide-y">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 flex space-x-4">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-10 h-10 rounded-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No notifications yet!
          </div>
        ) : (
          notifications.map(notif => (
            <Link key={notif._id} href={getLinkHref(notif)} className={`block p-4 border-b hover:bg-muted/30 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}>
              <div className="flex space-x-3">
                <div className="w-8 flex justify-end mt-1">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <Avatar className="w-8 h-8 mb-2">
                    <AvatarImage src={notif.actorId?.avatar || ""} />
                    <AvatarFallback>{notif.actorId?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="text-[15px]">
                    {getNotificationMessage(notif.type, notif.actorId?.name)}
                  </p>
                  <span className="text-sm text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
