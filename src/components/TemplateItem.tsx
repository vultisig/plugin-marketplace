import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { TokenImage } from "@/components/TokenImage";
import { ChevronRightIcon } from "@/icons/ChevronRightIcon";
import { PencilLineIcon } from "@/icons/PencilLineIcon";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { Chain, chains, tickers } from "@/utils/chain";

type TemplateItemProps = {
  onEdit: () => void;
  onUse: () => void;
};

export const TemplateItem: FC<TemplateItemProps> = ({ onEdit, onUse }) => {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <VStack
      $style={{
        backgroundColor: colors.bgSecondary.toHex(),
        borderRadius: "12px",
        gap: "12px",
        padding: "12px",
      }}
    >
      <HStack $style={{ gap: "12px", position: "relative" }}>
        <ChainItem chain={chains.Ethereum} />
        <ChainItem chain={chains.Bitcoin} />
        <VStack
          $style={{
            backgroundColor: colors.bgSecondary.toHex(),
            borderColor: colors.borderLight.toHex(),
            borderRadius: "50%",
            borderStyle: "solid",
            borderWidth: "1px",
            fontSize: "12px",
            left: "50%",
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
            padding: "8px",
          }}
          $before={{
            backgroundColor: colors.bgSecondary.toHex(),
            inset: "-2px 0",
            left: "50%",
            position: "absolute",
            transform: "translateX(-50%)",
            width: "12px",
            zIndex: -1,
          }}
        >
          <VStack
            as={ChevronRightIcon}
            $style={{
              backgroundColor: colors.bgSecondary.toHex(),
              borderRadius: "50%",
              color: colors.buttonDisabledText.toHex(),
              fontSize: "24px",
              padding: "4px",
            }}
          />
        </VStack>
      </HStack>
      <VStack
        $style={{
          borderColor: colors.borderLight.toHex(),
          borderRadius: "16px",
          borderStyle: "solid",
          borderWidth: "1px",
        }}
      >
        <HStack $style={{ justifyContent: "space-between", padding: "12px" }}>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {t("frequency")}
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            Weekly
          </Stack>
        </HStack>
        <Divider light />
        <HStack $style={{ justifyContent: "space-between", padding: "12px" }}>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {t("amount")}
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            1000 USDC
          </Stack>
        </HStack>
      </VStack>
      <HStack $style={{ gap: "8px" }}>
        <VStack
          as="span"
          onClick={onUse}
          $style={{
            alignItems: "center",
            backgroundColor: colors.buttonPrimary.toHex(),
            borderRadius: "20px",
            color: colors.buttonTextLight.toHex(),
            cursor: "pointer",
            flexGrow: "1",
            fontSize: "12px",
            height: "40px",
            justifyContent: "center",
          }}
          $hover={{ backgroundColor: colors.buttonPrimaryHover.toHex() }}
        >
          {t("useTemplate")}
        </VStack>
        <VStack
          as="span"
          onClick={onEdit}
          $style={{
            alignItems: "center",
            backgroundColor: colors.bgTertiary.toHex(),
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px",
            height: "40px",
            justifyContent: "center",
            width: "40px",
          }}
          $hover={{ color: colors.accentFour.toHex() }}
        >
          <PencilLineIcon />
        </VStack>
      </HStack>
    </VStack>
  );
};

const ChainItem: FC<{ chain: Chain }> = ({ chain }) => {
  const colors = useTheme();

  return (
    <VStack
      $style={{
        alignItems: "center",
        backgroundColor: colors.bgTertiary.toHex(),
        borderColor: colors.borderLight.toHSL(),
        borderRadius: "16px",
        borderStyle: "solid",
        borderWidth: "1px",
        gap: "8px",
        justifyContent: "center",
        height: "88px",
        width: "100%",
      }}
    >
      <TokenImage
        alt={chain}
        borderRadius="50%"
        height="30px"
        src={`/tokens/${chain.toLowerCase()}.svg`}
        width="30px"
      />
      <Stack as="span">{tickers[chain]}</Stack>
    </VStack>
  );
};
