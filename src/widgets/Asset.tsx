import { Form, Input, Select } from "antd";
import { get } from "lodash-es";
import { FC, useEffect, useMemo, useState } from "react";
import { useTheme } from "styled-components";

import { useChainAssets } from "@/hooks/useChainAssets";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { Chain, chains } from "@/utils/chain";
import { camelCaseToTitle } from "@/utils/functions";
import { Configuration } from "@/utils/types";
import { useWalletCore } from "@/hooks/useWalletCore";
import { useTokenMetadata } from "@/utils/queries";

type AssetWidgetProps = {
  configuration: Configuration;
  fullKey: string[];
};

export const AssetWidget: FC<AssetWidgetProps> = ({
  configuration: { properties, required },
  fullKey,
}) => {
  const [search, setSearch] = useState("");
  const { assets, chain, loading, setChain } = useChainAssets();
  const { isValidAddress } = useWalletCore();
  const key = fullKey[fullKey.length - 1];
  const chainField = [...fullKey, "chain"];
  const colors = useTheme();

  const disabled = useMemo(() => !chain, [chain]);

  const tokens = useMemo(() => {
    return assets
      .filter(({ id, name, ticker }) => {
        const trim = search.trim().toLowerCase();

        if (!trim) return true;

        return (
          ticker.toLowerCase().includes(trim) ||
          name.toLowerCase().includes(trim) ||
          id.toLowerCase().includes(trim)
        );
      })
      .map((token) => ({
        label: token.ticker,
        logo: token.logo,
        name: token.name,
        value: token.id,
      }));
  }, [assets, search]);

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
          name={[...fullKey, "chain"]}
          rules={[{ required: required.includes("chain") }]}
          tooltip={properties.chain?.description}
        >
          <Select
            onChange={setChain}
            options={chains.map((chain) => ({ value: chain, label: chain }))}
            showSearch
          />
        </Form.Item>
        <Form.Item
          label="Token"
          name={[...fullKey, "token"]}
          rules={[{ required: required.includes("token") }]}
          tooltip={properties.token?.description}
        >
          <Select
            disabled={disabled}
            loading={loading}
            options={tokens}
            filterOption={false}
            optionRender={({ data }) => (
              <HStack $style={{ alignItems: "center", gap: "8px" }}>
                <Stack
                  as="img"
                  alt={data.label}
                  src={data.logo}
                  $style={{
                    borderRadius: "50%",
                    height: "20px",
                    width: "20px",
                  }}
                />
                <VStack $style={{ gap: "4px" }}>
                  <Stack
                    as="span"
                    $style={{
                      fontSize: "12px",
                      lineHeight: "12px",
                    }}
                  >
                    {data.name}
                  </Stack>
                  <Stack
                    as="span"
                    $style={{
                      color: colors.textTertiary.toHex(),
                      fontSize: "12px",
                      lineHeight: "12px",
                    }}
                  >
                    {data.label}
                  </Stack>
                </VStack>
              </HStack>
            )}
            onSearch={setSearch}
            notFoundContent={
              chain && isValidAddress(chain, search) ? (
                <CustomToken chain={chain} id={search} />
              ) : undefined
            }
            allowClear
            showSearch
          />
        </Form.Item>
        <Form.Item
          label="Address"
          name={[...fullKey, "address"]}
          rules={[{ required: required.includes("address") }]}
          tooltip={properties.address?.description}
        >
          <Input disabled={disabled} />
        </Form.Item>
        <Form.Item
          shouldUpdate={(prev, current) =>
            get(prev, chainField) !== get(current, chainField)
          }
          noStyle
        >
          {({ setFieldValue }) => {
            setFieldValue([...fullKey, "address"], undefined);
            setFieldValue([...fullKey, "token"], undefined);

            return null;
          }}
        </Form.Item>
      </Stack>
    </VStack>
  );
};

const CustomToken: FC<{ chain: Chain; id: string }> = ({ chain, id }) => {
  const { data, refetch } = useTokenMetadata({ chain, id });
  const colors = useTheme();

  useEffect(() => {
    refetch();
  }, [chain, id]);

  if (!data) return undefined;

  return (
    <HStack $style={{ alignItems: "center", cursor: "pointer", gap: "8px" }}>
      <Stack
        as="img"
        alt={data.ticker}
        src={data.logo}
        $style={{
          borderRadius: "50%",
          height: "20px",
          width: "20px",
        }}
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
          {data.name}
        </Stack>
        <Stack
          as="span"
          $style={{
            color: colors.textTertiary.toHex(),
            fontSize: "12px",
            lineHeight: "12px",
          }}
        >
          {data.ticker}
        </Stack>
      </VStack>
    </HStack>
  );
};
