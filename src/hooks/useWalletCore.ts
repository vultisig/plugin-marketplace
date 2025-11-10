import { initWasm, WalletCore } from "@trustwallet/wallet-core";
import { useEffect, useState } from "react";

import { Chain } from "@/utils/chain";
import { match } from "@/utils/functions";

export const useWalletCore = () => {
  const [walletCore, setWalletCore] = useState<WalletCore | null>(null);

  const getTokenType = (chain: Chain) => {
    if (!walletCore) return;

    return match(chain, {
      Arbitrum: () => walletCore.CoinType.arbitrum,
      Avalanche: () => walletCore.CoinType.avalancheCChain,
      Base: () => walletCore.CoinType.base,
      BSC: () => walletCore.CoinType.smartChain,
      Bitcoin: () => walletCore.CoinType.bitcoin,
      Blast: () => walletCore.CoinType.blast,
      Ethereum: () => walletCore.CoinType.ethereum,
      Optimism: () => walletCore.CoinType.optimism,
      Polygon: () => walletCore.CoinType.polygon,
      Ripple: () => walletCore.CoinType.xrp,
      Solana: () => walletCore.CoinType.solana,
    });
  };

  const isValidAddress = (chain: Chain, address: string) => {
    const coinType = getTokenType(chain);

    if (!walletCore || !coinType) return false;

    return walletCore.AnyAddress.isValid(address, coinType);
  };

  useEffect(() => {
    let cancelled = false;

    initWasm().then((walletCore) => {
      if (cancelled) return;

      setWalletCore(walletCore);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { getTokenType, isValidAddress };
};
