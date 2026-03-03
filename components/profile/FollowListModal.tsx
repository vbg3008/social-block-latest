import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FollowListModalProps {
  userId: string;
  type: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function FollowListModal({ userId, type, isOpen, onClose, title }: FollowListModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: async () => {
      const res = await api.get(`/api/users/${userId}/${type}`);
      return res.data;
    },
    enabled: isOpen && !!userId,
  });

  const users = data?.data || [];
  
  const filteredUsers = users.filter((u: any) => 
    u?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 pt-2 border-b sticky top-0 bg-background z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="divide-y">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No results found" : `No ${type} yet`}
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user: any) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <Link href={`/profile/${user.username}`} onClick={onClose} className="flex items-center space-x-3 flex-1 overflow-hidden">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-sm truncate hover:underline">{user.name}</span>
                      <span className="text-muted-foreground text-sm truncate">@{user.username}</span>
                      {user.bio && <span className="text-sm truncate mt-0.5 text-foreground/80">{user.bio}</span>}
                    </div>
                  </Link>
                  <Button variant="outline" size="sm" className="rounded-full ml-3 px-4 font-bold h-8">
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
