import { initWasm, WalletCore } from "@trustwallet/wallet-core";
import { useEffect, useState } from "react";

import { Chain, chains } from "@/utils/chain";
import { match } from "@/utils/functions";

export const useWalletCore = () => {
  const [walletCore, setWalletCore] = useState<WalletCore | null>(null);

  const getTokenType = (chain: Chain) => {
    if (!walletCore) return;

    return match(chain, {
      [chains.Arbitrum]: () => walletCore.CoinType.arbitrum,
      [chains.Avalanche]: () => walletCore.CoinType.avalancheCChain,
      [chains.Base]: () => walletCore.CoinType.base,
      [chains.BSC]: () => walletCore.CoinType.smartChain,
      [chains.Bitcoin]: () => walletCore.CoinType.bitcoin,
      [chains.Blast]: () => walletCore.CoinType.blast,
      [chains.Ethereum]: () => walletCore.CoinType.ethereum,
      [chains.Optimism]: () => walletCore.CoinType.optimism,
      [chains.Polygon]: () => walletCore.CoinType.polygon,
      [chains.Ripple]: () => walletCore.CoinType.xrp,
      [chains.Solana]: () => walletCore.CoinType.solana,
      [chains.Zcash]: () => walletCore.CoinType.zcash,
    });
  };

  const isValidAddress = (chain: Chain, address: string) => {
    const tokenType = getTokenType(chain);

    if (!walletCore || !tokenType) return false;

    return walletCore.AnyAddress.isValid(address, tokenType);
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
