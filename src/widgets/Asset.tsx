import { Form, Input, Select } from "antd";
import { FC, useMemo } from "react";
import { useTheme } from "styled-components";

import { useChainAssets } from "@/hooks/useChainAssets";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { chains } from "@/utils/chain";
import { camelCaseToTitle } from "@/utils/functions";
import { Configuration } from "@/utils/types";

type AssetWidgetProps = {
  configuration: Configuration;
  fullKey: string[];
};

export const AssetWidget: FC<AssetWidgetProps> = ({
  configuration: { properties, required },
  fullKey,
}) => {
  const { assets, chain, loading, setChain } = useChainAssets();
  const key = fullKey[fullKey.length - 1];
  const colors = useTheme();

  const disabled = useMemo(() => !chain, [chain]);

  const tokens = useMemo(() => {
    return assets.map((token) => ({
      label: token.ticker,
      logo: token.logo,
      name: token.name,
      value: token.id,
    }));
  }, [assets]);

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
            options={tokens}
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
                      fontSize: "12px",
                      color: colors.textTertiary.toHex(),
                      lineHeight: "12px",
                    }}
                  >
                    {data.label}
                  </Stack>
                </VStack>
              </HStack>
            )}
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
      </Stack>
    </VStack>
  );
};
