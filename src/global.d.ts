import { Vault } from "@/utils/types";

interface VultisigRequestParams {
  method: string;
  params?: unknown[];
}

interface VultisigChainProvider {
  request: (params: VultisigRequestParams) => Promise<string[]>;
}

interface VultisigPluginProvider {
  request: <T = unknown>(params: VultisigRequestParams) => Promise<T>;
}

interface VultisigProvider {
  ethereum: VultisigChainProvider;
  bitcoin: VultisigChainProvider;
  solana: VultisigChainProvider;
  ripple: VultisigChainProvider;
  zcash: VultisigChainProvider;
  plugin: VultisigPluginProvider;
  getVault: () => Promise<Vault>;
}

declare global {
  interface Window {
    vultisig: VultisigProvider;
  }
}

export {};
