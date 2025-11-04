import { useEffect, useMemo, useState } from "react";

import { useWalletCore } from "@/hooks/useWalletCore";
import { Chain } from "@/utils/chain";
import { useTokenData, useTokenList } from "@/utils/queries";
import { Token } from "@/utils/types";

type StateProps = {
  chainAssets: Record<Chain, Token[]>;
  chain?: Chain;
  search?: string;
};

export const useChainAssets = () => {
  const [state, setState] = useState<StateProps>({
    chainAssets: {
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
    },
  });
  const { chainAssets, chain, search } = state;
  const { refetch: getTokenData, isFetching: dataLoading } = useTokenData({
    chain,
    id: search,
  });
  const { refetch: getTokenList, isFetching: listLoading } =
    useTokenList(chain);
  const { isValidAddress } = useWalletCore();

  const setChain = (chain: Chain) => {
    setState((prev) => ({ ...prev, chain }));
  };

  const setSearch = (search?: string) => {
    setState((prev) => ({ ...prev, search: search?.trim().toLowerCase() }));
  };

  const assets = useMemo(() => {
    if (!chain) return [];
    if (!search) return chainAssets[chain];

    return chainAssets[chain].filter(({ id, name, ticker }) => {
      return (
        ticker.toLowerCase().includes(search) ||
        name.toLowerCase().includes(search) ||
        id.toLowerCase().includes(search)
      );
    });
  }, [chain, chainAssets, search]);

  useEffect(() => {
    if (
      !chain ||
      !search ||
      assets.length > 0 ||
      !isValidAddress(chain, search)
    )
      return;

    getTokenData().then(({ data }) => {
      if (data) {
        setState((prev) => ({
          ...prev,
          chainAssets: {
            ...prev.chainAssets,
            [chain]: [data, ...prev.chainAssets[chain]],
          },
        }));
      }
    });
  }, [assets, chain, search]);

  useEffect(() => {
    if (chain) {
      getTokenList().then(({ data = [] }) => {
        setState((prev) => ({
          ...prev,
          chainAssets: { ...prev.chainAssets, [chain]: data },
        }));
      });
    }
  }, [chain]);

  return {
    assets,
    chain,
    loading: dataLoading || listLoading,
    search,
    setChain,
    setSearch,
  };
};
