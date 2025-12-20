import { create, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { FC, Fragment, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { DateCheckboxFormItem } from "@/automations/components/DateCheckboxFormItem";
import { DatePickerFormItem } from "@/automations/components/DatePickerFormItem";
import { AppPolicyFormSidebar } from "@/automations/components/Sidebar";
import { AppPolicyFormTitle } from "@/automations/components/Title";
import { AutomationFormProps } from "@/automations/Default";
import { AssetWidget } from "@/automations/widgets/Asset";
import { SuccessModal } from "@/components/SuccessModal";
import { TokenImage } from "@/components/TokenImage";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { CrossIcon } from "@/icons/CrossIcon";
import { TrashIcon } from "@/icons/TrashIcon";
import { PolicySchema } from "@/proto/policy_pb";
import { getVaultId } from "@/storage/vaultId";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { addPolicy, getRecipeSuggestion } from "@/utils/api";
import { Chain, nativeTokens } from "@/utils/chain";
import { modalHash } from "@/utils/constants";
import { personalSign } from "@/utils/extension";
import { frequencies } from "@/utils/frequencies";
import {
  camelCaseToTitle,
  getConfiguration,
  getFeePolicies,
  kebabCaseToTitle,
  policyToHexMessage,
  toNumberFormat,
} from "@/utils/functions";
import { AppPolicy, Token } from "@/utils/types";

type AssetProps = {
  address: string;
  chain: Chain;
  decimals: number;
  token: string;
};

type RecipientProps = {
  alias: string;
  amount: string;
  asset: AssetProps;
  toAddress: string;
};

type DataProps = {
  endDate: number;
  frequency: string;
  name: string;
  recipients: RecipientProps[];
  startDate: number;
};

export const RecurringSendsForm: FC<AutomationFormProps> = ({
  app,
  onFinish,
  schema,
}) => {
  const [state, setState] = useState({
    isAdded: false,
    loading: false,
    step: 1,
  });
  const { isAdded, loading, step } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing } = app;
  const { configuration, pluginId, pluginVersion, requirements } = schema;
  const { hash } = useLocation();
  const [form] = Form.useForm<DataProps>();
  const values = Form.useWatch([], form);
  const goBack = useGoBack();
  const colors = useTheme();
  const supportedChains = requirements?.supportedChains || [];
  const visible = hash === modalHash.policy;

  const handleBack = () => {
    setState((prevState) => ({ ...prevState, step: prevState.step - 1 }));
  };

  const handleCancel = () => {
    if (step === 3) {
      const confirm = modalAPI.confirm({
        centered: true,
        content: (
          <VStack $style={{ gap: "24px" }}>
            <VStack $style={{ gap: "12px" }}>
              <Stack
                $style={{
                  fontSize: "22px",
                  lineHeight: "24px",
                  textAlign: "center",
                }}
              >
                Unsaved Changes
              </Stack>
              <Stack
                $style={{
                  color: colors.textTertiary.toHex(),
                  lineHeight: "18px",
                  textAlign: "center",
                }}
              >
                Are you sure you want to leave?
              </Stack>
            </VStack>
            <HStack $style={{ gap: "12px", justifyContent: "center" }}>
              <Stack
                as={Button}
                onClick={() => confirm.destroy()}
                $style={{ width: "100%" }}
              >
                No, go back
              </Stack>
              <Stack
                as={Button}
                kind="danger"
                onClick={() => {
                  confirm.destroy();
                  goBack();
                }}
                $style={{ width: "100%" }}
              >
                Yes, leave
              </Stack>
            </HStack>
          </VStack>
        ),
        footer: null,
        icon: null,
        styles: { container: { padding: "32px 24px 24px" } },
      });
    } else {
      goBack();
    }
  };

  const handleStep = () => {
    form
      .validateFields()
      .then(() => {
        if (step === 1) {
          form.setFieldValue("recipients", [{}]);

          setState((prevState) => ({ ...prevState, step: prevState.step + 1 }));
        } else if (step === 2) {
          setState((prevState) => ({ ...prevState, step: prevState.step + 1 }));
        } else {
          handleSubmit();
        }
      })
      .catch(() => {});
  };

  const handleSubmit = () => {
    if (!configuration) return;

    setState((prevState) => ({ ...prevState, loading: true }));

    const configurationData = getConfiguration(
      configuration,
      values,
      configuration.definitions
    );

    getRecipeSuggestion(id, configurationData).then(
      ({ maxTxsPerWindow, rateLimitWindow, rules = [] }) => {
        const jsonData = create(PolicySchema, {
          author: "",
          configuration: configurationData,
          description: "",
          feePolicies: getFeePolicies(pricing),
          id: pluginId,
          maxTxsPerWindow,
          name: values.name || "",
          rateLimitWindow,
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
      }
    );
  };

  useEffect(() => {
    if (!visible) return;

    form.resetFields();

    setState({ isAdded: false, loading: false, step: 1 });
  }, [form, visible]);

  if (!configuration) return null;

  return (
    <>
      <SuccessModal onClose={() => goBack()} visible={visible && isAdded}>
        <Stack as="span" $style={{ fontSize: "22px", lineHeight: "24px" }}>
          Success!
        </Stack>
        <Stack
          as="span"
          $style={{ color: colors.textTertiary.toHex(), lineHeight: "18px" }}
        >
          New Automation is added
        </Stack>
      </SuccessModal>

      <Modal
        centered={true}
        closeIcon={<CrossIcon />}
        footer={
          <>
            <Stack $style={{ flex: "none", width: "218px" }} />
            <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
              <Button loading={loading} onClick={handleStep}>
                {step > 2 ? "Submit" : "Continue"}
              </Button>
            </HStack>
          </>
        }
        maskClosable={false}
        onCancel={handleCancel}
        open={visible && !isAdded}
        styles={{
          body: { display: "flex", gap: 32 },
          footer: { display: "flex", gap: 65, marginTop: 24 },
          header: { marginBottom: 32 },
        }}
        title={<AppPolicyFormTitle app={app} onBack={handleBack} step={step} />}
        width={992}
      >
        <AppPolicyFormSidebar
          steps={["Automations", "Add recipients", "Overview"]}
          step={step}
        />
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
          <Form autoComplete="off" form={form} layout="vertical">
            <Stack
              $style={{
                columnGap: "24px",
                display: step === 1 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              <DatePickerFormItem label="End Date" name="endDate" />
              <Form.Item
                label="Frequency"
                name="frequency"
                rules={[{ required: true }]}
              >
                <Select
                  options={frequencies.map((value) => ({
                    label: kebabCaseToTitle(value),
                    value,
                  }))}
                />
              </Form.Item>
              <DateCheckboxFormItem name="startDate" />
            </Stack>
            <Stack $style={{ display: step === 2 ? "block" : "none" }}>
              <Form.List
                name="recipients"
                rules={[
                  {
                    validator: async (_, recipients) => {
                      if (step > 1 && (!recipients || recipients.length < 1)) {
                        return Promise.reject(
                          new Error("Please enter at least one recipient")
                        );
                      }
                    },
                  },
                ]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <VStack $style={{ gap: "24px" }}>
                    {fields.map(({ key, name }) => (
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
                              label="Alias / Name"
                              name={[name, "alias"]}
                              rules={[{ required: step === 2 }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              label="Amount"
                              name={[name, "amount"]}
                              rules={[{ required: step === 2 }]}
                            >
                              <InputNumber min={0} />
                            </Form.Item>
                            <AssetWidget
                              chains={supportedChains}
                              keys={[String(name), "asset"]}
                              prefixKeys={["recipients"]}
                            />
                            <VStack
                              as={Form.Item}
                              label="To Address"
                              name={[name, "toAddress"]}
                              rules={[{ required: step === 2 }]}
                              $style={{ gap: "16px", gridColumn: "1 / -1" }}
                            >
                              <Input />
                            </VStack>
                          </Stack>
                          <Stack
                            $style={{
                              display: "flex",
                              justifyContent: "flex-end",
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
                          </Stack>
                        </VStack>
                        <Divider />
                      </Fragment>
                    ))}
                    <VStack>
                      {errors.length > 0 && (
                        <Stack as={Form.Item} $style={{ margin: "0" }}>
                          <Form.ErrorList errors={errors} />
                        </Stack>
                      )}
                      <Button onClick={() => add({})} kind="secondary">
                        Add Recipient
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </Form.List>
            </Stack>
            {step === 3 && <Overview {...values} />}
          </Form>
        </VStack>
      </Modal>
    </>
  );
};

const Overview: FC<DataProps> = ({
  endDate,
  frequency,
  recipients,
  startDate,
}) => {
  const colors = useTheme();

  return (
    <VStack $style={{ gap: "16px" }}>
      <HStack
        $style={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack as="span">Name</Stack>
        <Form.Item name="name" noStyle>
          <Stack
            as={Input}
            placeholder="Automation Name"
            size="small"
            $style={{ height: "34px", width: "140px" }}
          />
        </Form.Item>
      </HStack>
      <Divider />
      {!!startDate && (
        <>
          <HStack
            $style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack as="span">Start Date</Stack>
            <Stack as="span">
              {dayjs(startDate).format("YYYY-MM-DD HH:mm")}
            </Stack>
          </HStack>
          <Divider />
        </>
      )}
      {!!endDate && (
        <>
          <HStack
            $style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack as="span">End Date</Stack>
            <Stack as="span">{dayjs(endDate).format("YYYY-MM-DD HH:mm")}</Stack>
          </HStack>
          <Divider />
        </>
      )}
      <HStack
        $style={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack as="span">Frequency</Stack>
        <Stack
          as="span"
          $style={{
            backgroundColor: colors.accentFour.toRgba(0.1),
            borderRadius: "4px",
            color: colors.accentFour.toHex(),
            lineHeight: "20px",
            padding: "0 8px",
          }}
        >
          {camelCaseToTitle(frequency)}
        </Stack>
      </HStack>
      <Divider />
      {recipients.map(({ alias, amount, asset, toAddress }, index) => (
        <Fragment key={index}>
          <HStack
            $style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack as="span">Alias / Name</Stack>
            <Stack as="span">{alias}</Stack>
          </HStack>
          <Divider />
          <HStack
            $style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack as="span">Amount</Stack>
            <Stack as="span">{toNumberFormat(amount)}</Stack>
          </HStack>
          <Divider />
          <HStack
            $style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack as="span">Asset</Stack>
            <OverviewItem {...asset} />
          </HStack>
          <Divider />
          <HStack
            $style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack as="span">To Address</Stack>
            <Stack as="span">{toAddress}</Stack>
          </HStack>
        </Fragment>
      ))}
    </VStack>
  );
};

const OverviewItem: FC<AssetProps> = (asset) => {
  const [token, setToken] = useState<Token | undefined>(undefined);
  const { getTokenData } = useQueries();

  useEffect(() => {
    if (!asset) return;
    let cancelled = false;

    if (asset.token) {
      getTokenData(asset.chain, asset.token)
        .catch(() => undefined)
        .then((token) => {
          if (!cancelled) setToken(token);
        });
    } else {
      setToken(nativeTokens[asset.chain]);
    }

    return () => {
      cancelled = true;
    };
  }, [asset]);

  if (!token) return <Spin size="small" />;

  return (
    <HStack
      $style={{
        alignItems: "center",
        gap: "8px",
        justifyContent: "center",
      }}
    >
      <Stack $style={{ position: "relative" }}>
        <TokenImage
          alt={token.ticker}
          borderRadius="50%"
          height="20px"
          src={token.logo}
          width="20px"
        />
        {!!token.id && (
          <Stack
            $style={{ bottom: "-2px", position: "absolute", right: "-2px" }}
          >
            <TokenImage
              alt={token.chain}
              borderRadius="50%"
              height="12px"
              src={`/tokens/${token.chain.toLowerCase()}.svg`}
              width="12px"
            />
          </Stack>
        )}
      </Stack>
      <Stack as="span" $style={{ lineHeight: "20px" }}>
        {token.ticker}
      </Stack>
    </HStack>
  );
};
