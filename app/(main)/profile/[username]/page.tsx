"use client";

import { useEffect, useState, use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CalendarDays, Link as LinkIcon, MapPin } from "lucide-react";
import { format } from "date-fns";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const unwrappedParams = use(params);
  const username = unwrappedParams.username;
  
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      return await api.get(`/api/users/${username}`);
    }
  });

  const profile = (profileData as any)?.data;

  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ["userPosts", profile?._id],
    queryFn: async () => {
      return await api.get(`/api/users/${profile._id}/posts`);
    },
    enabled: !!profile?._id // Only fetch if we have the profile ID resolved
  });

  const posts = (postsData as any)?.data || [];

  if (loadingProfile) {
    return (
      <div className="flex flex-col animate-pulse">
        <div className="h-48 bg-muted w-full" />
        <div className="px-4 pb-4">
          <div className="relative flex justify-between">
            <div className="w-32 h-32 rounded-full absolute -top-16 border-4 border-background bg-muted" />
            <div className="w-full flex justify-end mt-4">
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
          <div className="mt-16 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-10 text-center font-bold text-xl">User not found</div>;
  }

  return (
    <div className="pb-20 md:pb-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center space-x-6">
        <div>
          <h1 className="font-bold text-xl">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{posts.length} Posts</p>
        </div>
      </header>
      
      {/* Hero Cover Image Placeholder */}
      <div className="h-48 bg-muted w-full relative">
        {/* Can add standard cover photo implementation here */}
      </div>
      
      <div className="px-4 pb-4">
        <div className="relative flex justify-between items-start">
          <Avatar className="w-32 h-32 absolute -top-16 border-4 border-background bg-background">
            <AvatarImage src={profile.avatar || ""} alt={profile.name} className="object-cover" />
            <AvatarFallback className="text-4xl">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="w-full flex justify-end mt-4">
            {profile.isOwner || username === "me" ? (
              <Button className="rounded-full font-bold px-6" variant="outline" onClick={() => toast.info("Edit Profile Coming Soon")}>
                Edit Profile
              </Button>
            ) : (
              <Button className="rounded-full font-bold px-6" variant="outline">
                Follow
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-16 sm:mt-8 md:mt-12 lg:mt-16 xl:mt-16">
          <h2 className="font-bold text-2xl tracking-tighter">{profile.name}</h2>
          <p className="text-muted-foreground text-lg">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mt-3 text-[15px]">{profile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-4 mt-3 text-muted-foreground text-[15px]">
            {profile.location && (
              <div className="flex items-center space-x-1">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center space-x-1">
                <LinkIcon size={16} />
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <CalendarDays size={16} />
              <span>Joined {format(new Date(profile.createdAt || Date.now()), "MMMM yyyy")}</span>
            </div>
          </div>
          
          <div className="flex space-x-4 mt-4 text-[15px]">
            <a href={`/profile/${profile.username}/following`} className="hover:underline">
              <span className="font-bold text-foreground">{profile.followingCount || 0}</span> <span className="text-muted-foreground">Following</span>
            </a>
            <a href={`/profile/${profile.username}/followers`} className="hover:underline">
              <span className="font-bold text-foreground">{profile.followersCount || 0}</span> <span className="text-muted-foreground">Followers</span>
            </a>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="posts" className="w-full mt-2">
        <TabsList className="w-full justify-around rounded-none bg-transparent border-b h-14 p-0">
          <TabsTrigger value="posts" className="data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full flex-1 font-bold">
            Posts
          </TabsTrigger>
          <TabsTrigger value="likes" className="data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full flex-1 font-bold">
            Likes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="divide-y">
            {loadingPosts ? (
               Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <p className="font-bold text-xl mb-1 text-foreground">No posts yet</p>
                <p>When they post, their posts will show up here.</p>
              </div>
            ) : (
              posts.map((post: any) => <PostCard key={post._id} post={post} />)
            )}
          </div>
        </TabsContent>
        <TabsContent value="likes" className="m-0 min-h-[300px] flex items-center justify-center text-muted-foreground focus-visible:outline-none focus-visible:ring-0">
          Coming Soon (Like functionality logic placeholder)
        </TabsContent>
      </Tabs>
    </div>
  );
}
