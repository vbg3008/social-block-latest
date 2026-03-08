"use client";

import { useEffect } from "react";
import { useUserStore } from "@/app/store/useUserStore";
import { useConnection } from "wagmi";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useUserStore();
  const { address, isConnected } = useConnection();

  useEffect(() => {
    if (isConnected && address) {
      setUser({
        _id: address,
        name: `${address.slice(0, 6)}...${address.slice(-4)}`,
        username: address,
        avatar: "",
        email: `${address}@web3.local`,
        role: "user"
      });
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isConnected, address, setUser, setLoading]);

  return <>{children}</>;
}
