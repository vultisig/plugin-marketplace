import { Chain as ViemChain } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  blast,
  bsc,
  mainnet,
  optimism,
  polygon,
} from "viem/chains";

import { vultiApiUrl } from "@/utils/constants";

const evmChains = [
  "Arbitrum",
  "Avalanche",
  "Base",
  "Blast",
  "BSC",
  "Ethereum",
  "Optimism",
  "Polygon",
] as const;

const evmChainRpcUrls: Record<EvmChain, string> = {
  Arbitrum: `${vultiApiUrl}/arb/`,
  Avalanche: `${vultiApiUrl}/avax/`,
  Base: `${vultiApiUrl}/base/`,
  Blast: `${vultiApiUrl}/blast/`,
  BSC: `${vultiApiUrl}/bsc/`,
  Ethereum: `${vultiApiUrl}/eth/`,
  Optimism: `${vultiApiUrl}/opt/`,
  Polygon: `${vultiApiUrl}/polygon/`,
};

export const evmChainInfo: Record<EvmChain, ViemChain> = {
  Arbitrum: {
    ...arbitrum,
    rpcUrls: { default: { http: [evmChainRpcUrls.Arbitrum] } },
  },
  Avalanche: {
    ...avalanche,
    rpcUrls: { default: { http: [evmChainRpcUrls.Avalanche] } },
  },
  Base: { ...base, rpcUrls: { default: { http: [evmChainRpcUrls.Base] } } },
  Blast: { ...blast, rpcUrls: { default: { http: [evmChainRpcUrls.Blast] } } },
  BSC: { ...bsc, rpcUrls: { default: { http: [evmChainRpcUrls.BSC] } } },
  Ethereum: {
    ...mainnet,
    rpcUrls: { default: { http: [evmChainRpcUrls.Ethereum] } },
  },
  Optimism: {
    ...optimism,
    rpcUrls: { default: { http: [evmChainRpcUrls.Optimism] } },
  },
  Polygon: {
    ...polygon,
    rpcUrls: { default: { http: [evmChainRpcUrls.Polygon] } },
  },
};

export const evmChainIds: Record<EvmChain, number> = {
  Arbitrum: evmChainInfo.Arbitrum.id,
  Avalanche: evmChainInfo.Avalanche.id,
  Base: evmChainInfo.Base.id,
  Blast: evmChainInfo.Blast.id,
  BSC: evmChainInfo.BSC.id,
  Ethereum: evmChainInfo.Ethereum.id,
  Optimism: evmChainInfo.Optimism.id,
  Polygon: evmChainInfo.Polygon.id,
};

export const chains = [...evmChains, "Bitcoin", "Ripple", "Solana"] as const;

export type Chain = (typeof chains)[number];
export type EvmChain = (typeof evmChains)[number];

export const defaultChain: Chain = "Ethereum";
