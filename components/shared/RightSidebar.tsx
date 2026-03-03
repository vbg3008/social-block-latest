"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserCard } from "@/components/user/UserCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollow } from "@/app/hooks/useFollow";

export function RightSidebar() {
  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ["users", "suggestions"],
    queryFn: async () => {
      return await api.get("/api/users/search?q=");
    },
    // Prevent refetching suggestions too often
    staleTime: 5 * 60 * 1000, 
  });

  const { toggleFollow } = useFollow();
  const suggestions: any[] = (suggestionsData as any)?.data || [];

  return (
    <aside className="hidden lg:block w-80 p-6 space-y-6">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pt-2 pb-4">
        <Link href={"/"} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <Input 
            className="pl-12 rounded-full bg-muted/30 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background h-12 text-md transition-all pt-1 shadow-sm backdrop-blur-md hover:bg-muted/50"
            placeholder="Search SocialBlock"
          />
        </Link >
      </div>
      
      <div className="bg-muted/20 backdrop-blur-md rounded-2xl border border-border/40 overflow-hidden shadow-sm shadow-border/10">
        <h2 className="font-extrabold text-xl p-4 border-b border-border/40">Who to follow</h2>
        <div className="flex flex-col">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No suggestions available.</div>
          ) : (
            suggestions.map(user => (
              <UserCard 
                key={user._id} 
                user={user as any} 
                showBio={false} 
                isFollowing={false} 
                onFollowToggle={toggleFollow} 
              />
            ))
          )}
        </div>
        <Link href="/search" className="block p-4 text-primary hover:bg-muted/50 transition-colors">
          Show more
        </Link>
      </div>
      
      <div className="text-xs text-muted-foreground px-4 flex flex-wrap gap-x-3 gap-y-1">
        <a href="#" className="hover:underline">Terms of Service</a>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Cookie Policy</a>
        <span>© 2026 SocialBlock.</span>
      </div>
    </aside>
  );
}
