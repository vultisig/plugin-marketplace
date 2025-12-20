import { FC } from "react";

import { DynamicFormItem } from "@/automations/components/DynamicFormItem";
import { AssetWidget } from "@/automations/widgets/Asset";
import { Divider } from "@/toolkits/Divider";
import { Stack, VStack } from "@/toolkits/Stack";
import { Chain } from "@/utils/chain";
import { camelCaseToTitle, getFieldRef } from "@/utils/functions";
import { Configuration, Definitions } from "@/utils/types";

type AppPolicyFormConfigurationProps = {
  chains: Chain[];
  configuration: Configuration;
  definitions?: Definitions;
  parentKey?: string[];
};

export const AppPolicyFormConfiguration: FC<
  AppPolicyFormConfigurationProps
> = ({ chains, configuration, definitions, parentKey = [] }) => {
  const { properties, required } = configuration;

  return Object.entries(properties).map(([key, field]) => {
    const keys = [...parentKey, key];
    const fieldRef = getFieldRef(field, definitions);

    if (fieldRef) {
      switch (field.$ref) {
        case "#/definitions/asset": {
          return <AssetWidget chains={chains} key={key} keys={keys} />;
        }
        default: {
          return (
            <VStack key={key} $style={{ gap: "16px", gridColumn: "1 / -1" }}>
              <Divider text={camelCaseToTitle(key)} />
              <Stack
                $style={{
                  columnGap: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                }}
              >
                <AppPolicyFormConfiguration
                  chains={chains}
                  configuration={fieldRef}
                  definitions={definitions}
                  parentKey={keys}
                />
              </Stack>
            </VStack>
          );
        }
      }
    }

    return (
      <DynamicFormItem
        key={key}
        label={camelCaseToTitle(key)}
        name={keys}
        rules={[{ required: required.includes(key) }]}
        tooltip={properties[key]?.description}
        {...field}
      />
    );
  });
};
