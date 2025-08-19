import { create, toBinary } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { Divider, Drawer, Form, FormProps, message, SelectProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { FC, Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/Button";
import { DatePicker } from "@/components/DatePicker";
import { Input } from "@/components/Input";
import { InputNumber } from "@/components/InputNumber";
import { Select } from "@/components/Select";
import { Spin } from "@/components/Spin";
import { HStack, Stack, VStack } from "@/components/Stack";
import { useGoBack } from "@/hooks/useGoBack";
import { ConstraintSchema, MagicConstant } from "@/proto/constraint_pb";
import { ParameterConstraintSchema } from "@/proto/parameter_constraint_pb";
import {
  BillingFrequency,
  FeePolicySchema,
  FeeType,
  PolicySchema,
} from "@/proto/policy_pb";
import { RecipeSchema } from "@/proto/recipe_specification_pb";
import { Effect, RuleSchema, TargetSchema, TargetType } from "@/proto/rule_pb";
import { getVaultId } from "@/storage/vaultId";
import { modalHash } from "@/utils/constants/core";
import { toCapitalizeFirst, toTimestamp } from "@/utils/functions";
import { signPluginPolicy } from "@/utils/services/extension";
import { addPluginPolicy } from "@/utils/services/marketplace";
import { Configuration, Plugin, PluginPolicy } from "@/utils/types";
import { Tag } from "@/components/Tag";
import { TrashIcon } from "@/icons/TrashIcon";
import { useTheme } from "styled-components";

type RuleFieldType = {
  supportedResource: number;
  [key: string]: number | string | Dayjs;
};

type FormFieldType = {
  maxTxsPerWindow: number;
  rateLimitWindow: number;
  rules: RuleFieldType[];
  target: string;
};

type PluginPolicyModalProps = {
  onFinish: () => void;
  plugin: Plugin;
  schema: Omit<RecipeSchema, "configuration"> & {
    configuration?: Configuration;
  };
};

type InitialState = {
  submitting?: boolean;
  visible?: boolean;
};

export const PluginPolicyModal: FC<PluginPolicyModalProps> = ({
  onFinish,
  plugin,
  schema,
}) => {
  const initialState: InitialState = {};
  const [state, setState] = useState(initialState);
  const { submitting, visible } = state;
  const { hash } = useLocation();
  const [form] = Form.useForm<FormFieldType>();
  const [messageApi, messageHolder] = message.useMessage();
  const goBack = useGoBack();
  const colors = useTheme();

  const isFeesPlugin = useMemo(() => {
    return schema.pluginId === "vultisig-fees-feee";
  }, [schema]);

  const resourceOptions: SelectProps["options"] = useMemo(() => {
    return schema?.supportedResources.map((resource, index) => ({
      label: resource.resourcePath?.full,
      value: index,
    }));
  }, [schema]);

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = (values) => {
    setState((prevState) => ({ ...prevState, submitting: true }));

    const {
      parameterCapabilities,
      resourcePath,
      target: targetType,
    } = schema.supportedResources[values.supportedResource];

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

    const parameterConstraints = parameterCapabilities.map(
      ({ parameterName, required, supportedTypes }) => {
        const constraint = create(ConstraintSchema, {
          denominatedIn:
            resourcePath?.chainId.toLowerCase() === "ethereum" ? "wei" : "",
          period: "",
          required,
          type: supportedTypes,
          value: { case: "fixedValue", value: values[parameterName] as string },
        });

        const parameterConstraint = create(ParameterConstraintSchema, {
          constraint: constraint,
          parameterName,
        });

        return parameterConstraint;
      }
    );

    const target = create(TargetSchema, {
      targetType,
      target:
        targetType === TargetType.ADDRESS
          ? { case: "address", value: values["target"] as string }
          : targetType === TargetType.MAGIC_CONSTANT
          ? { case: "magicConstant", value: MagicConstant.VULTISIG_TREASURY }
          : { case: undefined, value: undefined },
    });

    const rule = create(RuleSchema, {
      constraints: {},
      description: "",
      effect: Effect.ALLOW,
      id: "",
      parameterConstraints,
      resource: resourcePath?.full,
      target,
    });

    const configuration = () => {
      if (schema.configuration) {
        const configuration: Record<string, any> = {};

        // Object.entries(schema.configuration.properties).forEach(
        //   ([key, field]) => {
        //     if (values[key]) {
        //       switch (field.format) {
        //         case "date-time": {
        //           configuration[key] = (values[key] as Dayjs).utc().format();
        //           break;
        //         }
        //         default: {
        //           configuration[key] = values[key];
        //           break;
        //         }
        //       }
        //     }
        //   }
        // );

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
      rules: [rule],
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

            goBack();

            onFinish();
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
  };

  useEffect(() => {
    if (hash === modalHash.policy) {
      setState((prevState) => ({ ...prevState, visible: true }));
    } else if (visible) {
      setState((prevState) => ({ ...prevState, visible: false }));

      form.resetFields();
    }
  }, [form, hash, visible]);

  return (
    <>
      <Drawer
        footer={
          <HStack $style={{ gap: "8px", justifyContent: "end" }}>
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
        }
        maskClosable={false}
        onClose={() => goBack()}
        open={visible}
        styles={{ wrapper: { minWidth: 768 } }}
        title={
          <HStack $style={{ alignItems: "center", gap: "8px" }}>
            {`Configure ${schema.pluginName}`}
            <Tag>{`v${schema.pluginVersion}`}</Tag>
          </HStack>
        }
        width={992}
      >
        <Form
          autoComplete="off"
          form={form}
          layout="vertical"
          initialValues={{
            maxTxsPerWindow: 2,
          }}
          onFinish={onFinishSuccess}
        >
          {schema ? (
            <>
              <Stack>
                <Divider orientation="start" orientationMargin={0}>
                  Parameters
                </Divider>
                <Form.List name="rules">
                  {(fields, { add, remove }) => (
                    <VStack $style={{ gap: "24px" }}>
                      {fields.map(({ key, name, ...restField }) => (
                        <Fragment key={name}>
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
                                name={[name, "supportedResource"]}
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
                                  prevValues.rules[name]?.supportedResource !==
                                  currentValues.rules[name]?.supportedResource
                                }
                                noStyle
                              >
                                {({ getFieldsValue }) => {
                                  const { rules } = getFieldsValue();
                                  const { supportedResource } = rules[name];
                                  const { parameterCapabilities, target } =
                                    schema.supportedResources[
                                      supportedResource
                                    ];

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
                                  prevValues.rules[name]?.supportedResource !==
                                  currentValues.rules[name]?.supportedResource
                                }
                                noStyle
                              >
                                {({ getFieldsValue }) => {
                                  const { rules } = getFieldsValue();
                                  const { supportedResource } = rules[name];
                                  const { resourcePath } =
                                    schema.supportedResources[
                                      supportedResource
                                    ];

                                  return (
                                    <HStack $style={{ gap: "16px" }}>
                                      <Tag>{`Chain: ${resourcePath?.chainId}`}</Tag>
                                      <Tag>{`Protocol: ${resourcePath?.protocolId}`}</Tag>
                                      <Tag>{`Function: ${resourcePath?.functionId}`}</Tag>
                                    </HStack>
                                  );
                                }}
                              </Form.Item>
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
                            </HStack>
                          </VStack>
                          <Stack as={Divider} $style={{ margin: "0" }} dashed />
                        </Fragment>
                      ))}
                      <Form.Item>
                        <Button onClick={() => add({ supportedResource: 0 })}>
                          Add rule
                        </Button>
                      </Form.Item>
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
                    lg: { $style: { gridTemplateColumns: "repeat(3, 1fr)" } },
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
                      lg: { $style: { gridTemplateColumns: "repeat(3, 1fr)" } },
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
            </>
          ) : (
            <Spin />
          )}
        </Form>
      </Drawer>

      {messageHolder}
    </>
  );
};
