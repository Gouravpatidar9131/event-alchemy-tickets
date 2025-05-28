
import React, { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

interface EthereumProviderProps {
  children: ReactNode;
}

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, sepolia],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/your-api-key`),
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/your-api-key`),
    },

    // Required API Keys
    walletConnectProjectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || '',

    // Required App Info
    appName: "Event Ticketing DApp",
    appDescription: "Decentralized event ticketing platform",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

const queryClient = new QueryClient();

export const EthereumProvider: React.FC<EthereumProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
