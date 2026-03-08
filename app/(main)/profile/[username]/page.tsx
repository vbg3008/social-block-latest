"use client";

import { useState, use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, CalendarDays } from "lucide-react";

import { useReadContract, useConnection } from "wagmi";
import SocialBlockABI from "@/components/shared/SocialBlock.json";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi = SocialBlockABI.abi;

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const unwrappedParams = use(params);
  const addressParam = unwrappedParams.username;
  const { address: currentUserAddress } = useConnection();
  
  // Try to use the param as an Ethereum address
  const [followModalConfig, setFollowModalConfig] = useState<{ isOpen: boolean, type: "followers" | "following", title: string }>({
    isOpen: false,
    type: "followers",
    title: "",
  });

  const { data: userContractData, isLoading: loadingProfile } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "users",
    args: [addressParam as any],
  });

  // Since mapping returns an array-like structure in wagmi for structs
  const u: any = userContractData;
  const isRegistered = u && u[3]; // The bool isRegistered is the 4th item in the User struct
  
  const profile = isRegistered ? {
    _id: addressParam,
    username: u[0],
    avatar: u[1] ? `https://gateway.pinata.cloud/ipfs/${u[1]}` : "",
    bio: u[2],
    name: u[0], // fallback to username
    isOwner: currentUserAddress?.toLowerCase() === addressParam?.toLowerCase(),
    coverImage: "", 
    followersCount: 0, // Mocked for phase 1
    followingCount: 0,
    createdAt: Date.now()
  } : {
    _id: addressParam,
    username: addressParam,
    name: `${addressParam.slice(0, 6)}...${addressParam.slice(-4)}`,
    avatar: "",
    bio: "This address has not deployed a SocialBlock profile.",
    isOwner: currentUserAddress?.toLowerCase() === addressParam?.toLowerCase(),
    coverImage: "",
    followersCount: 0,
    followingCount: 0,
    createdAt: Date.now()
  };

  const { data: userPostsContractData, isLoading: loadingPostsIDs } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getUserPosts",
    args: [addressParam as any],
  });

  const postIDs = (userPostsContractData as any[]) || [];

  // Since we can't easily fetch N individual posts in one hook without multicall, 
  // we will mock the posts array with their IDs for Phase 1. A subgraph is needed for real production.
  const posts = postIDs.map((id: bigint) => ({
    _id: id.toString(),
    content: `Post ID: ${id.toString()} on Smart Contract`,
    media: [],
    authorId: profile,
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString()
  })).reverse(); // Reverse to show newest first

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

  return (
    <div className="pb-20 md:pb-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center space-x-6">
        <div>
          <h1 className="font-bold text-xl">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{posts.length} Posts</p>
        </div>
      </header>
      
      <div className="h-48 bg-muted w-full relative overflow-hidden">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>
      
      <div className="px-4 pb-4">
        <div className="relative flex justify-between items-start">
          <Avatar className="w-32 h-32 absolute -top-16 border-4 border-background bg-background">
            <AvatarImage src={profile.avatar || ""} className="object-cover" />
            <AvatarFallback className="text-4xl">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="w-full flex justify-end mt-4">
            {profile.isOwner ? (
              <EditProfileDialog profile={profile}>
                <Button className="rounded-full font-bold px-6" variant="outline">
                  Edit Profile
                </Button>
              </EditProfileDialog>
            ) : (
              <Button className="rounded-full font-bold px-6" variant="outline">
                Follow
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="font-bold text-2xl tracking-tighter">{profile.name}</h2>
          <p className="text-muted-foreground text-lg">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mt-3 text-[15px]">{profile.bio}</p>
          )}
          
          <div className="flex space-x-4 mt-4 text-[15px]">
             <span className="font-bold text-foreground">{profile.followingCount}</span> <span className="text-muted-foreground">Following</span>
             <span className="font-bold text-foreground">{profile.followersCount}</span> <span className="text-muted-foreground">Followers</span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="posts" className="w-full mt-2">
        <TabsList className="w-full justify-around rounded-none bg-transparent border-b h-14 p-0">
          <TabsTrigger value="posts" className="flex-1 font-bold">Posts</TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 font-bold">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="m-0">
          <div className="divide-y">
            {loadingPostsIDs ? (
              <div className="p-10 text-center">Loading blockchain posts...</div>
            ) : posts.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No posts yet</div>
            ) : (
              posts.map((post: any) => <PostCard key={post._id} post={post} isDeletable={profile.isOwner} />)
            )}
          </div>
        </TabsContent>
        <TabsContent value="likes" className="p-10 text-center text-muted-foreground">
          Coming Soon
        </TabsContent>
      </Tabs>
    </div>
  );
}
