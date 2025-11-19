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

export const evmChains = {
  Arbitrum: "Arbitrum",
  Avalanche: "Avalanche",
  Base: "Base",
  Blast: "Blast",
  BSC: "BSC",
  Ethereum: "Ethereum",
  Optimism: "Optimism",
  Polygon: "Polygon",
} as const;

const otherChains = {
  Ripple: "Ripple",
  Solana: "Solana",
} as const;

const utxoChains = {
  Bitcoin: "Bitcoin",
} as const;

const evmRpcUrls: Record<EvmChain, string> = {
  [evmChains.Arbitrum]: `${vultiApiUrl}/arb/`,
  [evmChains.Avalanche]: `${vultiApiUrl}/avax/`,
  [evmChains.Base]: `${vultiApiUrl}/base/`,
  [evmChains.Blast]: `${vultiApiUrl}/blast/`,
  [evmChains.BSC]: `${vultiApiUrl}/bsc/`,
  [evmChains.Ethereum]: `${vultiApiUrl}/eth/`,
  [evmChains.Optimism]: `${vultiApiUrl}/opt/`,
  [evmChains.Polygon]: `${vultiApiUrl}/polygon/`,
};

export const evmChainInfo: Record<EvmChain, ViemChain> = {
  [evmChains.Arbitrum]: {
    ...arbitrum,
    rpcUrls: { default: { http: [evmRpcUrls.Arbitrum] } },
  },
  [evmChains.Avalanche]: {
    ...avalanche,
    rpcUrls: { default: { http: [evmRpcUrls.Avalanche] } },
  },
  [evmChains.Base]: {
    ...base,
    rpcUrls: { default: { http: [evmRpcUrls.Base] } },
  },
  [evmChains.Blast]: {
    ...blast,
    rpcUrls: { default: { http: [evmRpcUrls.Blast] } },
  },
  [evmChains.BSC]: { ...bsc, rpcUrls: { default: { http: [evmRpcUrls.BSC] } } },
  [evmChains.Ethereum]: {
    ...mainnet,
    rpcUrls: { default: { http: [evmRpcUrls.Ethereum] } },
  },
  [evmChains.Optimism]: {
    ...optimism,
    rpcUrls: { default: { http: [evmRpcUrls.Optimism] } },
  },
  [evmChains.Polygon]: {
    ...polygon,
    rpcUrls: { default: { http: [evmRpcUrls.Polygon] } },
  },
};

export const chains = { ...evmChains, ...utxoChains, ...otherChains } as const;

export const tickers: Record<Chain, string> = {
  Arbitrum: "ARB",
  Avalanche: "AVAX",
  Base: "BASE",
  Bitcoin: "BTC",
  Blast: "BLAST",
  BSC: "BNB",
  Ethereum: "ETH",
  Optimism: "OP",
  Polygon: "MATIC",
  Ripple: "XRP",
  Solana: "SOL",
};

export type Chain = (typeof chains)[keyof typeof chains];
export type EvmChain = (typeof evmChains)[keyof typeof evmChains];

export const defaultChain: Chain = chains.Ethereum;
