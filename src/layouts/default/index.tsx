import { Avatar, Dropdown, MenuProps, message } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "styled-components";

import { CurrencyModal } from "@/components/CurrencyModal";
import { LanguageModal } from "@/components/LanguageModal";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { useApp } from "@/hooks/useApp";
import { BoxIcon } from "@/icons/BoxIcon";
import { CircleDollarSignIcon } from "@/icons/CircleDollarSignIcon";
import { HistoryIcon } from "@/icons/HistoryIcon";
import { LanguagesIcon } from "@/icons/LanguagesIcon";
import { LogOutIcon } from "@/icons/LogOutIcon";
import { MoonIcon } from "@/icons/MoonIcon";
import { SunIcon } from "@/icons/SunIcon";
import { VultisigLogoIcon } from "@/icons/VultisigLogoIcon";
import { Button } from "@/toolkits/Button";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants/core";
import { languageNames } from "@/utils/constants/language";
import { routeTree } from "@/utils/constants/routes";
import { getAccount } from "@/utils/services/extension";
import { useMediaQuery } from "react-responsive";
import { GlobalStyle } from "@/components/GlobalStyle";

export const DefaultLayout = () => {
  const { t } = useTranslation();
  const {
    address,
    connect,
    currency,
    disconnect,
    isConnected,
    language,
    setTheme,
    theme,
  } = useApp();
  const [messageApi, messageHolder] = message.useMessage();
  const navigate = useNavigate();
  const colors = useTheme();
  const isNotSupport = useMediaQuery({ query: "(max-width: 767px)" });

  const dropdownMenu: MenuProps["items"] = [
    {
      icon: <LanguagesIcon />,
      key: "1",
      label: (
        <HStack
          $style={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <span>{t("language")}</span>
          <span>{languageNames[language]}</span>
        </HStack>
      ),
      onClick: () => {
        navigate(modalHash.language, { state: true });
      },
    },
    {
      icon: <CircleDollarSignIcon />,
      key: "2",
      label: (
        <HStack
          $style={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <span>{t("currency")}</span>
          <span>{currency.toUpperCase()}</span>
        </HStack>
      ),
      onClick: () => {
        navigate(modalHash.currency, { state: true });
      },
    },
    {
      icon: theme === "light" ? <MoonIcon /> : <SunIcon />,
      key: "3",
      label: `Theme: ${theme === "light" ? "Dark" : "Light"}`,
      onClick: () => {
        setTheme(theme === "light" ? "dark" : "light");
      },
    },
    {
      disabled: true,
      icon: <HistoryIcon />,
      key: "4",
      label: "Transaction history",
      onClick: () => {
        navigate(routeTree.transactions.path, { state: true });
      },
    },
    {
      danger: true,
      icon: <LogOutIcon />,
      key: "5",
      label: "Disconnect",
      onClick: disconnect,
    },
  ];

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);

      messageApi.success("Address copied to clipboard!");
    } else {
      messageApi.error("No address to copy.");
    }
  };

  useEffect(() => {
    if (!isNotSupport) {
      setTimeout(() => {
        getAccount().then((account) => {
          if (account) connect();
        });
      }, 200);
    }
  }, [connect, isNotSupport]);

  return isNotSupport ? (
    <Stack
      $style={{
        backgroundImage: "url(/images/not-support.jpg)",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        bottom: "0",
        left: "0",
        position: "fixed",
        right: "0",
        top: "0",
      }}
    />
  ) : (
    <>
      <GlobalStyle />

      <VStack $style={{ minHeight: "100%" }}>
        <HStack
          $style={{
            alignItems: "center",
            backgroundColor: colors.bgPrimary.toHex(),
            borderBottomColor: colors.borderLight.toHex(),
            borderBottomStyle: "solid",
            borderBottomWidth: "1px",
            justifyContent: "center",
            height: "72px",
            position: "sticky",
            top: "0",
            zIndex: "2",
          }}
        >
          <HStack
            $style={{
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "1200px",
              padding: "0 16px",
              width: "100%",
            }}
          >
            <HStack
              as={Link}
              state={true}
              to={routeTree.root.path}
              $style={{
                alignItems: "center",
                color: colors.textPrimary.toHex(),
                gap: "10px",
              }}
              $hover={{ color: colors.textSecondary.toHex() }}
            >
              <HStack $style={{ position: "relative" }}>
                <BoxIcon color={colors.accentThree.toHex()} fontSize={40} />
                <Stack
                  as={VultisigLogoIcon}
                  color={colors.bgSecondary.toHex()}
                  fontSize={24}
                  $style={{
                    left: "50%",
                    position: "absolute",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </HStack>
              <Stack
                $style={{
                  fontSize: "22px",
                  fontWeight: "500",
                  lineHeight: "40px",
                }}
              >
                App Store
              </Stack>
            </HStack>
            <HStack
              $style={{ fontWeight: "500", gap: "48px", lineHeight: "20px" }}
            >
              <Stack
                as={Link}
                to={routeTree.apps.path}
                $hover={{ color: colors.accentThree.toHex() }}
              >
                Marketplace
              </Stack>
              {isConnected && (
                <Stack
                  as={Link}
                  to={routeTree.apps.path}
                  $hover={{ color: colors.accentThree.toHex() }}
                >
                  My Apps
                </Stack>
              )}
              <Stack
                as={Link}
                to={routeTree.faq.path}
                $hover={{ color: colors.accentThree.toHex() }}
              >
                FAQ
              </Stack>
            </HStack>
            {isConnected && address ? (
              <HStack $style={{ alignItems: "center", gap: "20px" }}>
                <Button kind="primary" onClick={copyAddress}>
                  <MiddleTruncate $style={{ width: "118px" }}>
                    {address}
                  </MiddleTruncate>
                </Button>
                <Dropdown
                  menu={{ items: dropdownMenu }}
                  overlayStyle={{ width: 302 }}
                >
                  <Avatar src="/images/avatar.png" size={44} />
                </Dropdown>
              </HStack>
            ) : (
              <Button kind="primary" onClick={connect}>
                Connect Wallet
              </Button>
            )}
          </HStack>
        </HStack>
        <Outlet />

        {isConnected && (
          <>
            <CurrencyModal />
            <LanguageModal />
          </>
        )}
        {messageHolder}
      </VStack>
    </>
  );
};
