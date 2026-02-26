"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { UserCard } from "@/components/user/UserCard";
import { toast } from "sonner";

// Simple debounce hook for search if not available globally
// Or we can just use a local timeout implementation
export function useLocalDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useLocalDebounce(query, 500);

  const { data: searchData, isLoading: loading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      return await api.get(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
    },
    enabled: debouncedQuery.trim().length > 0 // Only run query if there's text
  });

  const results: any[] = (searchData as any)?.data || [];

  return (
    <div className="pb-20 md:pb-0 min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary h-10 w-full"
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>
      
      <div className="divide-y relative">
        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        )}
        
        {!loading && query.trim() !== "" && results.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            No results found for "{query}"
          </div>
        )}
        
        {!loading && results.map(user => (
          <UserCard 
            key={user._id} 
            user={user} 
            showBio={true}
            // In a real app we'd pass isFollowing and onFollowToggle handlers here
          />
        ))}

        {!loading && !query.trim() && (
          <div className="p-6">
            <h2 className="font-bold text-xl mb-4">Trending Creators</h2>
            <div className="bg-muted/30 p-4 rounded-xl text-center text-muted-foreground border border-dashed">
              Type in the search bar to find accounts by name or username.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
