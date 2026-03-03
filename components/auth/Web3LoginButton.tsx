"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSyncProviders } from "@/app/hooks/web3/useSyncProviders";
import { EIP6963ProviderDetail } from "@/app/hooks/web3/types";
import { toast } from "sonner";
import { useUserStore } from "@/app/store/useUserStore";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { api } from "@/app/lib/api";

export function Web3LoginButton() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const providers = useSyncProviders();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (providerDetail: EIP6963ProviderDetail) => {
    setIsLoading(true);
    try {
      // 1. Connect to wallet & get accounts
      const accounts = await providerDetail.provider.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      // Convert the lowercase MetaMask address to an EIP-55 checksum address
      // The SiweMessage class strictly requires this format
      const address = ethers.getAddress(accounts[0]);

      // 2. Fetch Nonce from our backend
      const nonceRes = await api.get(`/api/auth/web3/nonce?address=${address}`);
      const nonceData = nonceRes.data as any;

      if (!nonceData.success || !nonceData.nonce) {
        throw new Error(nonceData.error || "Failed to fetch nonce");
      }

      // 3. Create SIWE Message
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = "Sign in to SocialBlock with your Web3 Wallet.";
      
      const siweMessage = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 1
Nonce: ${nonceData.nonce}
Issued At: ${new Date().toISOString()}`;

      // 4. Request Signature from wallet
      const signature = await providerDetail.provider.request({
        method: "personal_sign",
        params: [siweMessage, address],
      });

      // 5. Send to our backend for verification and JWT assignment
      const loginRes = await api.post("/api/auth/web3/login", {
        message: siweMessage,
        signature,
      });

      const loginData = loginRes.data as any;

      if (loginData.success) {
        toast.success("Successfully signed in with Web3!");
        setUser(loginData.data.user);
        router.push("/");
      } else {
        throw new Error(loginData.error || "Web3 login verification failed");
      }
    } catch (error: any) {
      console.error("Web3 login error:", error);
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  if (providers.length === 0) {
    return (
      <Button variant="outline" className="w-full font-bold" disabled>
        No Web3 Wallets Detected
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {providers.map((provider: EIP6963ProviderDetail) => (
        <Button
          key={provider.info.uuid}
          variant="outline"
          className="w-full font-bold flex items-center justify-center gap-2"
          onClick={() => handleConnect(provider)}
          disabled={isLoading}
        >
          <img src={provider.info.icon} alt={provider.info.name} className="w-5 h-5 rounded" />
          {isLoading ? "Connecting..." : `Continue with ${provider.info.name}`}
        </Button>
      ))}
    </div>
  );
}
