"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, mainnet } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [hardhat, mainnet],
  transports: {
    [hardhat.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});

export function Web3Provider(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
