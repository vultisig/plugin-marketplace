import { Form, FormInstance, Input, Select } from "antd";
import { FC, useEffect, useMemo, useState } from "react";
import { useTheme } from "styled-components";

import { TokenImage } from "@/components/TokenImage";
import { useWalletCore } from "@/hooks/useWalletCore";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { Chain, chains } from "@/utils/chain";
import { camelCaseToTitle } from "@/utils/functions";
import { useTokenData, useTokenList } from "@/utils/queries";
import { Configuration, Token } from "@/utils/types";

type AssetWidgetProps = {
  configuration: Configuration;
  form: FormInstance;
  fullKey: string[];
};

export const AssetWidget: FC<AssetWidgetProps> = ({
  configuration: { properties, required },
  form,
  fullKey,
}) => {
  const [chainAssets, setChainAssets] = useState<Record<Chain, Token[]>>({
    Arbitrum: [],
    Avalanche: [],
    Base: [],
    Blast: [],
    BSC: [],
    Ethereum: [],
    Optimism: [],
    Polygon: [],
    Bitcoin: [],
    Ripple: [],
    Solana: [],
  });
  const [search, setSearch] = useState<string>("");
  const key = fullKey[fullKey.length - 1];
  const addressField = [...fullKey, "address"];
  const chainField = [...fullKey, "chain"];
  const tokenField = [...fullKey, "token"];
  const chain: Chain = Form.useWatch(chainField, form);
  const { refetch: getTokenData, isFetching: dataLoading } = useTokenData({
    chain,
    id: search,
  });
  const { refetch: getTokenList, isFetching: listLoading } =
    useTokenList(chain);
  const { isValidAddress } = useWalletCore();
  const colors = useTheme();

  const assets = useMemo(() => {
    if (!chain) return [];
    if (!search) return chainAssets[chain];

    return chainAssets[chain].filter(({ id, name, ticker }) => {
      return (
        ticker.toLowerCase().includes(search) ||
        name.toLowerCase().includes(search) ||
        id.toLowerCase().includes(search)
      );
    });
  }, [chain, chainAssets, search]);

  useEffect(() => {
    if (
      !chain ||
      !search ||
      assets.length > 0 ||
      !isValidAddress(chain, search)
    )
      return;

    getTokenData().then(({ data }) => {
      if (data) {
        setChainAssets((prev) => ({
          ...prev,
          [chain]: [...prev[chain], data],
        }));
      }
    });
  }, [assets, chain, search]);

  useEffect(() => {
    if (!chain) return;

    getTokenList().then(({ data = [] }) => {
      setChainAssets((prev) => ({ ...prev, [chain]: data }));
    });
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
            onChange={() => {
              form.setFieldValue(addressField, undefined);
              form.setFieldValue(tokenField, undefined);
            }}
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
            loading={dataLoading || listLoading}
            options={assets.map((token) => ({
              label: token.ticker,
              logo: token.logo,
              name: token.name,
              value: token.id,
            }))}
            filterOption={false}
            notFoundContent={
              dataLoading || listLoading ? (
                <HStack $style={{ justifyContent: "center", padding: "12px" }}>
                  <Spin />
                </HStack>
              ) : undefined
            }
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
            onSearch={(value) => setSearch(value?.trim().toLowerCase())}
            onSelect={() => setSearch("")}
            allowClear
            showSearch
          />
        </Form.Item>
        <Form.Item
          label="Address"
          name={addressField}
          rules={[{ required: required.includes("address") }]}
          tooltip={properties.address?.description}
        >
          <Input disabled={!chain} />
        </Form.Item>
      </Stack>
    </VStack>
  );
};
