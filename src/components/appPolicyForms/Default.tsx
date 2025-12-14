import { create, JsonObject, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { Form, FormProps, Input, Modal, Select } from "antd";
import { FC, Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";

import { AppPolicyFormConfiguration } from "@/components/appPolicyForms/components/Configuration";
import { AppPolicyFormSidebar } from "@/components/appPolicyForms/components/Sidebar";
import { AppPolicyFormSuccess } from "@/components/appPolicyForms/components/Success";
import { AppPolicyFormTitle } from "@/components/appPolicyForms/components/Title";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { CrossIcon } from "@/icons/CrossIcon";
import { TrashIcon } from "@/icons/TrashIcon";
import {
  ConstraintSchema,
  ConstraintType,
  MagicConstant,
} from "@/proto/constraint_pb";
import { ParameterConstraintSchema } from "@/proto/parameter_constraint_pb";
import { PolicySchema } from "@/proto/policy_pb";
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
  getConfiguration,
  getFeePolicies,
  policyToHexMessage,
  snakeCaseToTitle,
} from "@/utils/functions";
import { App, AppPolicy, RecipeSchema } from "@/utils/types";

type FormFieldType = { rules: JsonObject[] } & JsonObject;

export type DefaultPolicyFormProps = {
  app: App;
  onFinish: () => void;
  schema: RecipeSchema;
};

export const DefaultPolicyForm: FC<DefaultPolicyFormProps> = ({
  app,
  onFinish,
  schema,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState({
    isAdded: false,
    loading: false,
    step: 1,
  });
  const { isAdded, loading, step } = state;
  const { messageAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing } = app;
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
  const goBack = useGoBack();
  const colors = useTheme();
  const supportedChains = requirements?.supportedChains || [];
  const visible = hash === modalHash.policy;

  const steps = useMemo(() => {
    return [...(configuration ? [t("configuration")] : []), t("rules")];
  }, [configuration]);

  const handleBack = () => {
    if (step > 1) {
      setState((prevState) => ({ ...prevState, step: prevState.step - 1 }));
    } else {
      goBack();
    }
  };

  const handleSign = (values: JsonObject, rules: JsonObject[]) => {
    setState((prevState) => ({ ...prevState, loading: true }));

    const jsonData = create(PolicySchema, {
      author: "",
      configuration: configuration
        ? getConfiguration(configuration, values, configuration.definitions)
        : undefined,
      description: "",
      feePolicies: getFeePolicies(pricing),
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
            description: description as string,
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
            resource: resource as string,
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
            setState((prevState) => ({ ...prevState, isAdded: true }));

            onFinish();
          })
          .catch((error: Error) => {
            messageAPI.error(error.message);
          })
          .finally(() => {
            setState((prevState) => ({ ...prevState, loading: false }));
          });
      })
      .catch((error: Error) => {
        messageAPI.error(error.message);

        setState((prevState) => ({ ...prevState, loading: false }));
      });
  };

  const handleSuggest = (values: JsonObject) => {
    if (!configuration) return;

    setState((prevState) => ({ ...prevState, loading: true }));

    const configurationData = getConfiguration(
      configuration,
      values,
      configuration.definitions
    );

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
      const formRules = rules.map(
        ({ parameterConstraints, resource, target }) => {
          const params: JsonObject = { resource };

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

        setTimeout(() => {
          setState((prevState) => ({ ...prevState, step: steps.length }));

          handleSign(values, formRules);
        }, 0);
      } else {
        setState((prevState) => ({
          ...prevState,
          loading: false,
          step: steps.length,
        }));
      }
    });
  };

  const onFinishSuccess: FormProps<FormFieldType>["onFinish"] = ({
    rules = [],
    ...values
  }) => {
    if (steps.length === step) {
      handleSign(values, rules);
    } else if (steps.length - 1 === step) {
      handleSuggest(values);
    }
  };

  useEffect(() => {
    if (!visible) return;

    form.resetFields();
    setState((prevState) => ({
      ...prevState,
      isAdded: false,
      loading: false,
      step: 1,
    }));
  }, [form, visible]);

  return isAdded ? (
    <AppPolicyFormSuccess visible={visible} />
  ) : (
    <Modal
      centered={true}
      closeIcon={<CrossIcon />}
      footer={
        <>
          <Stack $style={{ flex: "none", width: "218px" }} />
          <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
            <Button loading={loading} onClick={() => form.submit()}>
              {configuration
                ? step > 1
                  ? t("submit")
                  : t("continue")
                : t("submit")}
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
      title={<AppPolicyFormTitle app={app} step={step} onBack={handleBack} />}
      width={992}
    >
      <AppPolicyFormSidebar step={step} steps={steps} />
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
                display: step === steps.length - 1 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              <AppPolicyFormConfiguration
                chains={supportedChains}
                configuration={configuration}
                definitions={configuration.definitions}
              />
            </Stack>
          )}
          <Stack $style={{ display: step === steps.length ? "block" : "none" }}>
            <Form.List
              name="rules"
              rules={[
                {
                  validator: async (_, rules) => {
                    if (step === steps.length && (!rules || rules.length < 1)) {
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
                            rules={[{ required: step === steps.length }]}
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
                                            required:
                                              step === steps.length && required,
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
                                      rules={[
                                        { required: step === steps.length },
                                      ]}
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
