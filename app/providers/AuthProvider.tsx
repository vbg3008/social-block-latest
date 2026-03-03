"use client";

import { useEffect } from "react";
import { useUserStore } from "@/app/store/useUserStore";
import { api } from "@/app/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/users/me");
        setUser(res.data);
      } catch (error) {
        console.error("Failed to fetch user session", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
