export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Decorative Orbs for Auth */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      
      <div className="w-full max-w-md z-10 relative">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-border/50 -z-10"></div>
        <div className="p-2">
          {children}
        </div>
      </div>
    </div>
  );
}
