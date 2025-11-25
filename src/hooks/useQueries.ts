import { useQueryClient } from "@tanstack/react-query";
import { Address, createPublicClient, erc20Abi, http } from "viem";

import {
  getApp,
  getJupiterToken,
  getJupiterTokens,
  getOneInchTokens,
} from "@/utils/api";
import { Chain, EvmChain, evmChainInfo, evmChains } from "@/utils/chain";
import { Token } from "@/utils/types";

export const useQueries = () => {
  const queryClient = useQueryClient();

  const getAppData = async (id: string) => {
    return await queryClient.fetchQuery({
      queryKey: ["app", id.toLowerCase()],
      queryFn: async () => await getApp(id),
      staleTime: Infinity,
    });
  };

  const getTokenData = async (chain: Chain, id: string) => {
    return await queryClient.fetchQuery({
      queryKey: ["assets", chain.toLowerCase(), id.toLowerCase()],
      queryFn: async () => {
        if (chain in evmChains) {
          const client = createPublicClient({
            chain: evmChainInfo[chain as EvmChain],
            transport: http(),
          });

          const [decimals, name, ticker] = await Promise.all([
            client.readContract({
              address: id as Address,
              abi: erc20Abi,
              functionName: "decimals",
            }),
            client.readContract({
              address: id as Address,
              abi: erc20Abi,
              functionName: "name",
            }),
            client.readContract({
              address: id as Address,
              abi: erc20Abi,
              functionName: "symbol",
            }),
          ]);

          const token: Token = {
            chain,
            decimals,
            id,
            logo: "",
            name,
            ticker,
          };

          return token;
        } else if (chain === "Solana") {
          return await getJupiterToken(id);
        } else {
          return;
        }
      },
      staleTime: Infinity,
    });
  };

  const getTokenList = async (chain: Chain) => {
    return await queryClient.fetchQuery({
      queryKey: ["assets", chain.toLowerCase()],
      queryFn: async () => {
        if (chain === "Solana") {
          return await getJupiterTokens();
        } else if (chain in evmChains) {
          return await getOneInchTokens(chain as EvmChain);
        } else {
          return [];
        }
      },
      staleTime: Infinity,
    });
  };

  return { getAppData, getTokenData, getTokenList };
};
