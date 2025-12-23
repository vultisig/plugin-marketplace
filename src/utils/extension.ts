import { randomBytes } from "crypto";

import { reshareVault } from "@/utils/api";
import { Chain, evmChains } from "@/utils/chain";
import { Vault } from "@/utils/types";

const isAvailable = async () => {
  if (!window.vultisig) throw new Error("Please install Vultisig Extension");

  return;
};

export const connect = async () => {
  await isAvailable();

  try {
    const [account]: string[] = await window.vultisig.ethereum.request({
      method: "eth_requestAccounts",
      params: [{ preselectFastVault: true }],
    });

    return account;
  } catch {
    throw new Error("Connection failed");
  }
};

export const disconnect = async () => {
  await isAvailable();

  await window.vultisig.ethereum.request({
    method: "wallet_revokePermissions",
  });
};

export const getAccount = async (chain: Chain) => {
  await isAvailable();

  if (chain in evmChains) {
    try {
      const [account]: string[] = await window.vultisig.ethereum.request({
        method: "eth_accounts",
      });
      return account;
    } catch {
      return undefined;
    }
  } else {
    const method = "get_accounts";

    switch (chain) {
      case "Bitcoin": {
        try {
          const [account]: string[] = await window.vultisig.bitcoin.request({
            method,
          });
          return account;
        } catch {
          return undefined;
        }
      }
      case "Solana": {
        try {
          const [account]: string[] = await window.vultisig.solana.request({
            method,
          });
          return account;
        } catch {
          return undefined;
        }
      }
      case "Ripple": {
        try {
          const [account]: string[] = await window.vultisig.ripple.request({
            method,
          });
          return account;
        } catch {
          return undefined;
        }
      }
      case "Zcash": {
        try {
          const [account]: string[] = await window.vultisig.zcash.request({
            method,
          });
          return account;
        } catch {
          return undefined;
        }
      }
      default: {
        return undefined;
      }
    }
  }
};

export const getVault = async () => {
  await isAvailable();

  const vault: Vault = await window.vultisig.getVault();

  if (vault) {
    if (!vault.hexChainCode || !vault.publicKeyEcdsa)
      throw new Error("Missing required vault data");

    if (!vault.isFastVault)
      throw new Error("Only Fast Vaults can connect to the App Store");

    return vault;
  } else {
    throw new Error("Vault not found");
  }
};

export const personalSign = async (
  address: string,
  message: string,
  type: "connect" | "policy",
  pluginId?: string
) => {
  await isAvailable();

  const signature = await window.vultisig.plugin.request<
    string | { error?: string }
  >({
    method: "personal_sign",
    params: [message, address, type, ...(pluginId ? [pluginId] : [])],
  });

  if (typeof signature === "object" && signature?.error)
    throw new Error(signature.error);

  return signature as string;
};

export const startReshareSession = async (pluginId: string) => {
  await isAvailable();

  try {
    const vault = await getVault();

    const dAppSessionId = crypto.randomUUID();
    const encryptionKeyHex = randomBytes(32).toString("hex");

    await reshareVault({
      email: "", // Not provided by extension, using empty string
      hexChainCode: vault.hexChainCode,
      hexEncryptionKey: encryptionKeyHex,
      localPartyId: vault.localPartyId,
      name: vault.name,
      oldParties: vault.parties,
      pluginId, // Use the pluginId parameter passed to function
      publicKey: vault.publicKeyEcdsa,
      sessionId: dAppSessionId,
    });

    const { success } = await window.vultisig.plugin.request<{
      success: boolean;
    }>({
      method: "reshare_sign",
      params: [{ id: pluginId, dAppSessionId, encryptionKeyHex }],
    });

    // Example response: vultisig://vultisig.com?type=NewVault&tssType=Reshare&jsonData=...

    // Transform the payload to match backend ReshareRequest structure

    return success;
  } catch {
    return false;
  }
};
