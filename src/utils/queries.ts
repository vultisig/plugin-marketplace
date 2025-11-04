import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Address, createPublicClient, erc20Abi, http } from "viem";

import {
  getJupiterToken,
  getJupiterTokens,
  getOneInchTokens,
} from "@/utils/api";
import { Chain, EvmChain, evmChainInfo } from "@/utils/chain";
import { Token } from "@/utils/types";

export const useTokenData = ({ chain, id }: Partial<Token>) => {
  const queryClient = useQueryClient();

  return useQuery(
    {
      enabled: false,
      queryKey: ["assets", chain?.toLowerCase(), id?.toLowerCase()],
      queryFn: async () => {
        if (!chain || !id) {
          return;
        } else if (evmChainInfo[chain as EvmChain]) {
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
    },
    queryClient
  );
};

export const useTokenList = (chain?: Chain) => {
  const queryClient = useQueryClient();

  return useQuery(
    {
      enabled: false,
      queryKey: ["assets", chain?.toLowerCase()],
      queryFn: async () => {
        if (chain === "Solana") {
          return await getJupiterTokens();
        } else if (evmChainInfo[chain as EvmChain]) {
          return await getOneInchTokens(chain as EvmChain);
        } else {
          return [];
        }
      },
      staleTime: Infinity,
    },
    queryClient
  );
};
