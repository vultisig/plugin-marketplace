import { message as Message, Modal } from "antd";
import { hexlify, randomBytes } from "ethers";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CoreContext, CoreContextProps } from "@/context/Core";
import { i18nInstance } from "@/i18n/config";
import { getChain, setChain as setChainStorage } from "@/storage/chain";
import { storageKeys } from "@/storage/constants";
import {
  getCurrency,
  setCurrency as setCurrencyStorage,
} from "@/storage/currency";
import { useLocalStorageWatcher } from "@/storage/hooks/useLocalStorageWatcher";
import {
  getLanguage,
  setLanguage as setLanguageStorage,
} from "@/storage/language";
import { getTheme, setTheme as setThemeStorage } from "@/storage/theme";
import { delToken, getToken, setToken } from "@/storage/token";
import { delVaultId, getVaultId, setVaultId } from "@/storage/vaultId";
import { getAuthToken, getBaseValue } from "@/utils/api";
import { Chain } from "@/utils/chain";
import { Currency } from "@/utils/currency";
import {
  connect as connectToExtension,
  disconnect as disconnectFromExtension,
  getVault,
  personalSign,
} from "@/utils/extension";
import { Language } from "@/utils/language";
import { Theme } from "@/utils/theme";

type StateProps = Pick<
  CoreContextProps,
  | "address"
  | "baseValue"
  | "chain"
  | "currency"
  | "isConnected"
  | "language"
  | "theme"
  | "vault"
>;

export const CoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({
    baseValue: 1,
    chain: getChain(),
    currency: getCurrency(),
    isConnected: false,
    language: getLanguage(),
    theme: getTheme(),
  });
  const {
    address,
    baseValue,
    chain,
    currency,
    isConnected,
    language,
    theme,
    vault,
  } = state;
  const [messageAPI, messageHolder] = Message.useMessage();
  const [modalAPI, modalHolder] = Modal.useModal();

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

                    messageAPI.success(t("successfulAuthenticated"));
                  })
              );
            }
          })
          .catch((error: Error) => {
            if (error?.message) messageAPI.error(error?.message);
            clear();
          });
      })
      .catch((error: Error) => {
        if (error?.message) messageAPI.error(error?.message);
      });
  }, [clear, messageAPI, t]);

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

  const setChain = (chain: Chain, fromStorage?: boolean) => {
    if (!fromStorage) setChainStorage(chain);

    setState((prevState) => ({ ...prevState, chain }));
  };

  const setCurrency = (currency: Currency, fromStorage?: boolean) => {
    if (!fromStorage) setCurrencyStorage(currency);

    setState((prevState) => ({ ...prevState, currency }));
  };

  const setLanguage = (language: Language, fromStorage?: boolean) => {
    if (!fromStorage) setLanguageStorage(language);

    i18nInstance.changeLanguage(language);

    setState((prevState) => ({ ...prevState, language }));
  };

  const setTheme = (theme: Theme, fromStorage?: boolean) => {
    if (!fromStorage) setThemeStorage(theme);

    setState((prevState) => ({ ...prevState, theme }));
  };

  useLocalStorageWatcher(storageKeys.chain, () => {
    setChain(getChain(), true);
  });

  useLocalStorageWatcher(storageKeys.currency, () => {
    setCurrency(getCurrency(), true);
  });

  useLocalStorageWatcher(storageKeys.language, () => {
    setLanguage(getLanguage(), true);
  });

  useLocalStorageWatcher(storageKeys.theme, () => {
    setTheme(getTheme(), true);
  });

  useEffect(() => {
    getBaseValue(currency).then((baseValue) => {
      setState((prevState) => ({ ...prevState, baseValue }));
    });
  }, [currency]);

  return (
    <CoreContext.Provider
      value={{
        address,
        baseValue,
        chain,
        connect,
        currency,
        disconnect,
        isConnected,
        language,
        setChain,
        setCurrency,
        setLanguage,
        setTheme,
        theme,
        vault,
      }}
    >
      {children}
      {messageHolder}
      {modalHolder}
    </CoreContext.Provider>
  );
};
