import { create, toBinary } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Divider, Form, FormProps, message, Steps, StepsProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/Button";
import { DatePicker } from "@/components/DatePicker";
import { Input } from "@/components/Input";
import { InputNumber } from "@/components/InputNumber";
import { RequirementsModal } from "@/components/RequirementsModal";
import { Select } from "@/components/Select";
import { Spin } from "@/components/Spin";
import { HStack, Stack, VStack } from "@/components/Stack";
import { useApp } from "@/hooks/useApp";
import { useGoBack } from "@/hooks/useGoBack";
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
import { modalHash } from "@/utils/constants/core";
import { routeTree } from "@/utils/constants/routes";
import { toCapitalizeFirst, toTimestamp } from "@/utils/functions";
import { signPluginPolicy } from "@/utils/services/extension";
import {
  addPolicy,
  getApp,
  getRecipeSpecification,
  getRecipeSuggestion,
  isAppInstalled,
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

type InitialState = {
  plugin?: App;
  schema?: CustomRecipeSchema;
  step: number;
  submitting?: boolean;
};

export const AppPolicyPage = () => {
  const initialState: InitialState = { step: 0 };
  const [state, setState] = useState(initialState);
  const { plugin, schema, step, submitting } = state;
  const { appId = "" } = useParams<{ appId: string; policyId: string }>();
  const { isConnected } = useApp();
  const [form] = Form.useForm<FormFieldType>();
  const [messageApi, messageHolder] = message.useMessage();
  const goBack = useGoBack();
  const colors = useTheme();

  const isFeesPlugin = useMemo(() => {
    return schema?.pluginId === "vultisig-fees-feee";
  }, [schema]);

  const ruleInitValues = useMemo(() => {
    return {
      ...(isFeesPlugin && {
        amount: "500000000", // Fee Max
        recipient: "1", // Vultisig Treasury
        token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      }),
    };
  }, [isFeesPlugin]);

  const handleBack = useCallback(() => {
    goBack(routeTree.appDetails.link(appId));
  }, [appId, goBack]);

  const onChangeStep: StepsProps["onChange"] = (step) => {
    setState((prevState) => ({ ...prevState, step }));
  };

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = (values) => {
    switch (step) {
      case 0: {
        getRecipeSuggestion(appId, values as Record<string, string>).then(
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

            onChangeStep(1);
          }
        );

        break;
      }
      case 1: {
        onChangeStep(2);

        break;
      }
      default: {
        if (plugin && schema) {
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

          const feePolicies = plugin.pricing.map((price) => {
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

          const binaryData = toBinary(PolicySchema, jsonData);

          const base64Data = Buffer.from(binaryData).toString("base64");

          const finalData: AppPolicy = {
            active: true,
            id: uuidv4(),
            pluginId: plugin.id,
            pluginVersion: String(schema.pluginVersion),
            policyVersion: 0,
            publicKey: getVaultId(),
            recipe: base64Data,
          };

          signPluginPolicy(finalData)
            .then((signature) => {
              addPolicy({ ...finalData, signature })
                .then(() => {
                  setState((prevState) => ({
                    ...prevState,
                    submitting: false,
                  }));

                  form.resetFields();

                  handleBack();
                })
                .catch((error: Error) => {
                  messageApi.error(error.message);

                  setState((prevState) => ({
                    ...prevState,
                    submitting: false,
                  }));
                });
            })
            .catch((error: Error) => {
              messageApi.error(error.message);

              setState((prevState) => ({ ...prevState, submitting: false }));
            });
        }

        break;
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      isAppInstalled(appId).then((isInstalled) => {
        if (isInstalled) {
          getApp(appId)
            .then((plugin) => {
              getRecipeSpecification(appId)
                .then((schema) => {
                  setState((prevState) => ({
                    ...prevState,
                    plugin,
                    schema,
                    step: schema.configuration?.properties ? 0 : 1,
                  }));
                })
                .catch(() => {
                  handleBack();
                });
            })
            .catch(() => {
              handleBack();
            });
        } else {
          handleBack();
        }
      });
    }
  }, [appId, handleBack, isConnected]);

  return (
    <>
      {plugin && schema ? (
        <>
          <VStack $style={{ alignItems: "center", flexGrow: "1" }}>
            <VStack
              $style={{
                gap: "24px",
                maxWidth: "992px",
                padding: "32px 16px",
                width: "100%",
              }}
            >
              <HStack
                $style={{
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "space-between",
                }}
              >
                <Stack
                  as="span"
                  $style={{
                    fontSize: "22px",
                    fontWeight: "500",
                    lineHeight: "24px",
                  }}
                >
                  {`Configure ${schema?.pluginName}`}
                </Stack>
                <Stack
                  as="span"
                  $style={{
                    backgroundColor: colors.bgSecondary.toHex(),
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "24px",
                    padding: "0 12px",
                  }}
                >
                  {`Version ${schema?.pluginVersion}`}
                </Stack>
              </HStack>
              <Steps
                current={step}
                items={[
                  {
                    title: "Configuration",
                  },
                  {
                    disabled: step < 1,
                    title: "Rules",
                  },
                  {
                    disabled: step < 2,
                    title: "Scheduling",
                  },
                ]}
                onChange={onChangeStep}
                size="small"
              />
              <Form
                autoComplete="off"
                form={form}
                layout="vertical"
                onFinish={onFinishSuccess}
              >
                {!!schema?.configuration?.properties && (
                  <Stack $style={{ display: step === 0 ? "block" : "none" }}>
                    <Divider orientation="start" orientationMargin={0}>
                      Configuration
                    </Divider>
                    <Stack
                      $style={{
                        columnGap: "16px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                      }}
                      $media={{
                        lg: {
                          $style: { gridTemplateColumns: "repeat(3, 1fr)" },
                        },
                      }}
                    >
                      {Object.entries(schema.configuration.properties).map(
                        ([key, field]) => {
                          const required =
                            !!schema.configuration?.required.includes(key);

                          let element: ReactNode;

                          if (field.enum) {
                            element = (
                              <Select
                                disabled={isFeesPlugin}
                                options={field.enum.map((value) => ({
                                  label: toCapitalizeFirst(value),
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
                          }

                          return (
                            <Form.Item
                              key={key}
                              name={key}
                              label={toCapitalizeFirst(key)}
                              rules={[{ required }]}
                            >
                              {element}
                            </Form.Item>
                          );
                        }
                      )}
                    </Stack>
                  </Stack>
                )}
                <Stack $style={{ display: step === 1 ? "block" : "none" }}>
                  <Divider orientation="start" orientationMargin={0}>
                    Rules
                  </Divider>
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
                                $media={{
                                  lg: {
                                    $style: {
                                      gridTemplateColumns: "repeat(3, 1fr)",
                                    },
                                  },
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
                                          .map(
                                            ({ parameterName, required }) => (
                                              <Form.Item
                                                key={parameterName}
                                                label={toCapitalizeFirst(
                                                  parameterName
                                                )}
                                                name={[name, parameterName]}
                                                rules={[
                                                  {
                                                    required:
                                                      step > 0 && required,
                                                  },
                                                ]}
                                              >
                                                <Input
                                                  disabled={isFeesPlugin}
                                                />
                                              </Form.Item>
                                            )
                                          )}
                                        {supportedResource.target ===
                                          TargetType.ADDRESS && (
                                          <Form.Item
                                            label="Target"
                                            name={[name, "target"]}
                                            rules={[{ required: true }]}
                                          >
                                            <Input />
                                          </Form.Item>
                                        )}
                                      </>
                                    );
                                  }}
                                </Form.Item>
                              </Stack>
                              <Stack
                                $style={{
                                  display: "flex",
                                  flexDirection: "row-reverse",
                                  justifyContent: "space-between",
                                }}
                              >
                                {fields.length > 1 && (
                                  <Stack
                                    as={TrashIcon}
                                    onClick={() => remove(name)}
                                    $style={{
                                      borderRadius: "50%",
                                      color: colors.error.toHex(),
                                      cursor: "pointer",
                                      fontSize: "24px",
                                      padding: "4px",
                                    }}
                                    $hover={{
                                      backgroundColor:
                                        colors.bgSecondary.toHex(),
                                    }}
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
                                          `Chain: ${toCapitalizeFirst(
                                            supportedResource.resourcePath
                                              .chainId
                                          )}`,
                                          `Protocol: ${toCapitalizeFirst(
                                            supportedResource.resourcePath
                                              .protocolId
                                          )}`,
                                          `Function: ${toCapitalizeFirst(
                                            supportedResource.resourcePath
                                              .functionId
                                          )}`,
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
                            <Stack
                              as={Divider}
                              $style={{ margin: "0" }}
                              dashed
                            />
                          </Fragment>
                        ))}
                        <VStack>
                          {errors.length > 0 && (
                            <Stack as={Form.Item} $style={{ margin: "0" }}>
                              <Form.ErrorList errors={errors} />
                            </Stack>
                          )}
                          <Button onClick={() => add(ruleInitValues)}>
                            Add rule
                          </Button>
                        </VStack>
                      </VStack>
                    )}
                  </Form.List>
                </Stack>
                {step > 1 && (
                  <Stack>
                    <Divider orientation="start" orientationMargin={0}>
                      Scheduling
                    </Divider>
                    <Stack
                      $style={{
                        columnGap: "16px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                      }}
                      $media={{
                        lg: {
                          $style: { gridTemplateColumns: "repeat(3, 1fr)" },
                        },
                      }}
                    >
                      <Form.Item<FormFieldType>
                        name="maxTxsPerWindow"
                        label="Max Txs Per Window"
                      >
                        <InputNumber min={1} />
                      </Form.Item>
                      <Form.Item<FormFieldType>
                        name="rateLimitWindow"
                        label="Rate Limit Window (seconds)"
                      >
                        <InputNumber min={1} />
                      </Form.Item>
                    </Stack>
                  </Stack>
                )}
              </Form>
            </VStack>
          </VStack>
          <VStack
            $style={{
              alignItems: "center",
              backgroundColor: colors.bgPrimary.toHex(),
              borderTopColor: colors.borderLight.toHex(),
              borderTopStyle: "solid",
              borderTopWidth: "1px",
              bottom: "0",
              position: "sticky",
              zIndex: "2",
            }}
          >
            <HStack
              $style={{
                alignItems: "center",
                gap: "8px",
                justifyContent: "space-between",
                maxWidth: "992px",
                padding: "12px 16px",
                width: "100%",
              }}
            >
              <Button href={modalHash.requirements} status="warning">
                Requirements
              </Button>
              <HStack $style={{ gap: "8px" }}>
                <Button
                  disabled={submitting}
                  onClick={() =>
                    step > (schema.configuration?.properties ? 0 : 1)
                      ? onChangeStep(step - 1)
                      : handleBack()
                  }
                >
                  {step > 0 ? "Back" : "Cancel"}
                </Button>
                <Button
                  kind="primary"
                  loading={submitting}
                  onClick={() => form.submit()}
                >
                  {step < 2 ? "Continue" : "Submit"}
                </Button>
              </HStack>
            </HStack>
          </VStack>
          {schema.requirements ? (
            <RequirementsModal {...schema.requirements} />
          ) : (
            <></>
          )}
        </>
      ) : (
        <Spin centered />
      )}

      {messageHolder}
    </>
  );
};
