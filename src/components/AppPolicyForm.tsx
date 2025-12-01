import { create, JsonObject, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Form, FormProps, Input, Modal, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
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
import { TrashIcon } from "@/icons/TrashIcon";
import {
  ConstraintSchema,
  ConstraintType,
  MagicConstant,
} from "@/proto/constraint_pb";
import { ParameterConstraintSchema } from "@/proto/parameter_constraint_pb";
import {
  BillingFrequency,
  FeePolicySchema,
  FeeType,
  PolicySchema,
} from "@/proto/policy_pb";
import { Effect, RuleSchema, TargetSchema, TargetType } from "@/proto/rule_pb";
import { getVaultId } from "@/storage/vaultId";
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
  snakeCaseToTitle,
  toTimestamp,
} from "@/utils/functions";
import { App, AppPolicy, Configuration, RecipeSchema } from "@/utils/types";
import { AssetWidget } from "@/widgets/Asset";

type RuleFieldType = {
  description?: string;
  resource: string;
  target?: string;
} & Record<string, string>;

type FormFieldType = {
  rules: RuleFieldType[];
} & JsonObject;

type AppPolicyFormProps = {
  app: App;
  onClose: (reload?: boolean) => void;
  schema: RecipeSchema;
};

type StateProps = {
  step: number;
  submitting?: boolean;
};

