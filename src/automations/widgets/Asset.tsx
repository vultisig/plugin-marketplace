import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Form, Input, Select, SelectProps } from "antd";
import { FC, useEffect, useMemo, useState } from "react";
import { useTheme } from "styled-components";

import { TokenImage } from "@/components/TokenImage";
import { useQueries } from "@/hooks/useQueries";
import { useWalletCore } from "@/hooks/useWalletCore";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { Chain, decimals, ethL2Chains, tickers } from "@/utils/chain";
import { getAccount } from "@/utils/extension";
import { camelCaseToTitle } from "@/utils/functions";
import { Token } from "@/utils/types";

type AssetWidgetProps = {
  chains: Chain[];
  keys: string[];
  prefixKeys?: string[];
};

type StateProps = {
  loading?: boolean;
  tokens: Token[];
};

export const AssetWidget: FC<AssetWidgetProps> = ({
  chains,
  keys,
  prefixKeys = [],
}) => {
  const [state, setState] = useState<StateProps>({ tokens: [] });
  const { loading, tokens } = state;
  const { getTokenData, getTokenList } = useQueries();
  const { isValidAddress } = useWalletCore();
  const colors = useTheme();
  const key = keys[keys.length - 1];
  const addressField = [...prefixKeys, ...keys, "address"];
  const chainField = [...prefixKeys, ...keys, "chain"];
  const decimalsField = [...prefixKeys, ...keys, "decimals"];
  const tokenField = [...prefixKeys, ...keys, "token"];
  const form = Form.useFormInstance();
  const chain = Form.useWatch<Chain>(chainField, form);

  const nativeTokens = useMemo(() => {
    return chains.reduce((acc, chain) => {
      const isEvm = chain in ethL2Chains;

      acc[chain] = isEvm
        ? {
            chain: "Ethereum",
            decimals: decimals["Ethereum"],
            id: "",
            logo: "/tokens/ethereum.svg",
            name: "Ethereum",
            ticker: tickers["Ethereum"],
          }
        : {
            chain,
            decimals: decimals[chain],
            id: "",
            logo: `/tokens/${chain.toLowerCase()}.svg`,
            name: chain,
            ticker: tickers[chain],
          };
      return acc;
    }, {} as Record<Chain, Token>);
  }, [chain]);

  const chainSelectProps: SelectProps<Chain, { label: string; value: string }> =
    {
      onChange: (chain) => {
        getAccount(chain).then((address) => {
          form.setFieldValue(addressField, address);
          form.setFieldValue(decimalsField, nativeTokens[chain].decimals);
          form.setFieldValue(tokenField, "");
        });
      },
      optionRender: ({ data: { label, value } }) => (
        <HStack
          $style={{ alignItems: "center", cursor: "pointer", gap: "8px" }}
        >
          <TokenImage
            src={`/tokens/${value.toLowerCase()}.svg`}
            alt={label}
            borderRadius="50%"
            height="24px"
            width="24px"
          />
          <Stack
            as="span"
            $style={{
              color: colors.textPrimary.toHex(),
              fontSize: "12px",
              lineHeight: "12px",
            }}
          >
            {label}
          </Stack>
        </HStack>
      ),
      options: chains.map((chain) => ({ value: chain, label: chain })),
      showSearch: true,
    };

  const tokenSelectProps: SelectProps<
    string,
    { label: string; logo: string; name: string; value: string }
  > = {
    allowClear: true,
    disabled: !chain,
    loading,
    notFoundContent: loading ? (
      <HStack $style={{ justifyContent: "center", padding: "12px" }}>
        <Spin />
      </HStack>
    ) : undefined,
    onChange: (token) => {
      const selectedToken =
        tokens.find(({ id }) => id === token) || nativeTokens[chain];

      form.setFieldValue(decimalsField, selectedToken.decimals);

      if (chain === "Solana") {
        getAccount(chain).then((address) => {
          if (address && token) {
            const mint = new PublicKey(token);
            const owner = new PublicKey(address);

            getAssociatedTokenAddress(
              mint,
              owner,
              true,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
              .then((address) => {
                form.setFieldValue(addressField, address.toBase58());
              })
              .catch(() => {
                form.setFieldValue(addressField, undefined);
              });
          } else {
            form.setFieldValue(addressField, address);
          }
        });
      }
    },
    optionRender: ({ data: { label, logo, name } }) => (
      <HStack $style={{ alignItems: "center", cursor: "pointer", gap: "8px" }}>
        <TokenImage
          src={logo}
          alt={label}
          borderRadius="50%"
          height="24px"
          width="24px"
        />
        <VStack $style={{ gap: "4px" }}>
          <Stack
            as="span"
            $style={{
              color: colors.textPrimary.toHex(),
              fontSize: "12px",
              lineHeight: "12px",
            }}
          >
            {name}
          </Stack>
          <Stack
            as="span"
            $style={{
              color: colors.textTertiary.toHex(),
              fontSize: "12px",
              lineHeight: "12px",
            }}
          >
            {label}
          </Stack>
        </VStack>
      </HStack>
    ),
    options: [...(chain ? [nativeTokens[chain]] : []), ...tokens].map(
      (token) => ({
        label: token.ticker,
        logo: token.logo,
        name: token.name,
        value: token.id,
      })
    ),
    showSearch: {
      filterOption: (input, option) => {
        if (!option) return false;

        const label = option.label.toLowerCase();
        const name = option.name.toLowerCase();
        const value = option.value.toLowerCase();
        const search = input.toLowerCase();

        return (
          label.includes(search) ||
          name.includes(search) ||
          value.includes(search)
        );
      },
      onSearch: (address) => {
        if (
          !chain ||
          !address ||
          !isValidAddress(chain, address) ||
          tokens.some(({ id }) => id === address)
        )
          return;

        setState((prev) => ({ ...prev, loading: true }));

        getTokenData(chain, address)
          .then((token) => {
            setState((prev) => ({
              ...prev,
              loading: false,
              tokens: [...prev.tokens, token],
            }));
          })
          .catch(() => {
            setState((prev) => ({ ...prev, loading: false }));
          });
      },
    },
  };

  useEffect(() => {
    if (chain) {
      setState((prev) => ({ ...prev, loading: true }));

      getTokenList(chain)
        .catch(() => [])
        .then((tokens) => {
          setState((prev) => ({ ...prev, loading: false, tokens }));
        });
    } else {
      form.setFieldValue(addressField, undefined);
      form.setFieldValue(decimalsField, undefined);
      form.setFieldValue(tokenField, undefined);
    }
  }, [chain]);

  return (
    <VStack $style={{ gap: "16px", gridColumn: "1 / -1" }}>
      <Divider text={camelCaseToTitle(key)} />
      <Stack
        $style={{
          columnGap: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
        }}
      >
        <Form.Item
          label="Chain"
          name={[...keys, "chain"]}
          rules={[{ required: true }]}
        >
          <Select {...chainSelectProps} />
        </Form.Item>
        <Form.Item label="Token" name={[...keys, "token"]}>
          <Select {...tokenSelectProps} />
        </Form.Item>
        <Form.Item name={[...keys, "address"]} noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item name={[...keys, "decimals"]} noStyle>
          <Input type="hidden" />
        </Form.Item>
      </Stack>
    </VStack>
  );
};
