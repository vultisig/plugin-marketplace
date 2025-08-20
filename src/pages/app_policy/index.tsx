import { create, toBinary } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Divider, Form, FormProps, message, SelectProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/Button";
import { DatePicker } from "@/components/DatePicker";
import { Input } from "@/components/Input";
import { InputNumber } from "@/components/InputNumber";
import { Select } from "@/components/Select";
import { Spin } from "@/components/Spin";
import { HStack, Stack, VStack } from "@/components/Stack";
import { Tag } from "@/components/Tag";
import { useApp } from "@/hooks/useApp";
import { useGoBack } from "@/hooks/useGoBack";
import { TrashIcon } from "@/icons/TrashIcon";
import { ConstraintSchema, MagicConstant } from "@/proto/constraint_pb";
import { ParameterConstraintSchema } from "@/proto/parameter_constraint_pb";
import {
  BillingFrequency,
  FeePolicySchema,
  FeeType,
  PolicySchema,
} from "@/proto/policy_pb";
import { Effect, RuleSchema, TargetSchema, TargetType } from "@/proto/rule_pb";
import { getVaultId } from "@/storage/vaultId";
import { routeTree } from "@/utils/constants/routes";
import { toCapitalizeFirst, toTimestamp } from "@/utils/functions";
import { signPluginPolicy } from "@/utils/services/extension";
import {
  addPluginPolicy,
  getPlugin,
  getRecipeSpecification,
  isPluginInstalled,
} from "@/utils/services/marketplace";
import { CustomRecipeSchema, Plugin, PluginPolicy } from "@/utils/types";

type RuleFieldType = {
  resource: number;
  target: string;
} & {
  [key: string]: string;
};

type FormFieldType = {
  maxTxsPerWindow: number;
  rateLimitWindow: number;
  rules: RuleFieldType[];
} & {
  [key: string]: number | string | Dayjs;
};

type InitialState = {
  plugin?: Plugin;
  schema?: CustomRecipeSchema;
  submitting?: boolean;
};

