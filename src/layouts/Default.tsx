import { Dropdown, MenuProps } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { createGlobalStyle, useTheme } from "styled-components";

import { CurrencyModal } from "@/components/CurrencyModal";
import { LanguageModal } from "@/components/LanguageModal";
import { useCore } from "@/hooks/useCore";
import { ArrowBoxLeftIcon } from "@/icons/ArrowBoxLeftIcon";
import { ArrowBoxRightIcon } from "@/icons/ArrowBoxRightIcon";
import { BoxIcon } from "@/icons/BoxIcon";
import { CreditCardIcon } from "@/icons/CreditCardIcon";
import { DollarIcon } from "@/icons/DollarIcon";
import { DotGridVerticalIcon } from "@/icons/DotGridVerticalIcon";
import { HistoryIcon } from "@/icons/HistoryIcon";
import { MacbookIcon } from "@/icons/MacbookIcon";
import { MoonIcon } from "@/icons/MoonIcon";
import { SunIcon } from "@/icons/SunIcon";
import { TranslateIcon } from "@/icons/TranslateIcon";
import { VultisigLogoIcon } from "@/icons/VultisigLogoIcon";
import { ZapIcon } from "@/icons/ZapIcon";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants";
import { getAccount } from "@/utils/extension";
import { languageNames } from "@/utils/language";
import { routeTree } from "@/utils/routes";

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ theme }) => theme.bgPrimary.toHex()};
    color: ${({ theme }) => theme.textPrimary.toHex()};
  }
`;

export const DefaultLayout = () => {
  const { t } = useTranslation();
  const {
    connect,
    currency,
    disconnect,
    isConnected,
    language,
    setTheme,
    theme,
    vault,
  } = useCore();
  const navigate = useNavigate();
  const colors = useTheme();
  const isNotSupport = useMediaQuery({ query: "(max-width: 991px)" });

  const dropdownMenu: MenuProps["items"] = [
    ...(isConnected
      ? [
          {
            icon: <CreditCardIcon />,
            key: "1",
            label: t("billing"),
            onClick: () => {
              navigate(routeTree.billing.path, { state: true });
            },
          },
          {
            icon: <HistoryIcon />,
            key: "2",
            label: t("transactionHistory"),
            onClick: () => {
              navigate(routeTree.transactions.path, { state: true });
            },
          },
        ]
      : []),
    {
      icon: <TranslateIcon />,
      key: "3",
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
      icon: <DollarIcon />,
      key: "4",
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
      key: "5",
      label: (
        <HStack
          $style={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <span>{t("theme")}</span>
          <span>{theme === "light" ? t("dark") : t("light")}</span>
        </HStack>
      ),
      onClick: () => {
        setTheme(theme === "light" ? "dark" : "light");
      },
    },
    ...(isConnected
      ? [
          {
            icon: <ArrowBoxLeftIcon color={colors.accentFour.toHex()} />,
            key: "6",
            label: t("signOut"),
            onClick: disconnect,
          },
        ]
      : [
          {
            icon: <ArrowBoxRightIcon color={colors.accentFour.toHex()} />,
            key: "7",
            label: t("connectVault"),
            onClick: connect,
          },
        ]),
  ];

  useEffect(() => {
    if (isNotSupport) return;

    const timeoutId = setTimeout(() => {
      getAccount("Ethereum").then((account) => {
        if (account) connect();
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [connect, isNotSupport]);

  return isNotSupport ? (
    <VStack
      $style={{
        alignItems: "center",
        backgroundImage: "url(/images/not-support.jpg)",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        bottom: "0",
        color: colors.neutral50.toHex(),
        gap: "16px",
        justifyContent: "center",
        left: "0",
        position: "fixed",
        right: "0",
        top: "0",
      }}
    >
      <MacbookIcon fontSize={32} />
      <Stack
        as="span"
        $style={{
          fontSize: "22px",
          lineHeight: "24px",
          opacity: "0.9",
          textAlign: "center",
          width: "264px",
        }}
      >
        {t("unsupportedMedia")}
      </Stack>
    </VStack>
  ) : (
    <>
      <GlobalStyle />

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
            <Stack $style={{ fontSize: "22px", lineHeight: "40px" }}>
              {t("appStore")}
            </Stack>
          </HStack>
          <HStack $style={{ gap: "48px", lineHeight: "20px" }}>
            <Stack
              as={Link}
              to={routeTree.root.path}
              $hover={{ color: colors.accentThree.toHex() }}
            >
              {t("apps")}
            </Stack>
            {isConnected && (
              <Stack
                as={Link}
                to={routeTree.myApps.path}
                $hover={{ color: colors.accentThree.toHex() }}
              >
                {t("myApps")}
              </Stack>
            )}
            <Stack
              as={Link}
              to={routeTree.faq.path}
              $hover={{ color: colors.accentThree.toHex() }}
            >
              {t("faq")}
            </Stack>
          </HStack>
          <Dropdown
            menu={{ items: dropdownMenu }}
            placement="bottomRight"
            styles={{ root: { width: 302 } }}
          >
            <HStack
              $style={{
                alignItems: "center",
                backgroundColor: colors.bgTertiary.toHex(),
                border: `solid 1px ${colors.borderLight.toHex()}`,
                borderRadius: "8px",
                cursor: "pointer",
                gap: "8px",
                height: "32px",
                justifyContent: "center",
                overflow: "hidden",
                paddingRight: "12px",
              }}
            >
              <Stack
                as={ZapIcon}
                $style={{
                  backgroundColor: colors.bgPrimary.toHex(),
                  border: `solid 1px ${colors.borderLight.toHex()}`,
                  borderRadius: "50%",
                  color: colors.warning.toHex(),
                  fill: "currentcolor",
                  fontSize: "40px",
                  marginLeft: "-4px",
                  padding: "12px",
                }}
              />
              <Stack
                $style={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "110px",
                }}
              >
                {vault?.name || t("connectVault")}
              </Stack>

              <DotGridVerticalIcon />
            </HStack>
          </Dropdown>
        </HStack>
      </HStack>

      <Outlet />
      <CurrencyModal />
      <LanguageModal />
    </>
  );
};
