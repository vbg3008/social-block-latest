"use client";

import { Button } from "@/components/ui/button";
import { useConnect } from "wagmi";

import { useRouter } from "next/navigation";

export function Web3LoginButton() {
  const router = useRouter();
  const { connectors, connect, isPending } = useConnect({
    mutation: {
      onSuccess: () => {
        router.push("/");
      }
    }
  });

  if (connectors.length === 0) {
    return (
      <Button variant="outline" className="w-full font-bold" disabled>
        No Web3 Wallets Detected
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          variant="outline"
          className="w-full font-bold flex items-center justify-center gap-2"
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? "Connecting..." : `Continue with ${connector.name}`}
        </Button>
      ))}
    </div>
  );
}
