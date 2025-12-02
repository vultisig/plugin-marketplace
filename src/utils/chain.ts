import { Chain as ViemChain, defineChain } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  blast,
  bsc,
  cronos,
  mainnet,
  mantle,
  optimism,
  polygon,
  sei,
  zksync,
} from "viem/chains";

import { vultiApiUrl } from "@/utils/constants";

const cosmosChains = {
  Akash: "Akash",
  Cosmos: "Cosmos",
  Dydx: "Dydx",
  Kujira: "Kujira",
  MayaChain: "MayaChain",
  Noble: "Noble",
  Osmosis: "Osmosis",
  Terra: "Terra",
  TerraClassic: "TerraClassic",
  THORChain: "THORChain",
} as const;

const ethL2Chains = {
  Arbitrum: "Arbitrum",
  Base: "Base",
  Blast: "Blast",
  Mantle: "Mantle",
  Optimism: "Optimism",
  Zksync: "Zksync",
} as const;

export const evmChains = {
  ...ethL2Chains,
  Avalanche: "Avalanche",
  BSC: "BSC",
  CronosChain: "CronosChain",
  Ethereum: "Ethereum",
  Hyperliquid: "Hyperliquid",
  Polygon: "Polygon",
  Sei: "Sei",
} as const;

const otherChains = {
  Cardano: "Cardano",
  Polkadot: "Polkadot",
  Ripple: "Ripple",
  Solana: "Solana",
  Sui: "Sui",
  Ton: "Ton",
  Tron: "Tron",
} as const;

const utxoChains = {
  Bitcoin: "Bitcoin",
  BitcoinCash: "Bitcoin-Cash",
  Litecoin: "Litecoin",
  Dogecoin: "Dogecoin",
  Dash: "Dash",
  Zcash: "Zcash",
} as const;

export const chains = {
  ...cosmosChains,
  ...evmChains,
  ...utxoChains,
  ...otherChains,
} as const;

export const decimals: Record<Chain, number> = {
  [chains.Akash]: 6,
  [chains.Arbitrum]: 18,
  [chains.Avalanche]: 18,
  [chains.Base]: 18,
  [chains.Bitcoin]: 8,
  [chains.BitcoinCash]: 8,
  [chains.Blast]: 18,
  [chains.BSC]: 18,
  [chains.Cardano]: 6,
  [chains.Cosmos]: 6,
  [chains.CronosChain]: 18,
  [chains.Dash]: 8,
  [chains.Dogecoin]: 8,
  [chains.Dydx]: 18,
  [chains.Ethereum]: 18,
  [chains.Hyperliquid]: 18,
  [chains.Kujira]: 6,
  [chains.Litecoin]: 8,
  [chains.Mantle]: 18,
  [chains.MayaChain]: 10,
  [chains.Noble]: 6,
  [chains.Optimism]: 18,
  [chains.Osmosis]: 6,
  [chains.Polkadot]: 10,
  [chains.Polygon]: 18,
  [chains.Ripple]: 6,
  [chains.Solana]: 9,
  [chains.Sei]: 18,
  [chains.Sui]: 9,
  [chains.Terra]: 6,
  [chains.TerraClassic]: 6,
  [chains.THORChain]: 8,
  [chains.Ton]: 9,
  [chains.Tron]: 6,
  [chains.Zcash]: 8,
  [chains.Zksync]: 18,
};

