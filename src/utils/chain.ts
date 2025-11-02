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

export const evmChains = [
  "Arbitrum",
  "Avalanche",
  "Base",
  "Blast",
  "BSC",
  "Ethereum",
  "Optimism",
  "Polygon",
] as const;

export const evmChainIds: Record<EvmChain, number> = {
  Arbitrum: arbitrum.id,
  Avalanche: avalanche.id,
  Base: base.id,
  Blast: blast.id,
  BSC: bsc.id,
  Ethereum: mainnet.id,
  Optimism: optimism.id,
  Polygon: polygon.id,
};

export const chains = [...evmChains, "Bitcoin", "Ripple", "Solana"] as const;

export type Chain = (typeof chains)[number];
export type EvmChain = (typeof evmChains)[number];

export const defaultChain: Chain = "Ethereum";