export const AppPolicyPage = () => {
  const initialState: InitialState = {};
  const [state, setState] = useState(initialState);
  const { plugin, schema, submitting } = state;
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
      resource: 0,
      ...(isFeesPlugin && {
        amount: "500000000", // Fee Max
        recipient: "1", // Vultisig Treasury
        token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      }),
    };
  }, [isFeesPlugin]);

  const resourceOptions: SelectProps["options"] = useMemo(() => {
    return schema?.supportedResources.map((resource, index) => ({
      label: resource.resourcePath?.full,
      value: index,
    }));
  }, [schema]);

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = (values) => {
    if (plugin && schema) {
      setState((prevState) => ({ ...prevState, submitting: true }));

      const rules = values.rules.map(({ resource, target, ...params }) => {
        const {
          parameterCapabilities,
          resourcePath,
          target: targetType,
        } = schema.supportedResources[resource];

        const parameterConstraints = parameterCapabilities.map(
          ({ parameterName, required, supportedTypes }) => {
            const constraint = create(ConstraintSchema, {
              denominatedIn:
                resourcePath?.chainId.toLowerCase() === "ethereum" ? "wei" : "",
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
          resource: resourcePath?.full,
          target: create(TargetSchema, {
            targetType,
            target:
              targetType === TargetType.ADDRESS
                ? { case: "address", value: target }
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
                    configuration[key] = (values[key] as Dayjs).utc().format();
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

      const finalData: PluginPolicy = {
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
          addPluginPolicy({ ...finalData, signature })
            .then(() => {
              setState((prevState) => ({ ...prevState, submitting: false }));

              form.resetFields();

              goBack(routeTree.appDetails.link(appId));
            })
            .catch((error: Error) => {
              messageApi.error(error.message);

              setState((prevState) => ({ ...prevState, submitting: false }));
            });
        })
        .catch((error: Error) => {
          messageApi.error(error.message);

          setState((prevState) => ({ ...prevState, submitting: false }));
        });
    }
  };

  useEffect(() => {
    if (isConnected) {
      isPluginInstalled(appId).then((isInstalled) => {
        if (isInstalled) {
          getPlugin(appId)
            .then((plugin) => {
              getRecipeSpecification(appId)
                .then((schema) => {
                  setState((prevState) => ({
                    ...prevState,
                    loaded: true,
                    plugin,
                    schema,
                  }));
                })
                .catch(() => {
                  goBack(routeTree.appDetails.link(appId));
                });
            })
            .catch(() => {
              goBack(routeTree.appDetails.link(appId));
            });
        } else {
          goBack(routeTree.appDetails.link(appId));
        }
      });
    }
  }, [appId, goBack, isConnected]);

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
              <HStack $style={{ gap: "8px" }}>
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
                    fontSize: "16px",
                    fontWeight: "500",
                    lineHeight: "24px",
                    padding: "0 8px",
                  }}
                >
                  {`v${schema?.pluginVersion}`}
                </Stack>
              </HStack>
              <Form
                autoComplete="off"
                form={form}
                initialValues={{ maxTxsPerWindow: 2 }}
                layout="vertical"
                onFinish={onFinishSuccess}
              >
                <Stack>
                  <Divider orientation="start" orientationMargin={0}>
                    Rules
                  </Divider>
                  <Form.List
                    name="rules"
                    rules={[
                      {
                        validator: async (_, rules) => {
                          if (!rules || rules.length < 1) {
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
                                  rules={[{ required: true }]}
                                  {...restField}
                                >
                                  <Select
                                    disabled={isFeesPlugin}
                                    options={resourceOptions}
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
                                    const { rules } = getFieldsValue();
                                    const { resource } = rules[name];
                                    const { parameterCapabilities, target } =
                                      schema.supportedResources[resource];

                                    return (
                                      <>
                                        {parameterCapabilities.map(
                                          ({ parameterName, required }) => (
                                            <Form.Item
                                              key={parameterName}
                                              label={toCapitalizeFirst(
                                                parameterName
                                              )}
                                              name={[name, parameterName]}
                                              rules={[{ required }]}
                                            >
                                              <Input disabled={isFeesPlugin} />
                                            </Form.Item>
                                          )
                                        )}
                                        {target === TargetType.ADDRESS && (
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
                              <HStack
                                $style={{ justifyContent: "space-between" }}
                              >
                                <Form.Item<FormFieldType>
                                  shouldUpdate={(prevValues, currentValues) =>
                                    prevValues.rules[name]
                                      ?.supportedResource !==
                                    currentValues.rules[name]?.supportedResource
                                  }
                                  noStyle
                                >
                                  {({ getFieldsValue }) => {
                                    const { rules } = getFieldsValue();
                                    const { resource } = rules[name];
                                    const { resourcePath } =
                                      schema.supportedResources[resource];

                                    return (
                                      <HStack $style={{ gap: "16px" }}>
                                        <Tag>{`Chain: ${resourcePath?.chainId}`}</Tag>
                                        <Tag>{`Protocol: ${resourcePath?.protocolId}`}</Tag>
                                        <Tag>{`Function: ${resourcePath?.functionId}`}</Tag>
                                      </HStack>
                                    );
                                  }}
                                </Form.Item>
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
                                      backgroundColor: colors.bgPrimary.toHex(),
                                    }}
                                  />
                                )}
                              </HStack>
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
                {schema.configuration?.properties ? (
                  <Stack>
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
                            schema.configuration?.required.includes(key);

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
                ) : (
                  <></>
                )}
                <Stack>
                  <Divider orientation="start" orientationMargin={0}>
                    Requirements
                  </Divider>
                  <HStack $style={{ gap: "16px" }}>
                    <Tag>{`Min Vultisig Version: ${schema.requirements?.minVultisigVersion}`}</Tag>
                    <Tag>{`Supported Chains: ${schema.requirements?.supportedChains.join(
                      ", "
                    )}`}</Tag>
                  </HStack>
                </Stack>
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
                gap: "8px",
                justifyContent: "end",
                maxWidth: "992px",
                padding: "12px 16px",
                width: "100%",
              }}
            >
              <Button disabled={submitting} onClick={() => goBack()}>
                Cancel
              </Button>
              <Button
                kind="primary"
                loading={submitting}
                onClick={() => form.submit()}
              >
                Submit
              </Button>
            </HStack>
          </VStack>
        </>
      ) : (
        <Spin />
      )}

      {messageHolder}
    </>
  );
};
