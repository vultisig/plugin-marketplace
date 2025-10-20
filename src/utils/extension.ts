import { reshareVault } from "@/utils/marketplace";
import { ReshareForm, Vault } from "@/utils/types";
import { decodeTssPayload, decompressQrPayload } from "@/utils/vultisigProto";

const isAvailable = async () => {
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
    throw new Error("Connection failed");
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

export const startReshareSession = async (pluginId: string) => {
  await isAvailable();

  try {
    const response = await window.vultisig.plugin.request({
      method: "reshare_sign",
      params: [{ id: pluginId }],
    });
    console.log("response", response);
    // Example response: vultisig://vultisig.com?type=NewVault&tssType=Reshare&jsonData=...
    const url = new URL(response);
    console.log("url", url);
    const jsonData = url.searchParams.get("jsonData");
    // const tssType = url.searchParams.get("tssType");
    // console.log("jsonData", jsonData);
    if (!jsonData) throw new Error("jsonData param missing in deeplink");
    // Decompress the payload
    const payload = await decompressQrPayload(jsonData);

    // Decode the binary using the schema and forward to verifier backend
    const reshareMsg: any = decodeTssPayload(payload);

    // Transform the payload to match backend ReshareRequest structure
    const backendPayload: ReshareForm = {
      email: "", // Not provided by extension, using empty string
      hexChainCode: reshareMsg.hexChainCode,
      hexEncryptionKey: reshareMsg.encryptionKeyHex,
      localPartyId: reshareMsg.serviceName,
      name: reshareMsg.vaultName,
      oldParties: reshareMsg.oldParties,
      pluginId, // Use the pluginId parameter passed to function
      publicKey: reshareMsg.publicKeyEcdsa,
      sessionId: reshareMsg.sessionId,
    };

    console.log("Transformed payload for backend:", backendPayload);

    try {
      await reshareVault(backendPayload);
    } catch (err) {
      console.error("Failed to call reshare endpoint", err);
    }

    return backendPayload;
  } catch (error) {
    console.error("Failed to process reshare session", error);

    throw new Error("Failed to process reshare session");
  }
};

export const personalSign = async (
  address: string,
  message: string,
  type: "connect" | "policy"
) => {
  await isAvailable();

  const signature = await window.vultisig.plugin.request({
    method: "personal_sign",
    params: [message, address, type],
  });

  if (signature?.error) throw new Error(signature.error);

  return signature as string;
};
