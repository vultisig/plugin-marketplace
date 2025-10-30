import { create, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import {
  Form,
  FormProps,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  TableProps,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { DynamicFormItem } from "@/components/DynamicFormItem";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { useCore } from "@/hooks/useCore";
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
  Policy,
  PolicySchema,
} from "@/proto/policy_pb";
import { Effect, RuleSchema, TargetSchema, TargetType } from "@/proto/rule_pb";
import { getVaultId } from "@/storage/vaultId";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import {
  addPolicy,
  delPolicy,
  getPolicies,
  getRecipeSuggestion,
} from "@/utils/api";
import { modalHash } from "@/utils/constants";
import { personalSign } from "@/utils/extension";
import {
  camelCaseToTitle,
  formatDuration,
  getSchemaRef,
  policyToHexMessage,
  snakeCaseToTitle,
  toNumberFormat,
  toTimestamp,
} from "@/utils/functions";
import {
  App,
  AppPolicy,
  CustomAppPolicy,
  FieldProps,
  RecipeSchema,
} from "@/utils/types";

type RuleFieldType = {
  description?: string;
  resource: string;
  target?: string;
} & Record<string, string>;

type FormFieldType = {
  description?: string;
  maxTxsPerWindow: number;
  rateLimitWindow: number;
  rules: RuleFieldType[];
} & Record<string, number | string | Dayjs>;

type InitialState = {
  loading: boolean;
  policies: CustomAppPolicy[];
  step: number;
  submitting?: boolean;
  totalCount: number;
};

export const AppPolicies: FC<{ app: App; schema: RecipeSchema }> = ({
  app,
  schema,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<InitialState>({
    loading: true,
    policies: [],
    step: 0,
    totalCount: 0,
  });
  const { loading, policies, step, submitting } = state;
  const { address, messageAPI, modalAPI } = useCore();
  const { id, pricing, title } = app;
  const { hash } = useLocation();
  const [form] = Form.useForm<FormFieldType>();
  const goBack = useGoBack();
  const colors = useTheme();

  const columns: TableProps<CustomAppPolicy>["columns"] = [
    Table.EXPAND_COLUMN,
    {
      dataIndex: "parsedRecipe",
      key: "name",
      render: ({ name }: Policy) => name,
      title: t("name"),
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "maxTxsPerWindow",
      render: ({ maxTxsPerWindow }: Policy) =>
        maxTxsPerWindow ? toNumberFormat(maxTxsPerWindow) : "-",
      title: t("maxTransactions"),
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "rateLimitWindow",
      render: ({ rateLimitWindow }: Policy) =>
        rateLimitWindow ? toNumberFormat(rateLimitWindow) : "-",
      title: t("rateLimit"),
    },
    {
      align: "center",
      key: "action",
      render: (_, record) => (
        <HStack $style={{ justifyContent: "center" }}>
          <Button
            icon={<TrashIcon fontSize={16} />}
            kind="danger"
            onClick={() => handleDelete(record)}
            ghost
          />
        </HStack>
      ),
      title: t("Action"),
      width: 80,
    },
  ];

  const isFeesPlugin = useMemo(() => {
    return id === import.meta.env.VITE_FEE_PLUGIN_ID;
  }, [id]);

  const properties = useMemo(() => {
    return schema.configuration?.properties;
  }, [schema]);

  const visible = useMemo(() => {
    return hash === modalHash.policy;
  }, [hash]);

  const fetchPolicies = useCallback(
    (skip: number) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getPolicies(id, { skip })
        .then(({ policies, totalCount }) => {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            policies,
            totalCount,
          }));
        })
        .catch(() => {
          setState((prevState) => ({ ...prevState, loading: false }));
        });
    },
    [id]
  );

  const handleDelete = ({ id, signature }: CustomAppPolicy) => {
    if (signature) {
      modalAPI.confirm({
        title: t("confirmPolicyDeletion"),
        okText: t("yes"),
        okType: "danger",
        cancelText: t("no"),
        onOk() {
          setState((prevState) => ({ ...prevState, loading: true }));

          delPolicy(id, signature)
            .then(() => {
              messageAPI.success(t("successfulPolicyDeletion"));

              fetchPolicies(0);
            })
            .catch(() => {
              messageAPI.error(t("unsuccessfulPolicyDeletion"));

              setState((prevState) => ({ ...prevState, loading: false }));
            });
        },
      });
    } else {
      messageAPI.error(t("unsuccessfulPolicyDeletion"));
    }
  };

  const handleStepBack = (step: number) => {
    if (step > 1) {
      setState((prevState) => ({ ...prevState, step: 1 }));
    } else if (properties && step > 0) {
      setState((prevState) => ({ ...prevState, step: 0 }));
    } else {
      goBack();
    }
  };

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = ({
    description = "",
    maxTxsPerWindow,
    rateLimitWindow,
    rules,
    ...values
  }) => {
    if (!submitting) {
      switch (step) {
        case 0: {
          setState((prevState) => ({ ...prevState, submitting: true }));

          getRecipeSuggestion(id, {
            maxTxsPerWindow,
            rateLimitWindow,
            rules,
          }).then(({ maxTxsPerWindow = 2, rateLimitWindow, rules = [] }) => {
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

            setState((prevState) => ({
              ...prevState,
              submitting: false,
              step: 1,
            }));
          });

          break;
        }
        case 1: {
          setState((prevState) => ({ ...prevState, step: 2 }));

          break;
        }
        default: {
          if (address && schema) {
            setState((prevState) => ({ ...prevState, submitting: true }));

            const jsonData = create(PolicySchema, {
              author: "",
              configuration: properties
                ? Object.fromEntries(
                    Object.entries(properties).flatMap(([key, field]) => {
                      const v = (values as Record<string, any>)[key];
                      if (v === undefined) return [];
                      if (field.format === "date-time") {
                        return [[key, (v as Dayjs).utc().format()]];
                      }
                      return [[key, v]];
                    })
                  )
                : undefined,
              description,
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
              id: schema.pluginId,
              maxTxsPerWindow,
              name: schema.pluginName,
              rules: rules
                .filter(
                  ({ resource }) =>
                    schema.supportedResources.findIndex(
                      ({ resourcePath }) => resourcePath?.full === resource
                    ) >= 0
                )
                .map(({ description = "", resource, target, ...params }) => {
                  const {
                    parameterCapabilities,
                    resourcePath,
                    target: targetType,
                  } = schema.supportedResources.find(
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
              rateLimitWindow,
              version: schema.pluginVersion,
            });

            const binary = toBinary(PolicySchema, jsonData);

            const recipe = base64Encode(binary);

            const policy: AppPolicy = {
              active: true,
              id: uuidv4(),
              pluginId: id,
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

                    fetchPolicies(0);
                    goBack();
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
    }
  };

  useEffect(() => {
    if (visible) {
      setState((prevState) => ({ ...prevState, step: 0 }));

      form.resetFields();
    }
  }, [form, visible]);

  useEffect(() => fetchPolicies(0), [id, fetchPolicies]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={policies}
        expandable={{
          expandedRowRender: (
            { parsedRecipe: { description, rules } },
            index
          ) => {
            return (
              <VStack key={index} $style={{ gap: "8px" }}>
                {description && (
                  <>
                    <VStack>
                      <Stack
                        as="span"
                        $style={{ fontSize: "12px", lineHeight: "18px" }}
                      >
                        {t("description")}
                      </Stack>
                      <Stack
                        as="span"
                        $style={{ fontSize: "12px", lineHeight: "18px" }}
                      >
                        {description}
                      </Stack>
                    </VStack>
                    <Divider light />
                  </>
                )}
                {rules.map(
                  ({ description, parameterConstraints, target }, index) => (
                    <Fragment key={index}>
                      {index > 0 && <Divider light />}
                      <Stack
                        $style={{
                          display: "grid",
                          gap: "8px",
                          gridTemplateColumns: "repeat(3, 1fr)",
                        }}
                        $media={{
                          xl: {
                            $style: { gridTemplateColumns: "repeat(2, 1fr)" },
                          },
                        }}
                      >
                        {parameterConstraints.map(
                          ({ constraint, parameterName }) => (
                            <VStack key={parameterName}>
                              {constraint?.value.case ? (
                                <HStack
                                  $style={{ alignItems: "center", gap: "4px" }}
                                >
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "12px",
                                      lineHeight: "18px",
                                    }}
                                  >
                                    {snakeCaseToTitle(parameterName)}
                                  </Stack>
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "10px",
                                      lineHeight: "18px",
                                    }}
                                  >{`(${camelCaseToTitle(
                                    constraint.value.case
                                  )})`}</Stack>
                                </HStack>
                              ) : (
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "12px",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {snakeCaseToTitle(parameterName)}
                                </Stack>
                              )}
                              {typeof constraint?.value.value === "string" &&
                              constraint.value.value.startsWith("0x") ? (
                                <MiddleTruncate
                                  $style={{
                                    fontSize: "12px",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {constraint.value.value}
                                </MiddleTruncate>
                              ) : (
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "12px",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {constraint?.value.value || "-"}
                                </Stack>
                              )}
                            </VStack>
                          )
                        )}
                        {target ? (
                          <VStack>
                            {target.target.case ? (
                              <HStack
                                $style={{ alignItems: "center", gap: "4px" }}
                              >
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "12px",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {t("target")}
                                </Stack>
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "10px",
                                    lineHeight: "18px",
                                  }}
                                >{`(${camelCaseToTitle(
                                  target.target.case
                                )})`}</Stack>
                              </HStack>
                            ) : (
                              <Stack
                                as="span"
                                $style={{
                                  fontSize: "12px",
                                  lineHeight: "18px",
                                }}
                              >
                                {t("target")}
                              </Stack>
                            )}
                            {typeof target.target.value === "string" &&
                            target.target.value.startsWith("0x") ? (
                              <MiddleTruncate
                                $style={{
                                  fontSize: "12px",
                                  lineHeight: "18px",
                                }}
                              >
                                {target.target.value}
                              </MiddleTruncate>
                            ) : (
                              <Stack
                                as="span"
                                $style={{
                                  fontSize: "12px",
                                  lineHeight: "18px",
                                }}
                              >
                                {target.target.value || "-"}
                              </Stack>
                            )}
                          </VStack>
                        ) : (
                          <></>
                        )}
                      </Stack>
                      {description && (
                        <VStack>
                          <Stack
                            as="span"
                            $style={{ fontSize: "12px", lineHeight: "18px" }}
                          >
                            {t("description")}
                          </Stack>
                          <Stack
                            as="span"
                            $style={{ fontSize: "12px", lineHeight: "18px" }}
                          >
                            {description}
                          </Stack>
                        </VStack>
                      )}
                    </Fragment>
                  )
                )}
              </VStack>
            );
          },
        }}
        loading={loading}
        pagination={false}
        rowKey="id"
        size="small"
        id="policies"
      />
      <Modal
        centered={true}
        closeIcon={step > 0 ? <ChevronLeftIcon /> : <CrossIcon />}
        footer={
          <>
            <Stack $style={{ flex: "none", width: "218px" }} />
            <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
              <Button loading={submitting} onClick={() => form.submit()}>
                {step < 2 ? t("continue") : t("submit")}
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
              <Stack as="span">{title}</Stack>
              <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
                {`/ ${t("addPolicy")}`}
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
                        const ref = getSchemaRef(
                          field,
                          schema.configuration.definitions
                        );

                        return ref ? (
                          <Stack
                            key={key}
                            $style={{
                              columnGap: "24px",
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                            }}
                          >
                            {Object.entries(ref.properties).map(
                              ([childKey, field]) => (
                                <DynamicFormItem
                                  disabled={isFeesPlugin}
                                  key={childKey}
                                  label={camelCaseToTitle(childKey)}
                                  name={[key, childKey]}
                                  rules={[
                                    {
                                      required: ref.required.includes(childKey),
                                    },
                                  ]}
                                  {...field}
                                />
                              )
                            )}
                          </Stack>
                        ) : (
                          <DynamicFormItem
                            disabled={isFeesPlugin}
                            key={key}
                            label={camelCaseToTitle(key)}
                            name={key}
                            rules={[
                              {
                                required:
                                  schema.configuration?.required.includes(key),
                              },
                            ]}
                            {...field}
                          />
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
                                                label={snakeCaseToTitle(
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
                                            label={t("target")}
                                            name={[name, "target"]}
                                            rules={[{ required: step > 0 }]}
                                          >
                                            <Input disabled={isFeesPlugin} />
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
                            {t("addRule")}
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
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.maxTxsPerWindow !==
                        currentValues.maxTxsPerWindow ||
                      prevValues.rateLimitWindow !==
                        currentValues.rateLimitWindow
                    }
                    noStyle
                  >
                    {({ getFieldsValue }) => {
                      const { maxTxsPerWindow, rateLimitWindow } =
                        getFieldsValue();

                      return (
                        <Stack
                          $style={{
                            gridColumn: "1 / -1",
                            marginBottom: "24px",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {`${t("policyMaxTxs", { count: maxTxsPerWindow })}${
                            rateLimitWindow
                              ? ` ${t("policyRateLimit", {
                                  duration: formatDuration(rateLimitWindow),
                                })}`
                              : "."
                          }`}
                        </Stack>
                      );
                    }}
                  </Form.Item>
                  <Form.Item<FormFieldType>
                    name="maxTxsPerWindow"
                    label={t("maxTransactions")}
                  >
                    <InputNumber disabled={isFeesPlugin} min={1} />
                  </Form.Item>
                  <Form.Item<FormFieldType>
                    name="rateLimitWindow"
                    label={`${t("rateLimit")} (${t("seconds")})`}
                  >
                    <InputNumber disabled={isFeesPlugin} min={1} />
                  </Form.Item>

                  <Stack
                    as={Form.Item<FormFieldType>}
                    name="description"
                    label={t("description")}
                    $style={{ gridColumn: "1 / -1" }}
                  >
                    <Input.TextArea />
                  </Stack>
                </Stack>
              </>
            ) : (
              <Spin centered />
            )}
          </Form>
        </VStack>
      </Modal>
    </>
  );
};
