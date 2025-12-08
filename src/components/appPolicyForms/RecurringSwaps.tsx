import { create, JsonObject, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Form, FormProps, Modal } from "antd";
import dayjs from "dayjs";
import { FC, Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";

import { DynamicFormItem } from "@/components/DynamicFormItem";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { CheckmarkIcon } from "@/icons/CheckmarkIcon";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CrossIcon } from "@/icons/CrossIcon";
import {
  BillingFrequency,
  FeePolicySchema,
  FeeType,
  PolicySchema,
} from "@/proto/policy_pb";
import { Rule } from "@/proto/rule_pb";
import { getVaultId } from "@/storage/vaultId";
import { AssetTemplate } from "@/templates/AssetTemplate";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { addPolicy, getRecipeSuggestion } from "@/utils/api";
import { modalHash } from "@/utils/constants";
import { personalSign } from "@/utils/extension";
import {
  camelCaseToTitle,
  getFieldRef,
  policyToHexMessage,
  toTimestamp,
} from "@/utils/functions";
import { App, AppPolicy, Configuration, RecipeSchema } from "@/utils/types";
import { AssetWidget } from "@/widgets/Asset";

type RecurringSwapsPolicyFormProps = {
  app: App;
  onClose: (reload?: boolean) => void;
  schema: RecipeSchema;
};

type StateProps = {
  step: number;
  submitting?: boolean;
};

