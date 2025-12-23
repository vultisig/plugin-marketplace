import { create, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { Empty, Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { FC, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";

import { DateCheckboxFormItem } from "@/automations/components/DateCheckboxFormItem";
import { DatePickerFormItem } from "@/automations/components/DatePickerFormItem";
import { AutomationFormSidebar } from "@/automations/components/Sidebar";
import { AutomationFormSuccess } from "@/automations/components/Success";
import { AutomationFormTitle } from "@/automations/components/Title";
import { AutomationFormToken } from "@/automations/components/Token";
import { AutomationFormProps } from "@/automations/Default";
import { AssetWidget } from "@/automations/widgets/Asset";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { TokenImage } from "@/components/TokenImage";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { CrossIcon } from "@/icons/CrossIcon";
import { PencilLineIcon } from "@/icons/PencilLineIcon";
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
  toAddress: string;
};

type DataProps = {
  asset: AssetProps;
  endDate: number;
  frequency: string;
  name: string;
  startDate: number;
};

type StateProps = {
  isAdded: boolean;
  loading: boolean;
  step: number;
  recipients: RecipientProps[];
};

export const RecurringSendsForm: FC<AutomationFormProps> = ({
  app,
  onFinish,
  schema,
}) => {
  const [state, setState] = useState<StateProps>({
    isAdded: false,
    loading: false,
    step: 1,
    recipients: [],
  });
  const { isAdded, loading, step, recipients } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing } = app;
  const { configuration, pluginId, pluginVersion, requirements } = schema;
  const { hash } = useLocation();
  const [form] = Form.useForm<DataProps>();
  const [recipientForm] = Form.useForm<RecipientProps>();
  const values = Form.useWatch([], form);
  const goBack = useGoBack();
  const colors = useTheme();
  const supportedChains = requirements?.supportedChains || [];
  const visible = hash === modalHash.automation;

  const handleAdd = (recipient: RecipientProps) => {
    recipientForm.resetFields();

    setState((prev) => ({
      ...prev,
      recipients: [...prev.recipients, recipient],
    }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, step: prev.step - 1 }));
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

  const handleRemove = (index: number) => {
    setState((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleStep = (values: DataProps) => {
    if (!configuration) return;

    if (step === 4) {
      setState((prev) => ({ ...prev, loading: true }));

      const configurationData = getConfiguration(
        configuration,
        { ...values, recipients },
        configuration.definitions
      );

        // Convert recipient amounts to consider decimals
      const recipientsWithDecimals = recipients.map((recipient) => ({
        ...recipient,
        amount: parseUnits(
          String(recipient.amount),
          values.asset.decimals
        ).toString(),
      }));

      configurationData["recipients"] = recipientsWithDecimals;

      
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

          personalSign(address, message, "policy", id)
            .then((signature) => {
              addPolicy({ ...policy, signature })
                .then(() => {
                  setState((prev) => ({ ...prev, isAdded: true }));

                  onFinish();
                })
                .catch((error: Error) => {
                  messageAPI.error(error.message);
                })
                .finally(() => {
                  setState((prev) => ({ ...prev, loading: false }));
                });
            })
            .catch((error: Error) => {
              messageAPI.error(error.message);

              setState((prev) => ({ ...prev, loading: false }));
            });
        }
      );
    } else {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  useEffect(() => {
    if (!visible) return;

    form.resetFields();

    setState((prev) => ({
      ...prev,
      isAdded: false,
      loading: false,
      step: 1,
      recipients: [],
    }));
  }, [form, visible]);

  return (
    <>
      <AutomationFormSuccess visible={visible && isAdded} />

      <Modal
        centered={true}
        closeIcon={<CrossIcon />}
        footer={
          <>
            <Stack $style={{ flex: "none", width: "218px" }} />
            <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
              <Button
                disabled={step === 2 && !recipients.length}
                loading={loading}
                onClick={() => form.submit()}
              >
                {step > 3 ? "Submit" : "Continue"}
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
        title={
          <AutomationFormTitle app={app} onBack={handleBack} step={step} />
        }
        width={992}
      >
        <AutomationFormSidebar
          steps={[
            "Select Asset",
            "Add recipients",
            "Set up frequency",
            "Overview",
          ]}
          step={step}
        />
        <Divider light vertical />
        <VStack
          $style={{
            backgroundColor: colors.bgTertiary.toHex(),
            borderRadius: "24px",
            flexGrow: 1,
            gap: "24px",
            padding: "32px",
          }}
        >
          <Form
            autoComplete="off"
            form={form}
            layout="vertical"
            onFinish={handleStep}
          >
            <Stack $style={{ display: step === 1 ? "block" : "none" }}>
              <AssetWidget chains={supportedChains} keys={["asset"]} noStyle />
            </Stack>
            <Stack $style={{ display: step === 2 ? "block" : "none" }}>
              {values?.asset && recipients.length ? (
                <Stack
                  $style={{
                    display: "grid",
                    gap: "16px",
                    gridTemplateColumns: "repeat(3, 1fr)",
                  }}
                >
                  {recipients.map((recipient, index) => (
                    <RecipientItem
                      asset={values.asset}
                      key={index}
                      onRemove={() => handleRemove(index)}
                      recipient={recipient}
                    />
                  ))}
                </Stack>
              ) : (
                <Empty description="No recipients added yet." />
              )}
            </Stack>
            <Stack
              $style={{
                columnGap: "24px",
                display: step === 3 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              <DatePickerFormItem label="End Date" name="endDate" />
              <Form.Item
                label="Frequency"
                name="frequency"
                rules={[{ required: step > 2 }]}
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
            {step === 4 && <Overview {...{ ...values, recipients }} />}
          </Form>
          {step === 2 && (
            <>
              <Divider />
              <Form
                autoComplete="off"
                form={recipientForm}
                layout="vertical"
                onFinish={handleAdd}
              >
                <Stack
                  $style={{
                    columnGap: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                  }}
                >
                  <Form.Item<RecipientProps>
                    label="Alias / Name"
                    name="alias"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item<RecipientProps>
                    label="Amount"
                    name="amount"
                    normalize={(value) => value && String(value)}
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} />
                  </Form.Item>
                </Stack>
                <Form.Item<RecipientProps>
                  label="To Address"
                  name="toAddress"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Stack $style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button onClick={() => recipientForm.submit()}>
                    Add Recipient
                  </Button>
                </Stack>
              </Form>
            </>
          )}
        </VStack>
      </Modal>
    </>
  );
};

const Overview: FC<DataProps & { recipients: RecipientProps[] }> = ({
  asset,
  endDate,
  frequency,
  recipients,
  startDate,
}) => {
  const colors = useTheme();

  return (
    <VStack $style={{ gap: "16px" }}>
      <VStack
        $style={{
          backgroundColor: colors.bgPrimary.toHex(),
          borderRadius: "24px",
          flexGrow: 1,
          gap: "16px",
          padding: "32px",
        }}
      >
        <HStack
          $style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
            Name
          </Stack>
          <Form.Item name="name" noStyle>
            <Stack
              as={Input}
              placeholder="Automation Name"
              size="small"
              $style={{ height: "34px", width: "140px" }}
            />
          </Form.Item>
        </HStack>
        <Divider light />
        {!!startDate && (
          <>
            <HStack
              $style={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
                Start Date
              </Stack>
              <Stack as="span">
                {dayjs(startDate).format("YYYY-MM-DD HH:mm")}
              </Stack>
            </HStack>
            <Divider light />
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
              <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
                End Date
              </Stack>
              <Stack as="span">
                {dayjs(endDate).format("YYYY-MM-DD HH:mm")}
              </Stack>
            </HStack>
            <Divider light />
          </>
        )}
        <HStack
          $style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
            Frequency
          </Stack>
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
            {kebabCaseToTitle(frequency)}
          </Stack>
        </HStack>
        <Divider light />
        <HStack
          $style={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
            Asset
          </Stack>
          <AutomationFormToken chain={asset.chain} id={asset.token} />
        </HStack>
      </VStack>
      <Divider />
      <Stack
        $style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {recipients.map((recipient, index) => (
          <RecipientItem asset={asset} key={index} recipient={recipient} />
        ))}
      </Stack>
    </VStack>
  );
};

const RecipientItem: FC<{
  asset: AssetProps;
  onEdit?: () => void;
  onRemove?: () => void;
  recipient: RecipientProps;
}> = ({ asset, onEdit, onRemove, recipient }) => {
  const [{ id, logo = "", ticker }, setToken] = useState<Partial<Token>>({});
  const { chain, token } = asset;
  const { alias, amount, toAddress } = recipient;
  const { getTokenData } = useQueries();
  const colors = useTheme();

  useEffect(() => {
    let cancelled = false;

    if (token) {
      getTokenData(chain, token)
        .then((token) => {
          if (!cancelled) setToken(token);
        })
        .catch(() => {});
    } else {
      setToken(nativeTokens[chain]);
    }

    return () => {
      cancelled = true;
    };
  }, [chain, token]);

  return (
    <HStack
      $style={{
        alignItems: "center",
        backgroundColor: colors.bgPrimary.toHex(),
        borderColor: colors.borderLight.toHex(),
        borderRadius: "16px",
        borderStyle: "solid",
        borderWidth: "1px",
        fontSize: "12px",
        gap: "8px",
        lineHeight: "16px",
        overflow: "hidden",
        padding: "12px 16px",
        position: "relative",
      }}
    >
      <VStack $style={{ flexGrow: "1", gap: "4px", overflow: "hidden" }}>
        <VStack>
          <Stack
            as="span"
            $style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {alias}
          </Stack>
          <MiddleTruncate
            $style={{ color: colors.textTertiary.toHex() }}
          >{`(${toAddress})`}</MiddleTruncate>
        </VStack>
        {ticker ? (
          <>
            <HStack $style={{ alignItems: "center", gap: "8px" }}>
              <Stack $style={{ position: "relative" }}>
                <TokenImage
                  alt={ticker}
                  borderRadius="50%"
                  height="16px"
                  src={logo}
                  width="16px"
                />
                {!!id && (
                  <Stack
                    $style={{
                      bottom: "-2px",
                      position: "absolute",
                      right: "-2px",
                    }}
                  >
                    <TokenImage
                      alt={chain}
                      borderRadius="50%"
                      height="10px"
                      src={`/tokens/${chain.toLowerCase()}.svg`}
                      width="10px"
                    />
                  </Stack>
                )}
              </Stack>
              <Stack as="span">{toNumberFormat(amount)}</Stack>
              <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
                {ticker}
              </Stack>
            </HStack>
          </>
        ) : (
          <HStack as={Spin} size="small" />
        )}
      </VStack>
      {(onEdit || onRemove) && (
        <VStack $style={{ flex: "none", gap: "12px" }}>
          {onEdit && (
            <Button
              icon={<PencilLineIcon />}
              kind="info"
              onClick={onEdit}
              ghost
            />
          )}
          {onRemove && (
            <Button
              icon={<TrashIcon />}
              kind="danger"
              onClick={onRemove}
              ghost
            />
          )}
        </VStack>
      )}
    </HStack>
  );
};
