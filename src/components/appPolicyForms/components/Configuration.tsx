import { FormInstance } from "antd";
import { FC } from "react";

import { AssetWidget } from "@/components/appPolicyForms/widgets/Asset";
import { DynamicFormItem } from "@/components/DynamicFormItem";
import { Divider } from "@/toolkits/Divider";
import { Stack, VStack } from "@/toolkits/Stack";
import { Chain } from "@/utils/chain";
import { camelCaseToTitle, getFieldRef } from "@/utils/functions";
import { Configuration, Definitions } from "@/utils/types";

type AppPolicyFormConfigurationProps = {
  chains: Chain[];
  configuration: Configuration;
  definitions?: Definitions;
  form: FormInstance;
  parentKey?: string[];
};

export const AppPolicyFormConfiguration: FC<
  AppPolicyFormConfigurationProps
> = ({ chains, configuration, definitions, form, parentKey = [] }) => {
  const { properties, required } = configuration;

  return Object.entries(properties).map(([key, field]) => {
    const fullKey = [...parentKey, key];
    const fieldRef = getFieldRef(field, definitions);

    if (fieldRef) {
      switch (field.$ref) {
        case "#/definitions/asset": {
          return (
            <AssetWidget
              configuration={fieldRef}
              form={form}
              fullKey={fullKey}
              key={key}
              supportedChains={chains}
            />
          );
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
                  form={form}
                  parentKey={fullKey}
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
        name={fullKey}
        rules={[{ required: required.includes(key) }]}
        tooltip={properties[key]?.description}
        {...field}
      />
    );
  });
};