export const AppPolicyForm: FC<AppPolicyFormProps> = ({
  app,
  onClose,
  schema,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({
    step: schema.configuration ? 0 : 1,
  });
  const { step, submitting } = state;
  const { messageAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing, title } = app;
  const {
    configuration,
    pluginId,
    pluginName,
    pluginVersion,
    requirements,
    supportedResources,
  } = schema;
  const { hash } = useLocation();
  const [form] = Form.useForm<FormFieldType>();
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

        if (field.format === "date-time") {
          return [[key, (value as any as Dayjs).utc().format()]];
        }

        return [[key, value]];
      })
    );
  };

  const handleStepBack = (step: number) => {
    if (configuration && step > 0) {
      setState((prevState) => ({ ...prevState, step: 0 }));
    } else {
      onClose();
    }
  };

  const handleSign = (values: JsonObject, rules: RuleFieldType[]) => {
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
      rules: rules
        .filter(
          ({ resource }) =>
            supportedResources.findIndex(
              ({ resourcePath }) => resourcePath?.full === resource
            ) >= 0
        )
        .map(({ description = "", resource, target, ...params }) => {
          const {
            parameterCapabilities,
            resourcePath,
            target: targetType,
          } = supportedResources.find(
            ({ resourcePath }) => resourcePath?.full === resource
          )!;

          return create(RuleSchema, {
            constraints: {},
            description,
            effect: Effect.ALLOW,
            id: "",
            parameterConstraints: parameterCapabilities.map(
              ({ parameterName, required, supportedTypes }) =>
                create(ParameterConstraintSchema, {
                  constraint: create(ConstraintSchema, {
                    denominatedIn:
                      resourcePath?.chainId?.toLowerCase() === "ethereum"
                        ? "wei"
                        : "",
                    period: "",
                    required,
                    type: supportedTypes,
                    value: {
                      case: "fixedValue",
                      value: params[parameterName] as string,
                    },
                  }),
                  parameterName,
                })
            ),
            resource,
            target: create(TargetSchema, {
              targetType,
              target:
                targetType === TargetType.ADDRESS
                  ? { case: "address", value: target as string }
                  : targetType === TargetType.MAGIC_CONSTANT
                  ? {
                      case: "magicConstant",
                      value: MagicConstant.VULTISIG_TREASURY,
                    }
                  : { case: undefined, value: undefined },
            }),
          });
        }),
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
    if ("from" in values && "fromAmount" in values) {
      configurationData["fromAmount"] = parseUnits(
        values.fromAmount as string,
        (values.from as JsonObject).decimals as number
      ).toString();
    }

    getRecipeSuggestion(id, configurationData).then(({ rules = [] }) => {
      const formRules = rules.map(
        ({ parameterConstraints, resource, target }) => {
          const params: RuleFieldType = { resource };

          if (target?.target?.value) {
            params.target = target.target.value as string;
          }

          parameterConstraints.forEach(({ constraint, parameterName }) => {
            if (constraint?.value?.value) {
              params[parameterName] = constraint.value.value as string;
            }
          });

          return params;
        }
      );

      if (formRules.length > 0) {
        form.setFieldValue("rules", formRules);

        handleSign(values, formRules);

        setState((prevState) => ({ ...prevState, step: 1 }));
      } else {
        setState((prevState) => ({
          ...prevState,
          submitting: false,
          step: 1,
        }));
      }
    });
  };

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = ({
    rules = [],
    ...values
  }) => {
    switch (step) {
      case 0: {
        handleSuggest(values);

        break;
      }
      default: {
        handleSign(values, rules);

        break;
      }
    }
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

    setState((prevState) => ({ ...prevState, step: configuration ? 0 : 1 }));

    form.resetFields();
  }, [form, visible]);

  return (
    <Modal
      centered={true}
      closeIcon={
        configuration && step > 0 ? <ChevronLeftIcon /> : <CrossIcon />
      }
      footer={
        <>
          <Stack $style={{ flex: "none", width: "218px" }} />
          <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
            <Button loading={submitting} onClick={() => form.submit()}>
              {step < 1 ? t("continue") : t("submit")}
            </Button>
          </HStack>
        </>
      }
      maskClosable={false}
      onCancel={() => handleStepBack(step)}
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
        {["Configuration", "Rules"].map((item, index) => {
          const disabled = step < index;
          const passed = step > index;

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
          {configuration && (
            <Stack
              $style={{
                columnGap: "24px",
                display: step === 0 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              {renderConfiguration(configuration)}
            </Stack>
          )}
          <Stack $style={{ display: step === 1 ? "block" : "none" }}>
            <Form.List
              name="rules"
              rules={[
                {
                  validator: async (_, rules) => {
                    if (step > 0 && (!rules || rules.length < 1)) {
                      return Promise.reject(
                        new Error(t("ruleValidationError"))
                      );
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <VStack $style={{ gap: "24px" }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <Fragment key={`${name}-${key}`}>
                      <VStack>
                        <Stack
                          $style={{
                            columnGap: "16px",
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                          }}
                        >
                          <Form.Item
                            name={[name, "resource"]}
                            label={t("supportedResource")}
                            rules={[{ required: step > 0 }]}
                            {...restField}
                          >
                            <Select
                              options={supportedResources.map((resource) => ({
                                label: resource.resourcePath?.full,
                                value: resource.resourcePath?.full,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item<FormFieldType>
                            shouldUpdate={(prev, current) =>
                              prev.rules[name]?.resource !==
                              current.rules[name]?.resource
                            }
                            noStyle
                          >
                            {({ getFieldsValue }) => {
                              const { rules = [] } = getFieldsValue();
                              const { resource } = rules[name] || {};
                              const supportedResource = supportedResources.find(
                                ({ resourcePath }) =>
                                  resourcePath?.full === resource
                              );

                              if (!supportedResource) return null;

                              return (
                                <>
                                  {supportedResource.parameterCapabilities
                                    .filter(
                                      ({ supportedTypes }) =>
                                        supportedTypes !== ConstraintType.ANY
                                    )
                                    .map(({ parameterName, required }) => (
                                      <Form.Item
                                        key={parameterName}
                                        label={snakeCaseToTitle(parameterName)}
                                        name={[name, parameterName]}
                                        rules={[
                                          {
                                            required: step > 0 && required,
                                          },
                                        ]}
                                      >
                                        <Input />
                                      </Form.Item>
                                    ))}
                                  {supportedResource.target ===
                                    TargetType.ADDRESS && (
                                    <Form.Item
                                      label={t("target")}
                                      name={[name, "target"]}
                                      rules={[{ required: step > 0 }]}
                                    >
                                      <Input />
                                    </Form.Item>
                                  )}
                                  <Stack
                                    as={Form.Item}
                                    name={[name, "description"]}
                                    label={t("description")}
                                    $style={{ gridColumn: "1 / -1" }}
                                  >
                                    <Input.TextArea />
                                  </Stack>
                                </>
                              );
                            }}
                          </Form.Item>
                        </Stack>
                        <Stack
                          $style={{
                            alignItems: "center",
                            display: "flex",
                            flexDirection: "row-reverse",
                            justifyContent: "space-between",
                          }}
                        >
                          {fields.length > 1 && (
                            <Button
                              icon={<TrashIcon fontSize={16} />}
                              kind="danger"
                              onClick={() => remove(name)}
                              ghost
                            />
                          )}
                          <Form.Item<FormFieldType>
                            shouldUpdate={(prev, current) =>
                              prev.rules[name]?.resource !==
                              current.rules[name]?.resource
                            }
                            noStyle
                          >
                            {({ getFieldsValue }) => {
                              const { rules = [] } = getFieldsValue();
                              const { resource } = rules[name] || {};
                              const supportedResource = supportedResources.find(
                                ({ resourcePath }) =>
                                  resourcePath?.full === resource
                              );

                              if (!supportedResource) return null;

                              return supportedResource.resourcePath ? (
                                <HStack $style={{ gap: "8px" }}>
                                  {[
                                    ...(supportedResource.resourcePath.chainId
                                      ? [
                                          `Chain: ${camelCaseToTitle(
                                            supportedResource.resourcePath
                                              .chainId
                                          )}`,
                                        ]
                                      : []),
                                    ...(supportedResource.resourcePath
                                      .protocolId
                                      ? [
                                          `Protocol: ${camelCaseToTitle(
                                            supportedResource.resourcePath
                                              .protocolId
                                          )}`,
                                        ]
                                      : []),
                                    ...(supportedResource.resourcePath
                                      .functionId
                                      ? [
                                          `Function: ${camelCaseToTitle(
                                            supportedResource.resourcePath
                                              .functionId
                                          )}`,
                                        ]
                                      : []),
                                  ].map((item, index) => (
                                    <Stack
                                      as="span"
                                      key={index}
                                      $style={{
                                        backgroundColor:
                                          colors.bgSecondary.toHex(),
                                        borderRadius: "6px",
                                        color: colors.textPrimary.toHex(),
                                        display: "inline-flex",
                                        fontSize: "12px",
                                        lineHeight: "24px",
                                        padding: "0 8px",
                                      }}
                                    >
                                      {item}
                                    </Stack>
                                  ))}
                                </HStack>
                              ) : (
                                <></>
                              );
                            }}
                          </Form.Item>
                        </Stack>
                      </VStack>
                      <Divider light />
                    </Fragment>
                  ))}
                  <VStack>
                    {errors.length > 0 && (
                      <Stack as={Form.Item} $style={{ margin: "0" }}>
                        <Form.ErrorList errors={errors} />
                      </Stack>
                    )}
                    <Button onClick={() => add({})} kind="secondary">
                      {t("addRule")}
                    </Button>
                  </VStack>
                </VStack>
              )}
            </Form.List>
          </Stack>
        </Form>
      </VStack>
    </Modal>
  );
};
