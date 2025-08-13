import { policyToHexMessage } from "utils/functions";
import { reshareVault } from "utils/services/marketplace";
import { PluginPolicy, ReshareForm, Vault } from "utils/types";
import { decodeTssPayload, decompressQrPayload } from "utils/vultisigProto";

export const isAvailable = async () => {
  if (!window.vultisig) throw new Error("Please install Vultisig Extension");

  return;
};

export const connect = async () => {
  await isAvailable();

  try {
    const [account]: string[] = await window.vultisig.ethereum.request({
      method: "eth_requestAccounts",
    });

    return account;
  } catch {
    return undefined;
  }
};

export const disconnect = async () => {
  await isAvailable();

  await window.vultisig.ethereum.request({
    method: "wallet_revokePermissions",
  });
};

export const getAccount = async () => {
  await isAvailable();

  try {
    const [account]: string[] = await window.vultisig.ethereum.request({
      method: "eth_accounts",
    });

    return account;
  } catch {
    return undefined;
  }
};

export const getReshareUrl = async (id: string) => {
  await isAvailable();

  try {
    const url: string = await window.vultisig.plugin.request({
      method: "plugin_request_url",
      params: [{ id }],
    });

    return url;
  } catch {
    return undefined;
  }
};

export const getVault = async () => {
  await isAvailable();

  const vault: Vault = await window.vultisig.getVault();

  if (vault) {
    if (!vault.hexChainCode || !vault.publicKeyEcdsa)
      throw new Error("Missing required vault data");

    return vault;
  } else {
    throw new Error("Vault not found");
  }
};

export const signCustomMessage = async (
  hexMessage: string,
  walletAddress: string
) => {
  await isAvailable();

  const signature = await window.vultisig.ethereum.request({
    method: "personal_sign",
    params: [hexMessage, walletAddress],
  });

  if (signature && signature.error) throw signature.error;

  return signature as string;
};

export const startReshareSession = async (id: string, url: string) => {
  await isAvailable();

  try {
    await window.vultisig.plugin.request({
      method: "pugiln_request_reshare",
      params: [{ id, url }],
    });

    return true;
  } catch {
    return false;
  }
};

export const signPluginPolicy = async ({
  pluginVersion,
  policyVersion,
  publicKey,
  recipe,
}: Pick<
  PluginPolicy,
  "pluginVersion" | "policyVersion" | "publicKey" | "recipe"
>) => {
  await isAvailable();

  const account = await getAccount();

  if (!account) throw new Error("Need to connect to wallet");

  const hexMessage = policyToHexMessage({
    pluginVersion,
    policyVersion,
    publicKey,
    recipe,
  });

  return await signCustomMessage(hexMessage, account);
};