export const RecurringSwapsPolicyForm: FC<RecurringSwapsPolicyFormProps> = ({
  app,
  onClose,
  schema,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({ step: 1 });
  const { step, submitting } = state;
  const { messageAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing, title } = app;
  const {
    configuration,
    configurationExample,
    pluginId,
    pluginName,
    pluginVersion,
    requirements,
  } = schema;
  const { hash } = useLocation();
  const [form] = Form.useForm<JsonObject>();
  const colors = useTheme();
  const definitions = configuration?.definitions;
  const supportedChains = requirements?.supportedChains || [];
  const visible = hash === modalHash.policy;

  const getConfiguration = (
    configuration: Configuration,
    values: JsonObject
  ): JsonObject => {
    return Object.fromEntries(
      Object.entries(configuration.properties).flatMap(([key, field]) => {
        const value = values[key];

        if (value === undefined) return [];

        if (field.$ref) {
          const fieldRef = getFieldRef(field, definitions);

          if (!fieldRef) return [];

          return [[key, getConfiguration(fieldRef, value as JsonObject)]];
        }

        return [[key, value]];
      })
    );
  };

  const handleBack = () => {
    if (step > 1) {
      setState((prevState) => ({ ...prevState, step: prevState.step - 1 }));
    } else {
      onClose();
    }
  };

  const handleSign = (values: JsonObject, rules: Rule[]) => {
    setState((prevState) => ({ ...prevState, submitting: true }));

    const jsonData = create(PolicySchema, {
      author: "",
      configuration: configuration
        ? getConfiguration(configuration, values)
        : undefined,
      description: "",
      feePolicies: pricing.map((price) => {
        let frequency = BillingFrequency.BILLING_FREQUENCY_UNSPECIFIED;
        let type = FeeType.FEE_TYPE_UNSPECIFIED;

        switch (price.frequency) {
          case "daily":
            frequency = BillingFrequency.DAILY;
            break;
          case "weekly":
            frequency = BillingFrequency.WEEKLY;
            break;
          case "biweekly":
            frequency = BillingFrequency.BIWEEKLY;
            break;
          case "monthly":
            frequency = BillingFrequency.MONTHLY;
            break;
        }

        switch (price.type) {
          case "once":
            type = FeeType.ONCE;
            break;
          case "recurring":
            type = FeeType.RECURRING;
            break;
          case "per-tx":
            type = FeeType.TRANSACTION;
            break;
        }

        return create(FeePolicySchema, {
          amount: BigInt(price.amount),
          description: "",
          frequency,
          id: uuidv4(),
          startDate: create(TimestampSchema, toTimestamp(dayjs())),
          type,
        });
      }),
      id: pluginId,
      name: pluginName,
      rules,
      version: pluginVersion,
    });

    const binary = toBinary(PolicySchema, jsonData);

    const recipe = base64Encode(binary);

    const policy: AppPolicy = {
      active: true,
      id: uuidv4(),
      pluginId: id,
      pluginVersion: String(pluginVersion),
      policyVersion: 0,
      publicKey: getVaultId(),
      recipe,
    };

    const message = policyToHexMessage(policy);

    personalSign(address, message, "policy")
      .then((signature) => {
        addPolicy({ ...policy, signature })
          .then(() => {
            form.resetFields();

            onClose(true);
          })
          .catch((error: Error) => {
            messageAPI.error(error.message);
          })
          .finally(() => {
            setState((prevState) => ({ ...prevState, submitting: false }));
          });
      })
      .catch((error: Error) => {
        messageAPI.error(error.message);

        setState((prevState) => ({ ...prevState, submitting: false }));
      });
  };

  const handleSuggest = (values: JsonObject) => {
    if (!configuration) return;

    setState((prevState) => ({ ...prevState, submitting: true }));

    const configurationData = getConfiguration(configuration, values);

    // TODO: move amount to asset widget
    if ("from" in values) {
      if ("amount" in values) {
        configurationData["amount"] = parseUnits(
          values.amount as string,
          (values.from as JsonObject).decimals as number
        ).toString();
      }
      if ("fromAmount" in values) {
        configurationData["fromAmount"] = parseUnits(
          values.fromAmount as string,
          (values.from as JsonObject).decimals as number
        ).toString();
      }
    }

    getRecipeSuggestion(id, configurationData).then(({ rules = [] }) => {
      handleSign(values, rules);
    });
  };

  const handleTemplate = (data: JsonObject, edit?: boolean) => {
    form.setFieldsValue(data);

    if (edit) {
      setState((prevState) => ({ ...prevState, step: 2 }));
    } else {
      handleSuggest(data);
    }
  };

  const onFinishSuccess: FormProps<JsonObject>["onFinish"] = (values) => {
    handleSuggest(values);
  };

  const renderConfiguration = (
    { properties, required }: Configuration,
    parentKey: string[] = []
  ) => {
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
                supportedChains={supportedChains}
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
                  {renderConfiguration(fieldRef, fullKey)}
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

  useEffect(() => {
    if (!visible) return;

    setState((prevState) => ({ ...prevState, step: 1 }));

    form.resetFields();
  }, [form, visible]);

  return (
    <Modal
      centered={true}
      closeIcon={step > 1 ? <ChevronLeftIcon /> : <CrossIcon />}
      footer={
        <>
          <Stack $style={{ flex: "none", width: "218px" }} />
          <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
            <Button
              loading={submitting}
              onClick={() =>
                step > 1
                  ? form.submit()
                  : setState((prevState) => ({ ...prevState, step: 2 }))
              }
            >
              {step > 1 ? t("submit") : t("createOwnAutomations")}
            </Button>
          </HStack>
        </>
      }
      maskClosable={false}
      onCancel={handleBack}
      open={visible}
      styles={{
        body: { display: "flex", gap: 32 },
        footer: { display: "flex", gap: 65, marginTop: 24 },
        header: { marginBottom: 32 },
      }}
      title={
        <HStack $style={{ gap: "8px" }}>
          <Stack
            as="img"
            src={app.logoUrl}
            $style={{ height: "24px", width: "24px" }}
          />
          <HStack
            $style={{
              fontSize: "22px",
              fontWeight: "500",
              gap: "4px",
              lineHeight: "24px",
            }}
          >
            <Stack as="span">{title}</Stack>
            <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
              {`/ ${t("addAutomation")}`}
            </Stack>
          </HStack>
        </HStack>
      }
      width={992}
    >
      <VStack $style={{ flex: "none", gap: "16px", width: "218px" }}>
        {[t("templates"), t("automations")].map((item, index) => {
          const disabled = step < index + 1;
          const passed = step > index + 1;

          return (
            <Fragment key={index}>
              {index > 0 && <Divider light />}
              <HStack $style={{ alignItems: "center", gap: "8px" }}>
                <HStack
                  as="span"
                  $style={{
                    alignItems: "center",
                    backgroundColor: passed
                      ? colors.success.toHex()
                      : colors.bgSecondary.toHex(),
                    border:
                      disabled || passed
                        ? undefined
                        : `solid 1px ${colors.accentFour.toHex()}`,
                    borderRadius: "50%",
                    color: passed
                      ? colors.neutral50.toHex()
                      : disabled
                      ? colors.textTertiary.toHex()
                      : colors.accentFour.toHex(),
                    height: "24px",
                    justifyContent: "center",
                    width: "24px",
                  }}
                >
                  {passed ? <CheckmarkIcon /> : index + 1}
                </HStack>
                <Stack
                  as="span"
                  $style={{
                    color:
                      disabled || passed
                        ? colors.textTertiary.toHex()
                        : colors.textPrimary.toHex(),
                  }}
                >
                  {item}
                </Stack>
              </HStack>
            </Fragment>
          );
        })}
      </VStack>
      <Divider light vertical />
      <VStack
        $style={{
          justifyContent: "center",
          backgroundColor: colors.bgTertiary.toHex(),
          borderRadius: "24px",
          flexGrow: 1,
          padding: "32px",
        }}
      >
        <Form
          autoComplete="off"
          form={form}
          layout="vertical"
          onFinish={onFinishSuccess}
        >
          {configurationExample && (
            <Stack
              $style={{
                columnGap: "24px",
                display: step === 1 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              {configurationExample.map((example, index) => (
                <AssetTemplate
                  defaultValues={example}
                  key={index}
                  onSelect={handleTemplate}
                />
              ))}
            </Stack>
          )}
          {configuration && (
            <Stack
              $style={{
                columnGap: "24px",
                display: step === 2 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              {renderConfiguration(configuration)}
            </Stack>
          )}
        </Form>
      </VStack>
    </Modal>
  );
};
