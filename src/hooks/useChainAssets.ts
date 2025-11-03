import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getJupiterTokens, getOneInchTokens } from "@/utils/api";
import { Chain, EvmChain, evmChains } from "@/utils/chain";
import { Token } from "@/utils/types";

export const useChainAssets = () => {
  const [chainAssets, setChainAssets] = useState<Record<Chain, Token[]>>({
    Arbitrum: [],
    Avalanche: [],
    Base: [],
    Blast: [],
    BSC: [],
    Ethereum: [],
    Optimism: [],
    Polygon: [],
    Bitcoin: [],
    Ripple: [],
    Solana: [],
  });
  const [chain, setChain] = useState<Chain | null>(null);

  const {
    data,
    refetch,
    isFetching: loading,
    isSuccess,
  } = useQuery({
    enabled: false,
    queryKey: ["assets", chain],
    queryFn: async () => {
      if (chain === "Solana") {
        return await getJupiterTokens();
      } else if (evmChains.includes(chain as EvmChain)) {
        return await getOneInchTokens(chain as EvmChain);
      } else {
        return [];
      }
    },
  });

  useEffect(() => {
    if (chain && data && isSuccess) {
      setChainAssets((prev) => ({ ...prev, [chain]: data }));
    }
  }, [chain, isSuccess, data]);

  useEffect(() => {
    if (chain) refetch();
  }, [chain]);

  return {
    assets: chain ? chainAssets[chain] : [],
    chain,
    loading,
    setChain,
  };
};
