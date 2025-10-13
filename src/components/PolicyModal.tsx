import { create, toBinary } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Form, FormProps, Modal } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { FC, Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { useApp } from "@/hooks/useApp";
import { useGoBack } from "@/hooks/useGoBack";
import { CheckIcon } from "@/icons/CheckIcon";
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
import { DatePicker } from "@/toolkits/DatePicker";
import { Divider } from "@/toolkits/Divider";
import { Input } from "@/toolkits/Input";
import { InputNumber } from "@/toolkits/InputNumber";
import { Select } from "@/toolkits/Select";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants/core";
import {
  camelCaseToTitle,
  policyToHexMessage,
  snakeCaseToTitle,
  toTimestamp,
} from "@/utils/functions";
import { personalSign } from "@/utils/services/extension";
import {
  addPolicy,
  getRecipeSpecification,
  getRecipeSuggestion,
} from "@/utils/services/marketplace";
import { App, AppPolicy, CustomRecipeSchema } from "@/utils/types";

type RuleFieldType = {
  resource: string;
  target?: string;
} & Record<string, string>;

type FormFieldType = {
  maxTxsPerWindow: number;
  rateLimitWindow: number;
  rules: RuleFieldType[];
} & Record<string, number | string | Dayjs>;

type PolicyModalProps = { app: App; onFinish: () => void };

type InitialState = {
  schema?: CustomRecipeSchema;
  step: number;
  submitting?: boolean;
  visible?: boolean;
};

export const PolicyModal: FC<PolicyModalProps> = ({ app, onFinish }) => {
  const [state, setState] = useState<InitialState>({ step: 0 });
  const { schema, step, submitting, visible } = state;
  const { address, messageAPI } = useApp();
  const { hash } = useLocation();
  const [form] = Form.useForm<FormFieldType>();
  const goBack = useGoBack();
  const colors = useTheme();

  const properties = useMemo(() => {
    return schema?.configuration?.properties;
  }, [schema]);

  const isFeesPlugin = useMemo(() => {
    return app.id === import.meta.env.VITE_FEE_PLUGIN_ID;
  }, [app]);

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = (values) => {
    switch (step) {
      case 0: {
        const configuration = Object.fromEntries(
          Object.entries(values).filter(
            ([key]) =>
              !["rules", "maxTxsPerWindow", "rateLimitWindow"].includes(key)
          )
        ) as Record<string, string>;

        getRecipeSuggestion(app.id, configuration).then(
          ({ maxTxsPerWindow = 2, rateLimitWindow, rules = [] }) => {
            const formRules = rules.map(
              ({ parameterConstraints, resource, target }) => {
                const params: RuleFieldType = { resource };

                if (target?.target?.value) {
                  params.target = target.target.value as string;
                }

                parameterConstraints.forEach(
                  ({ constraint, parameterName }) => {
                    if (constraint?.value?.value) {
                      params[parameterName] = constraint.value.value as string;
                    }
                  }
                );

                return params;
              }
            );

            form.setFieldValue("maxTxsPerWindow", maxTxsPerWindow);
            form.setFieldValue("rateLimitWindow", rateLimitWindow);
            form.setFieldValue("rules", formRules);

            setState((prevState) => ({ ...prevState, step: 1 }));
          }
        );

        break;
      }
      case 1: {
        setState((prevState) => ({ ...prevState, step: 2 }));

        break;
      }
      default: {
        if (address && schema) {
          setState((prevState) => ({ ...prevState, submitting: true }));

          const rules = values.rules
            .filter(
              ({ resource }) =>
                schema.supportedResources.findIndex(
                  ({ resourcePath }) => resourcePath?.full === resource
                ) >= 0
            )
            .map(({ resource, target, ...params }) => {
              const {
                parameterCapabilities,
                resourcePath,
                target: targetType,
              } = schema.supportedResources.find(
                ({ resourcePath }) => resourcePath?.full === resource
              )!;

              const parameterConstraints = parameterCapabilities.map(
                ({ parameterName, required, supportedTypes }) => {
                  const constraint = create(ConstraintSchema, {
                    denominatedIn:
                      resourcePath?.chainId.toLowerCase() === "ethereum"
                        ? "wei"
                        : "",
                    period: "",
                    required,
                    type: supportedTypes,
                    value: {
                      case: "fixedValue",
                      value: params[parameterName] as string,
                    },
                  });

                  return create(ParameterConstraintSchema, {
                    constraint,
                    parameterName,
                  });
                }
              );

              return create(RuleSchema, {
                constraints: {},
                description: "",
                effect: Effect.ALLOW,
                id: "",
                parameterConstraints,
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
            });

          const feePolicies = app.pricing.map((price) => {
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
          });

          const configuration = () => {
            if (schema.configuration?.properties) {
              const configuration: Record<string, any> = {};

              Object.entries(schema.configuration.properties).forEach(
                ([key, field]) => {
                  if (values[key]) {
                    switch (field.format) {
                      case "date-time": {
                        configuration[key] = (values[key] as Dayjs)
                          .utc()
                          .format();
                        break;
                      }
                      default: {
                        configuration[key] = values[key];
                        break;
                      }
                    }
                  }
                }
              );

              return { configuration };
            } else {
              return {};
            }
          };

          const jsonData = create(PolicySchema, {
            author: "",
            ...configuration(),
            description: "",
            feePolicies,
            id: schema.pluginId,
            maxTxsPerWindow: values.maxTxsPerWindow,
            name: schema.pluginName,
            rules,
            rateLimitWindow: values.rateLimitWindow,
            version: schema.pluginVersion,
          });

          const binary = toBinary(PolicySchema, jsonData);

          const recipe = Buffer.from(binary).toString("base64");

          const policy: AppPolicy = {
            active: true,
            id: uuidv4(),
            pluginId: app.id,
            pluginVersion: String(schema.pluginVersion),
            policyVersion: 0,
            publicKey: getVaultId(),
            recipe,
          };

          const message = policyToHexMessage(policy);

          personalSign(address, message, "policy")
            .then((signature) => {
              addPolicy({ ...policy, signature })
                .then(() => {
                  setState((prevState) => ({
                    ...prevState,
                    submitting: false,
                  }));

                  form.resetFields();

                  goBack();
                  onFinish();
                })
                .catch((error: Error) => {
                  messageAPI.error(error.message);

                  setState((prevState) => ({
                    ...prevState,
                    submitting: false,
                  }));
                });
            })
            .catch((error: Error) => {
              messageAPI.error(error.message);

              setState((prevState) => ({ ...prevState, submitting: false }));
            });
        }

        break;
      }
    }
  };

  const onStepBack = (step: number) => {
    if (step > 1) {
      setState((prevState) => ({ ...prevState, step: 1 }));
    } else if (properties && step > 0) {
      setState((prevState) => ({ ...prevState, step: 0 }));
    } else {
      goBack();
    }
  };

  useEffect(() => {
    getRecipeSpecification(app.id)
      .then((schema) => {
        setState((prevState) => ({
          ...prevState,
          schema,
          step: schema.configuration?.properties ? 0 : 1,
        }));
      })
      .catch(() => {});
  }, [app]);

  useEffect(() => {
    if (hash === modalHash.policy) {
      setState((prevState) => ({ ...prevState, visible: true }));
    } else if (visible) {
      setState((prevState) => ({ ...prevState, step: 0, visible: false }));

      form.resetFields();
    }
  }, [form, hash, visible]);

  return (
    <Modal
      centered={true}
      closeIcon={step > 0 ? <ChevronLeftIcon /> : <CrossIcon />}
      footer={
        <>
          <Stack $style={{ flex: "none", width: "218px" }} />
          <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
            <Button loading={submitting} onClick={() => form.submit()}>
              {step < 2 ? "Continue" : "Submit"}
            </Button>
          </HStack>
        </>
      }
      maskClosable={false}
      onCancel={() => onStepBack(step)}
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
            src="/media/payroll.png"
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
            <Stack as="span">{app.title}</Stack>
            <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
              / Add New Policy
            </Stack>
          </HStack>
        </HStack>
      }
      width={992}
    >
      <VStack $style={{ flex: "none", gap: "16px", width: "218px" }}>
        {["Configuration", "Rules", "Scheduling"].map((item, index) => {
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
                  {passed ? <CheckIcon /> : index + 1}
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
          initialValues={
            isFeesPlugin
              ? {
                  maxTxsPerWindow: 2,
                  rateLimitWindow: 2,
                  rules: [
                    {
                      resource: "ethereum.erc20.transfer",
                      target: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                      amount: "500000000",
                      recipient: "1",
                    },
                  ],
                }
              : {}
          }
        >
          {schema ? (
            <>
              {properties && (
                <Stack $style={{ display: step === 0 ? "block" : "none" }}>
                  <Stack
                    $style={{
                      columnGap: "24px",
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                    }}
                  >
                    {Object.entries(properties).map(([key, field]) => {
                      const required =
                        !!schema.configuration?.required.includes(key);

                      let element: ReactNode;

                      switch (field.type) {
                        case "int": {
                          element = <InputNumber />;

                          break;
                        }
                        default: {
                          if (field.enum) {
                            element = (
                              <Select
                                disabled={isFeesPlugin}
                                options={field.enum.map((value) => ({
                                  label: camelCaseToTitle(value),
                                  value,
                                }))}
                              />
                            );
                          } else {
                            switch (field.format) {
                              case "date-time": {
                                element = (
                                  <DatePicker
                                    disabledDate={(current) => {
                                      return (
                                        current &&
                                        current.isBefore(dayjs(), "day")
                                      );
                                    }}
                                    format="YYYY-MM-DD HH:mm"
                                    showNow={false}
                                    showTime={{
                                      disabledHours: () => {
                                        const nextHour = dayjs()
                                          .add(1, "hour")
                                          .startOf("hour")
                                          .hour();

                                        return Array.from(
                                          { length: nextHour },
                                          (_, i) => i
                                        );
                                      },
                                      format: "HH",
                                      showMinute: false,
                                      showSecond: false,
                                    }}
                                  />
                                );

                                break;
                              }
                              default: {
                                element = <Input />;
                                break;
                              }
                            }
                            break;
                          }
                        }
                      }

                      return (
                        <Form.Item
                          key={key}
                          name={key}
                          label={camelCaseToTitle(key)}
                          rules={[{ required }]}
                        >
                          {element}
                        </Form.Item>
                      );
                    })}
                  </Stack>
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
                            new Error("Please enter at least one rule")
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
                                label="Supported Resource"
                                rules={[{ required: step > 0 }]}
                                {...restField}
                              >
                                <Select
                                  disabled={isFeesPlugin}
                                  options={schema.supportedResources.map(
                                    (resource) => ({
                                      label: resource.resourcePath?.full,
                                      value: resource.resourcePath?.full,
                                    })
                                  )}
                                />
                              </Form.Item>
                              <Form.Item<FormFieldType>
                                shouldUpdate={(prevValues, currentValues) =>
                                  prevValues.rules[name]?.resource !==
                                  currentValues.rules[name]?.resource
                                }
                                noStyle
                              >
                                {({ getFieldsValue }) => {
                                  const { rules = [] } = getFieldsValue();
                                  const { resource } = rules[name] || {};
                                  const supportedResource =
                                    schema.supportedResources.find(
                                      ({ resourcePath }) =>
                                        resourcePath?.full === resource
                                    );

                                  if (!supportedResource) return null;

                                  return (
                                    <>
                                      {supportedResource.parameterCapabilities
                                        .filter(
                                          ({ supportedTypes }) =>
                                            supportedTypes !==
                                            ConstraintType.ANY
                                        )
                                        .map(({ parameterName, required }) => (
                                          <Form.Item
                                            key={parameterName}
                                            label={snakeCaseToTitle(
                                              parameterName
                                            )}
                                            name={[name, parameterName]}
                                            rules={[
                                              {
                                                required: step > 0 && required,
                                              },
                                            ]}
                                          >
                                            <Input disabled={isFeesPlugin} />
                                          </Form.Item>
                                        ))}
                                      {supportedResource.target ===
                                        TargetType.ADDRESS && (
                                        <Form.Item
                                          label="Target"
                                          name={[name, "target"]}
                                          rules={[{ required: step > 0 }]}
                                        >
                                          <Input disabled={isFeesPlugin} />
                                        </Form.Item>
                                      )}
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
                                shouldUpdate={(prevValues, currentValues) =>
                                  prevValues.rules[name]?.resource !==
                                  currentValues.rules[name]?.resource
                                }
                                noStyle
                              >
                                {({ getFieldsValue }) => {
                                  const { rules = [] } = getFieldsValue();
                                  const { resource } = rules[name] || {};
                                  const supportedResource =
                                    schema.supportedResources.find(
                                      ({ resourcePath }) =>
                                        resourcePath?.full === resource
                                    );

                                  if (!supportedResource) return null;

                                  return supportedResource.resourcePath ? (
                                    <HStack $style={{ gap: "8px" }}>
                                      {[
                                        ...(supportedResource.resourcePath
                                          .chainId
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
                        <Button
                          disabled={isFeesPlugin}
                          onClick={() => add({})}
                          kind="secondary"
                        >
                          Add rule
                        </Button>
                      </VStack>
                    </VStack>
                  )}
                </Form.List>
              </Stack>
              <Stack
                $style={{
                  columnGap: "16px",
                  display: step === 2 ? "grid" : "none",
                  gridTemplateColumns: "repeat(2, 1fr)",
                }}
              >
                <Form.Item<FormFieldType>
                  name="maxTxsPerWindow"
                  label="Max Txs Per Window"
                >
                  <InputNumber disabled={isFeesPlugin} min={1} />
                </Form.Item>
                <Form.Item<FormFieldType>
                  name="rateLimitWindow"
                  label="Rate Limit Window (seconds)"
                >
                  <InputNumber disabled={isFeesPlugin} min={1} />
                </Form.Item>
              </Stack>
            </>
          ) : (
            <Spin centered />
          )}
        </Form>
      </VStack>
    </Modal>
  );
};
