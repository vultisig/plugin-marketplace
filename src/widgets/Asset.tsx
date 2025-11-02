import { JsonObject } from "@bufbuild/protobuf";
import { Form, Input, Select, SelectProps } from "antd";
import { get } from "lodash-es";
import { FC, useState } from "react";

import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getJupiterTokens, getOneInchTokens } from "@/utils/api";
import { Chain, chains, EvmChain, evmChains } from "@/utils/chain";
import { camelCaseToTitle } from "@/utils/functions";
import { Configuration, Token } from "@/utils/types";

type AssetWidgetProps = {
  configuration: Configuration;
  fullKey: string[];
};

type StateProps = {
  chainAssets: Record<Chain, Token[]>;
  loading?: boolean;
};

export const AssetWidget: FC<AssetWidgetProps> = ({
  configuration: { properties, required },
  fullKey,
}) => {
  const [state, setState] = useState<StateProps>({
    chainAssets: {
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
    },
  });
  const { chainAssets, loading } = state;
  const key = fullKey[fullKey.length - 1];
  const addressName = [...fullKey, "address"];
  const chainName = [...fullKey, "chain"];
  const tokenName = [...fullKey, "token"];

  const handleChange: SelectProps<Chain>["onChange"] = async (chain) => {
    const tokens = state.chainAssets[chain];

    if (!tokens.length) {
      setState((prev) => ({ ...prev, loading: true }));

      let newTokens: Token[] = [];

      if (chain === "Solana") {
        newTokens = await getJupiterTokens();
      } else if (evmChains.includes(chain as EvmChain)) {
        newTokens = await getOneInchTokens(chain as EvmChain);
      }

      setState((prev) => ({
        ...prev,
        chainAssets: { ...prev.chainAssets, [chain]: newTokens },
        loading: false,
      }));
    }
  };

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
          name={chainName}
          rules={[{ required: required.includes("chain") }]}
          tooltip={properties.chain?.description}
        >
          <Select
            onChange={handleChange}
            options={chains.map((chain) => ({ value: chain, label: chain }))}
            showSearch
          />
        </Form.Item>
        <Form.Item<JsonObject>
          shouldUpdate={(prev, current) =>
            get(prev, chainName) !== get(current, chainName)
          }
          noStyle
        >
          {({ getFieldsValue }) => {
            const values = getFieldsValue();
            const chain: Chain = get(values, chainName);
            const disabled = !chain;
            const tokens = chain
              ? chainAssets[chain].map((token) => ({
                  value: token.id,
                  label: token.ticker,
                  logo: token.logo,
                }))
              : [];

            return (
              <>
                <Form.Item
                  label="Token"
                  name={tokenName}
                  rules={[{ required: required.includes("token") }]}
                  tooltip={properties.token?.description}
                >
                  <Select
                    disabled={disabled}
                    loading={loading}
                    filterOption={(input, option) => {
                      if (option === undefined) return false;

                      const label = option.label.toLowerCase();
                      const value = option.value.toLowerCase();
                      const search = input.toLowerCase();

                      return label.includes(search) || value.includes(search);
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
                            height: "16px",
                            width: "16px",
                          }}
                        />
                        {data.label}
                      </HStack>
                    )}
                    allowClear
                    showSearch
                  />
                </Form.Item>
                <Form.Item
                  label="Address"
                  name={addressName}
                  rules={[{ required: required.includes("address") }]}
                  tooltip={properties.address?.description}
                >
                  <Input disabled={disabled} />
                </Form.Item>
              </>
            );
          }}
        </Form.Item>
      </Stack>
    </VStack>
  );
};
