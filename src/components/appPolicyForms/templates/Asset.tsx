import { JsonObject } from "@bufbuild/protobuf";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { TokenImage } from "@/components/TokenImage";
import { useQueries } from "@/hooks/useQueries";
import { ChevronRightIcon } from "@/icons/ChevronRightIcon";
import { PencilLineIcon } from "@/icons/PencilLineIcon";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { Chain, nativeTokens, tickers } from "@/utils/chain";
import { getAccount } from "@/utils/extension";
import { camelCaseToTitle } from "@/utils/functions";
import { Token } from "@/utils/types";

type AssetProps = {
  address: string;
  chain: Chain;
  decimals: number;
  token: string;
};

type DataProps = {
  endDate: number;
  frequency: string;
  from: AssetProps;
  fromAmount: string;
  to: AssetProps;
};

type AssetTemplateProps = {
  defaultValues: JsonObject;
  onSelect: (data: JsonObject, edit?: boolean) => void;
};

export const AssetTemplate: FC<AssetTemplateProps> = ({
  defaultValues,
  onSelect,
}) => {
  const [data, setData] = useState<DataProps>(defaultValues as DataProps);
  const { frequency, from, fromAmount, to } = data;
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
        <AssetItem
          asset={from}
          setAsset={(asset) => setData((prev) => ({ ...prev, from: asset }))}
        />
        <AssetItem
          asset={to}
          setAsset={(asset) => setData((prev) => ({ ...prev, to: asset }))}
        />
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
            {camelCaseToTitle(frequency)}
          </Stack>
        </HStack>
        <Divider light />
        <HStack $style={{ justifyContent: "space-between", padding: "12px" }}>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {t("amount")}
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {fromAmount} {tickers[from.chain]}
          </Stack>
        </HStack>
      </VStack>
      <HStack $style={{ gap: "8px" }}>
        <VStack
          as="span"
          onClick={() => onSelect(data)}
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
          onClick={() => onSelect(data, true)}
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

const AssetItem: FC<{
  asset: AssetProps;
  setAsset: (asset: AssetProps) => void;
}> = ({ asset, setAsset }) => {
  const [token, setToken] = useState<Token | undefined>(undefined);
  const { getTokenData } = useQueries();
  const colors = useTheme();

  useEffect(() => {
    if (!asset.token || !token) return;
    let cancelled = false;

    const { chain, decimals } = token;

    getAccount(chain).then((address) => {
      if (cancelled) return;
      if (address) {
        if (chain === "Solana") {
          const mint = new PublicKey(asset.token);
          const owner = new PublicKey(address);

          getAssociatedTokenAddress(
            mint,
            owner,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
            .then((address) => {
              if (cancelled) return;
              setAsset({ ...asset, address: address.toBase58(), decimals });
            })
            .catch(() => {
              if (cancelled) return;
              setAsset({ ...asset, decimals });
            });
        } else {
          setAsset({ ...asset, address, decimals });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [asset.token, token]);

  useEffect(() => {
    if (asset.token) {
      getTokenData(asset.chain, asset.token)
        .catch(() => undefined)
        .then(setToken);
    } else {
      setToken(nativeTokens[asset.chain]);
    }
  }, [asset.chain, asset.token]);

  return (
    <VStack
      $style={{
        alignItems: "center",
        backgroundColor: colors.bgTertiary.toHex(),
        borderColor: colors.borderLight.toHex(),
        borderRadius: "16px",
        borderStyle: "solid",
        borderWidth: "1px",
        gap: "8px",
        justifyContent: "center",
        height: "88px",
        width: "100%",
      }}
    >
      {token ? (
        <>
          <Stack $style={{ position: "relative" }}>
            <TokenImage
              alt={token.ticker}
              borderRadius="50%"
              height="30px"
              src={token.logo}
              width="30px"
            />
            {!!token.id && (
              <Stack
                $style={{ bottom: "-4px", position: "absolute", right: "-4px" }}
              >
                <TokenImage
                  alt={token.chain}
                  borderRadius="50%"
                  height="16px"
                  src={`/tokens/${token.chain.toLowerCase()}.svg`}
                  width="16px"
                />
              </Stack>
            )}
          </Stack>
          <Stack as="span">{token.ticker}</Stack>
        </>
      ) : (
        <Spin />
      )}
    </VStack>
  );
};
