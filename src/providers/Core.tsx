import { message as Message, Modal } from "antd";
import { hexlify, randomBytes } from "ethers";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";

import { CoreContext, CoreContextProps } from "@/context/Core";
import { useQueries } from "@/hooks/useQueries";
import { storageKeys } from "@/storage/constants";
import {
  getCurrency,
  setCurrency as setCurrencyStorage,
} from "@/storage/currency";
import { useLocalStorageWatcher } from "@/storage/hooks/useLocalStorageWatcher";
import { getTheme, setTheme as setThemeStorage } from "@/storage/theme";
import { delToken, getToken, setToken } from "@/storage/token";
import { delVaultId, getVaultId, setVaultId } from "@/storage/vaultId";
import { getAuthToken, getBaseValue, getFeeAppStatus } from "@/utils/api";
import { feeAppId } from "@/utils/constants";
import { Currency } from "@/utils/currency";
import {
  connect as connectToExtension,
  disconnect as disconnectFromExtension,
  getVault,
  personalSign,
} from "@/utils/extension";
import { Theme } from "@/utils/theme";
import {
  Vultisig,
  MemoryStorage,
  createSdkContext,
} from "@vultisig/sdk";

type StateProps = Pick<
  CoreContextProps,
  | "address"
  | "baseValue"
  | "currency"
  | "feeApp"
  | "feeAppStatus"
  | "isConnected"
  | "theme"
  | "vault"
>;

export const CoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StateProps>({
    baseValue: 1,
    currency: getCurrency(),
    isConnected: false,
    theme: getTheme(),
  });
  const {
    address,
    baseValue,
    currency,
    feeApp,
    feeAppStatus,
    isConnected,
    theme,
    vault,
  } = state;
  const [messageAPI, messageHolder] = Message.useMessage();
  const [modalAPI, modalHolder] = Modal.useModal();
  const { getAppData } = useQueries();

  const clear = useCallback(() => {
    disconnectFromExtension().finally(() => {
      delToken(getVaultId());
      delVaultId();
      setState((prevState) => ({
        ...prevState,
        address: undefined,
        isConnected: false,
        vault: undefined,
      }));
    });
  }, []);

  const connect = useCallback(() => {
    connectToExtension()
      .then((address: string) => {
        getVault()
          .then(async (vault) => {
            const { hexChainCode, publicKeyEcdsa } = vault;
            const token = getToken(publicKeyEcdsa);

            if (token) {
              setVaultId(publicKeyEcdsa);

              setState((prevState) => ({
                ...prevState,
                address,
                isConnected: true,
                vault,
              }));
            } else {
              const nonce = hexlify(randomBytes(16));
              const expiryTime = new Date(
                Date.now() + 15 * 60 * 1000
              ).toISOString();

              const message = JSON.stringify({
                message: "Sign into Vultisig App Store",
                nonce: nonce,
                expiresAt: expiryTime,
                address,
              });

              return personalSign(address, message, "connect").then(
                (signature) =>
                  getAuthToken({
                    chainCodeHex: hexChainCode,
                    publicKey: publicKeyEcdsa,
                    signature,
                    message,
                  }).then((newToken) => {
                    setToken(publicKeyEcdsa, newToken);
                    setVaultId(publicKeyEcdsa);

                    setState((prevState) => ({
                      ...prevState,
                      address,
                      isConnected: true,
                      vault,
                    }));

                    messageAPI.success("Successfully authenticated!");
                  })
              );
            }
          })
          .catch((error: Error) => {
            messageAPI.error(error.message);
            clear();
          });
      })
      .catch((error: Error) => messageAPI.error(error.message));
  }, [clear, messageAPI]);

  const disconnect = () => {
    modalAPI.confirm({
      title: "Are you sure you want to disconnect?",
      okText: "Yes",
      okType: "default",
      cancelText: "No",
      onOk() {
        clear();
      },
    });
  };

  const setCurrency = (currency: Currency, fromStorage?: boolean) => {
    if (!fromStorage) setCurrencyStorage(currency);

    setState((prevState) => ({ ...prevState, currency }));
  };

  const setTheme = (theme: Theme, fromStorage?: boolean) => {
    if (!fromStorage) setThemeStorage(theme);

    setState((prevState) => ({ ...prevState, theme }));
  };

  const updateFeeAppStatus = useCallback(async () => {
    if (!isConnected) return;

    const feeAppStatus = await getFeeAppStatus();

    setState((prevState) => ({ ...prevState, feeAppStatus }));
  }, [isConnected]);

  useLocalStorageWatcher(storageKeys.currency, () => {
    setCurrency(getCurrency(), true);
  });

  useLocalStorageWatcher(storageKeys.theme, () => {
    setTheme(getTheme(), true);
  });

  useEffect(() => {
    updateFeeAppStatus();
  }, [updateFeeAppStatus]);

  useEffect(() => {
    getBaseValue(currency).then((baseValue) =>
      setState((prevState) => ({ ...prevState, baseValue }))
    );
  }, [currency]);

  useEffect(() => {
    const memoryStorage = new MemoryStorage();

    const sdk = new Vultisig({
      storage: memoryStorage,
    });

    // Initialize WASM modules
    sdk
      .initialize()
      .catch((error) => {
        console.error("Failed to initialize SDK:", error);
        // Continue app execution even if SDK initialization fails
      })
      .then(() => {
        console.log(sdk);
        // Create vault with specific public key
        const publicKey = "test-public-key-abc123";
        const vaultData = createMockVaultData("Test Vault", publicKey);
        memoryStorage
          .set(`vault:${vaultData.id}`, vaultData)
          .then(async () => {
            const [vault] = await sdk.listVaults();
            console.log("List of vaults:", vault);
            const address = await vault.address("Ethereum");
            console.log("Address:", address);
            vault.balance("Ethereum").then((balance) => {
              console.log("balance:", balance);
            });
          });
      });

    getAppData(feeAppId)
      .then((feeApp) => setState((prevState) => ({ ...prevState, feeApp })))
      .catch(() => {});
  }, []);

  const createMockVaultData = (name: string, publicKey: string) => {
    return {
      id: "347b60b7fc7f0a0c83aff987a036a57b8ac74ae02c2be33569b8867a550d847d", // ID should match public key
      name: "Fast Vault #1",
      publicKeys: {
        ecdsa:
          "03177d0d3c53b13d7bc11e04dd52d27a2859b9aae498ad0a35309dc1b2038a2481",
        eddsa: `3a6b3e73b7296bb4a3a53d648614f24d56ff8b6fdf8dc991ce46ca0c0d9bba50`,
      },
      hexChainCode:
        "85a64a42350efc5c9d9d8566a1b4fcc2017b3747c7d156c3b4fbdf0f3d333ff3",
      signers: ["Server-1", "Device-1"],
      localPartyId: "Device-1",
      createdAt: Date.now(),
      libType: "GG20" as const,
      isBackedUp: true,
      order: 0,
      isEncrypted: false,
      type: "fast" as const,
      currency: "usd",
      chains: [],
      tokens: {},
      vultFileContent: "",
      lastModified: Date.now(),
    };
  };

  return (
    <CoreContext.Provider
      value={{
        address,
        baseValue,
        connect,
        currency,
        disconnect,
        feeApp,
        feeAppStatus,
        isConnected,
        setCurrency,
        setTheme,
        theme,
        updateFeeAppStatus,
        vault,
      }}
    >
      {children}
      {messageHolder}
      {modalHolder}
    </CoreContext.Provider>
  );
};
