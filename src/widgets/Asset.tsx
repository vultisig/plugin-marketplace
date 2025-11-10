import { Form, FormInstance, Input, Select, SelectProps } from "antd";
import { FC, useEffect, useState } from "react";
import { useTheme } from "styled-components";

import { TokenImage } from "@/components/TokenImage";
import { useQueries } from "@/hooks/useQueries";
import { useWalletCore } from "@/hooks/useWalletCore";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { Chain, chains } from "@/utils/chain";
import { camelCaseToTitle } from "@/utils/functions";
import { Configuration, Token } from "@/utils/types";

type AssetWidgetProps = {
  configuration: Configuration;
  form: FormInstance;
  fullKey: string[];
};

type StateProps = {
  loading?: boolean;
  tokens: Token[];
};

export const AssetWidget: FC<AssetWidgetProps> = ({
  configuration: { properties, required },
  form,
  fullKey,
}) => {
  const [state, setState] = useState<StateProps>({ tokens: [] });
  const { loading, tokens } = state;
  const { getTokenData, getTokenList } = useQueries();
  const { isValidAddress } = useWalletCore();
  const colors = useTheme();
  const key = fullKey[fullKey.length - 1];
  const addressField = [...fullKey, "address"];
  const chainField = [...fullKey, "chain"];
  const tokenField = [...fullKey, "token"];
  const chain: Chain = Form.useWatch(chainField, form);

  const handleSearch: SelectProps["onSearch"] = (address) => {
    if (
      !chain ||
      !address ||
      !isValidAddress(chain, address) ||
      tokens.some(({ id }) => id === address)
    )
      return;

    setState((prev) => ({ ...prev, loading: true }));

    getTokenData(chain, address).then((token) => {
      if (token) {
        setState((prev) => ({
          ...prev,
          loading: false,
          tokens: [...prev.tokens, token],
        }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });
  };

  useEffect(() => {
    if (chain) {
      setState((prev) => ({ ...prev, loading: true }));

      getTokenList(chain).then((tokens) => {
        setState((prev) => ({ ...prev, loading: false, tokens }));
      });
    } else {
      form.setFieldValue(addressField, undefined);
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
          name={chainField}
          rules={[{ required: required.includes("chain") }]}
          tooltip={properties.chain?.description}
        >
          <Select
            optionRender={({ data: { label, value } }) => (
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
            )}
            options={chains.map((chain) => ({ value: chain, label: chain }))}
            showSearch
          />
        </Form.Item>
        <Form.Item
          label="Token"
          name={tokenField}
          rules={[{ required: required.includes("token") }]}
          tooltip={properties.token?.description}
        >
          <Select
            disabled={!chain}
            filterOption={(input, option) => {
              if (option === undefined) return false;

              const label = option.label.toLowerCase();
              const name = option.name.toLowerCase();
              const value = option.value.toLowerCase();
              const search = input.toLowerCase();

              return (
                label.includes(search) ||
                name.includes(search) ||
                value.includes(search)
              );
            }}
            loading={loading}
            notFoundContent={
              loading ? (
                <HStack $style={{ justifyContent: "center", padding: "12px" }}>
                  <Spin />
                </HStack>
              ) : undefined
            }
            onSearch={handleSearch}
            optionRender={({ data: { label, logo, name } }) => (
              <HStack
                $style={{ alignItems: "center", cursor: "pointer", gap: "8px" }}
              >
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
            )}
            options={tokens.map((token) => ({
              label: token.ticker,
              logo: token.logo,
              name: token.name,
              value: token.id,
            }))}
            allowClear
            showSearch
          />
        </Form.Item>
        <Stack
          as={Form.Item}
          label="Address"
          name={addressField}
          rules={[{ required: required.includes("address") }]}
          tooltip={properties.address?.description}
          $style={{ gridColumn: "1 / -1" }}
        >
          <Input disabled={!chain} />
        </Stack>
      </Stack>
    </VStack>
  );
};
