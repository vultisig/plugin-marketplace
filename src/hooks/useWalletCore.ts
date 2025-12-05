import { initWasm, WalletCore } from "@trustwallet/wallet-core";
import { useEffect, useState } from "react";

import { Chain, chains } from "@/utils/chain";
import { match } from "@/utils/functions";

export const useWalletCore = () => {
  const [walletCore, setWalletCore] = useState<WalletCore | null>(null);

  const getTokenType = (chain: Chain) => {
    if (!walletCore) return;

    const { CoinType } = walletCore;

    return match(chain, {
      [chains.Akash]: () => CoinType.akash,
      [chains.Arbitrum]: () => CoinType.arbitrum,
      [chains.Avalanche]: () => CoinType.avalancheCChain,
      [chains.Base]: () => CoinType.base,
      [chains.Bitcoin]: () => CoinType.bitcoin,
      [chains.BitcoinCash]: () => CoinType.bitcoinCash,
      [chains.Blast]: () => CoinType.blast,
      [chains.BSC]: () => CoinType.smartChain,
      [chains.Cardano]: () => CoinType.cardano,
      [chains.Cosmos]: () => CoinType.cosmos,
      [chains.CronosChain]: () => CoinType.cronosChain,
      [chains.Dash]: () => CoinType.dash,
      [chains.Dogecoin]: () => CoinType.dogecoin,
      [chains.Dydx]: () => CoinType.dydx,
      [chains.Ethereum]: () => CoinType.ethereum,
      [chains.Hyperliquid]: () => CoinType.ethereum,
      [chains.Kujira]: () => CoinType.kujira,
      [chains.Litecoin]: () => CoinType.litecoin,
      [chains.Mantle]: () => CoinType.mantle,
      [chains.MayaChain]: () => CoinType.thorchain,
      [chains.Noble]: () => CoinType.noble,
      [chains.Optimism]: () => CoinType.optimism,
      [chains.Osmosis]: () => CoinType.osmosis,
      [chains.Polkadot]: () => CoinType.polkadot,
      [chains.Polygon]: () => CoinType.polygon,
      [chains.Ripple]: () => CoinType.xrp,
      [chains.Solana]: () => CoinType.solana,
      [chains.Sei]: () => CoinType.ethereum,
      [chains.Sui]: () => CoinType.sui,
      [chains.Terra]: () => CoinType.terraV2,
      [chains.TerraClassic]: () => CoinType.terra,
      [chains.THORChain]: () => CoinType.thorchain,
      [chains.Ton]: () => CoinType.ton,
      [chains.Tron]: () => CoinType.tron,
      [chains.Zcash]: () => CoinType.zcash,
      [chains.Zksync]: () => CoinType.zksync,
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
