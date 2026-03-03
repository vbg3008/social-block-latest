"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Compass, Bell, User, Search, PenLine, LogOut } from "lucide-react";
import { RightSidebar } from "@/components/shared/RightSidebar";
import { useUserStore } from "@/app/store/useUserStore";
import { api } from "@/app/lib/api";
import { toast } from "sonner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };
  
  return (
    <div className="flex justify-center min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-x-hidden">
      {/* Ambient Decorative Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="fixed top-[40%] left-[60%] w-[30%] h-[30%] bg-chart-1/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="flex w-full max-w-7xl relative z-0 backdrop-blur-[2px]">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border/50 bg-background/40 backdrop-blur-xl p-4 fixed h-full z-10 transition-all shadow-[1px_0_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center space-x-3 mb-8 px-4 py-2 hover:bg-muted/50 rounded-full cursor-pointer transition-colors w-max">
            <div className="w-10 h-10 overflow-hidden relative drop-shadow-md flex items-center justify-center">
               <img src="/logos/icon.png" alt="SocialBlock Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter hidden lg:block">SocialBlock</span>
          </div>
          
          <nav className="flex flex-col space-y-2 w-full lg:w-4/5">
            <Link href="/" className="flex items-center space-x-4 font-bold text-xl hover:bg-muted/50 p-3 rounded-full transition-colors group">
              <Home className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block">Home</span>
            </Link>
            <Link href="/search" className="flex items-center space-x-4 font-bold text-xl hover:bg-muted/50 p-3 rounded-full transition-colors group">
              <Compass className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block">Explore</span>
            </Link>
            <Link href="/notifications" className="flex items-center space-x-4 font-bold text-xl hover:bg-muted/50 p-3 rounded-full transition-colors group">
              <Bell className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block">Notifications</span>
            </Link>
            <Link href="/profile/me" className="flex items-center space-x-4 font-bold text-xl hover:bg-muted/50 p-3 rounded-full transition-colors group">
              <User className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block">Profile</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-4 font-bold text-xl hover:bg-destructive/10 text-destructive p-3 rounded-full transition-colors group mt-auto"
            >
              <LogOut className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block">Logout</span>
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="bg-primary text-primary-foreground font-bold text-lg rounded-full py-3 mt-6 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <span className="hidden lg:block">Post</span>
              <span className="lg:hidden mx-auto"><PenLine size={20} className="mx-auto"/></span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full md:ml-64 lg:ml-72 max-w-2xl border-r border-border/50 min-h-screen pb-20 md:pb-0 bg-background/20 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.02)]">
          {children}
        </main>

        {/* Right Sidebar */}
        <RightSidebar />

        {/* Bottom Nav Mobile */}
        <nav className="md:hidden fixed bottom-0 w-full border-t border-border bg-background/95 backdrop-blur-md flex justify-around p-2 z-50 pb-safe">
          <Link href="/" className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all">
            <Home size={26} />
          </Link>
          <Link href="/search" className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all">
            <Search size={26} />
          </Link>
          <Link href="/notifications" className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all">
            <Bell size={26} />
          </Link>
          <Link href="/profile/me" className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all">
            <User size={26} />
          </Link>
          <button onClick={handleLogout} className="p-3 text-destructive hover:bg-destructive/10 rounded-full transition-all">
            <LogOut size={26} />
          </button>
        </nav>
      </div>
    </div>
  );
}