export const tickers: Record<Chain, string> = {
  [chains.Akash]: "AKT",
  [chains.Arbitrum]: "ARB",
  [chains.Avalanche]: "AVAX",
  [chains.Base]: "BASE",
  [chains.Bitcoin]: "BTC",
  [chains.BitcoinCash]: "BCH",
  [chains.Blast]: "BLAST",
  [chains.BSC]: "BNB",
  [chains.Cardano]: "ADA",
  [chains.Cosmos]: "ATOM",
  [chains.CronosChain]: "CRO",
  [chains.Dash]: "DASH",
  [chains.Dogecoin]: "DOGE",
  [chains.Dydx]: "DYDX",
  [chains.Ethereum]: "ETH",
  [chains.Hyperliquid]: "HYPE",
  [chains.Kujira]: "KUJI",
  [chains.Litecoin]: "LTC",
  [chains.Mantle]: "MNT",
  [chains.MayaChain]: "CACAO",
  [chains.Noble]: "USDC",
  [chains.Optimism]: "OP",
  [chains.Osmosis]: "OSMO",
  [chains.Polkadot]: "DOT",
  [chains.Polygon]: "MATIC",
  [chains.Ripple]: "XRP",
  [chains.Solana]: "SOL",
  [chains.Sei]: "SEI",
  [chains.Sui]: "SUI",
  [chains.Terra]: "LUNA",
  [chains.TerraClassic]: "LUNC",
  [chains.THORChain]: "RUNE",
  [chains.Ton]: "TON",
  [chains.Tron]: "TRX",
  [chains.Zcash]: "ZEC",
  [chains.Zksync]: "ZK",
};

const evmRpcUrls: Record<EvmChain, string> = {
  [evmChains.Arbitrum]: `${vultiApiUrl}/arb/`,
  [evmChains.Avalanche]: `${vultiApiUrl}/avax/`,
  [evmChains.Base]: `${vultiApiUrl}/base/`,
  [evmChains.Blast]: `${vultiApiUrl}/blast/`,
  [evmChains.CronosChain]: "https://cronos-evm-rpc.publicnode.com",
  [evmChains.BSC]: `${vultiApiUrl}/bsc/`,
  [evmChains.Ethereum]: `${vultiApiUrl}/eth/`,
  [evmChains.Hyperliquid]: `${vultiApiUrl}/hyperevm/`,
  [evmChains.Mantle]: `${vultiApiUrl}/mantle/`,
  [evmChains.Optimism]: `${vultiApiUrl}/opt/`,
  [evmChains.Polygon]: `${vultiApiUrl}/polygon/`,
  [evmChains.Sei]: `https://evm-rpc.sei-apis.com`,
  [evmChains.Zksync]: `${vultiApiUrl}/zksync/`,
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
  [evmChains.CronosChain]: {
    ...cronos,
    rpcUrls: { default: { http: [evmRpcUrls.CronosChain] } },
  },
  [evmChains.Ethereum]: {
    ...mainnet,
    rpcUrls: { default: { http: [evmRpcUrls.Ethereum] } },
  },
  [evmChains.Hyperliquid]: defineChain({
    id: 999,
    name: "Hyperliquid",
    network: "hyperliquid",
    nativeCurrency: {
      name: "Hyperliquid",
      symbol: tickers.Hyperliquid,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [evmRpcUrls.Hyperliquid] },
      public: { http: [evmRpcUrls.Hyperliquid] },
    },
    blockExplorers: {
      default: { name: "LiquidScan", url: "https://liquidscan.io" },
    },
  }),
  [evmChains.Mantle]: {
    ...mantle,
    rpcUrls: { default: { http: [evmRpcUrls.Mantle] } },
  },
  [evmChains.Optimism]: {
    ...optimism,
    rpcUrls: { default: { http: [evmRpcUrls.Optimism] } },
  },
  [evmChains.Polygon]: {
    ...polygon,
    rpcUrls: { default: { http: [evmRpcUrls.Polygon] } },
  },
  [evmChains.Sei]: { ...sei, rpcUrls: { default: { http: [evmRpcUrls.Sei] } } },
  [evmChains.Zksync]: {
    ...zksync,
    rpcUrls: { default: { http: [evmRpcUrls.Zksync] } },
  },
};

export type Chain = (typeof chains)[keyof typeof chains];
export type EvmChain = (typeof evmChains)[keyof typeof evmChains];

export const defaultChain: Chain = chains.Ethereum;
