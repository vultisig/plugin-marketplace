import { create, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Form, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";

import { DatePickerFormItem } from "@/components/appPolicyForms/components/DatePickerFormItem";
import { AppPolicyFormSidebar } from "@/components/appPolicyForms/components/Sidebar";
import { AppPolicyFormSuccess } from "@/components/appPolicyForms/components/Success";
import { AppPolicyFormTitle } from "@/components/appPolicyForms/components/Title";
import { DefaultPolicyFormProps } from "@/components/appPolicyForms/Default";
import { AssetWidget } from "@/components/appPolicyForms/widgets/Asset";
import { TokenImage } from "@/components/TokenImage";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { ChevronRightIcon } from "@/icons/ChevronRightIcon";
import { CrossIcon } from "@/icons/CrossIcon";
import { PencilLineIcon } from "@/icons/PencilLineIcon";
import { PolicySchema } from "@/proto/policy_pb";
import { getVaultId } from "@/storage/vaultId";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { addPolicy, getRecipeSuggestion } from "@/utils/api";
import { Chain, chains, nativeTokens } from "@/utils/chain";
import { modalHash } from "@/utils/constants";
import { getAccount, personalSign } from "@/utils/extension";
import {
  camelCaseToTitle,
  getConfiguration,
  getFeePolicies,
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

type DataProps = {
  endDate: number;
  frequency: string;
  from: AssetProps;
  fromAmount: string;
  startDate: number;
  to: AssetProps;
};

export const RecurringSwapsPolicyForm: FC<DefaultPolicyFormProps> = ({
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
  const { messageAPI, modalAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing } = app;
  const {
    configuration,
    configurationExample,
    pluginId,
    pluginName,
    pluginVersion,
    requirements,
  } = schema;
  const { hash } = useLocation();
  const [form] = Form.useForm<DataProps>();
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
                {t("unsavedChangesTitle")}
              </Stack>
              <Stack
                $style={{
                  color: colors.textTertiary.toHex(),
                  lineHeight: "18px",
                  textAlign: "center",
                }}
              >
                {t("unsavedChangesContent")}
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
    if (step === 1) {
      form.resetFields();

      setState((prevState) => ({ ...prevState, step: 2 }));
    } else {
      form.validateFields().then((values) => {
        if (step === 2) {
          setState((prevState) => ({ ...prevState, step: 3 }));
        } else {
          handleSubmit(values);
        }
      });
    }
  };

  const handleSubmit = (values: DataProps) => {
    if (!configuration) return;

    setState((prevState) => ({ ...prevState, loading: true }));

    const configurationData = getConfiguration(
      configuration,
      values,
      configuration.definitions
    );

    // TODO: move amount to asset widget
    if ("from" in values && "fromAmount" in values) {
      configurationData["fromAmount"] = parseUnits(
        values.fromAmount,
        values.from.decimals
      ).toString();
    }

    getRecipeSuggestion(id, configurationData).then(({ rules = [] }) => {
      const jsonData = create(PolicySchema, {
        author: "",
        configuration: configurationData,
        description: "",
        feePolicies: getFeePolicies(pricing),
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
    });
  };

  const handleTemplate = (data: DataProps, edit?: boolean) => {
    form.setFieldsValue(data);

    setState((prevState) => ({ ...prevState, step: edit ? 2 : 3 }));
  };

  useEffect(() => {
    if (!visible) return;

    form.resetFields();

    setState({ isAdded: false, loading: false, step: 1 });
  }, [form, visible]);

  if (!configuration || !configurationExample) return null;

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
            <Button loading={loading} onClick={handleStep}>
              {step > 2
                ? t("submit")
                : step > 1
                ? t("continue")
                : t("createOwnAutomations")}
            </Button>
          </HStack>
        </>
      }
      maskClosable={false}
      onCancel={handleCancel}
      open={visible}
      styles={{
        body: { display: "flex", gap: 32 },
        footer: { display: "flex", gap: 65, marginTop: 24 },
        header: { marginBottom: 32 },
      }}
      title={<AppPolicyFormTitle app={app} onBack={handleBack} step={step} />}
      width={992}
    >
      <AppPolicyFormSidebar
        steps={[t("templates"), t("automations"), t("overview")]}
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
            {configurationExample.map((example, index) => (
              <Template
                key={index}
                setValues={handleTemplate}
                values={example as DataProps}
              />
            ))}
          </Stack>
          <Stack
            $style={{
              columnGap: "24px",
              display: step === 2 ? "grid" : "none",
              gridTemplateColumns: "repeat(2, 1fr)",
            }}
          >
            <DatePickerFormItem label="Start Date" name="startDate" />
            <DatePickerFormItem label="End Date" name="endDate" />
            <Form.Item
              label="Frequency"
              name="frequency"
              rules={[{ required: true }]}
            >
              <Select
                options={["daily", "weekly", "biweekly", "monthly"].map(
                  (value) => ({
                    label: camelCaseToTitle(value),
                    value,
                  })
                )}
              />
            </Form.Item>
            <Form.Item
              label="Amount"
              name="fromAmount"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <AssetWidget chains={supportedChains} fullKey={["from"]} />
            <AssetWidget chains={supportedChains} fullKey={["to"]} />
          </Stack>
          {step === 3 && <Overview {...form.getFieldsValue()} />}
        </Form>
      </VStack>
    </Modal>
  );
};

const Overview: FC<DataProps> = ({
  endDate,
  frequency,
  from,
  fromAmount,
  startDate,
  to,
}) => {
  const colors = useTheme();

  return (
    <VStack $style={{ gap: "16px" }}>
      {!!startDate && (
        <>
          <HStack
            $style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack as="span">Start Date</Stack>
            <Stack as="span">{dayjs(startDate).format("MM-DD-YYYY")}</Stack>
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
            <Stack as="span">{dayjs(endDate).format("MM-DD-YYYY")}</Stack>
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
      {from && (
        <>
          <HStack
            $style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack as="span">From</Stack>
            <OverviewItem {...from} />
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
        <Stack as="span">Amount</Stack>
        <Stack as="span">{toNumberFormat(fromAmount)}</Stack>
      </HStack>
      <Divider />
      {to && (
        <HStack
          $style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack as="span">To</Stack>
          <OverviewItem {...to} />
        </HStack>
      )}
    </VStack>
  );
};

const OverviewItem: FC<AssetProps> = (asset) => {
  const [token, setToken] = useState<Token | undefined>(undefined);
  const { getTokenData } = useQueries();

  useEffect(() => {
    if (!asset) return;

    if (asset.token) {
      getTokenData(asset.chain, asset.token)
        .catch(() => undefined)
        .then(setToken);
    } else {
      setToken(nativeTokens[asset.chain]);
    }
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

const Template: FC<{
  values: DataProps;
  setValues: (data: DataProps, edit?: boolean) => void;
}> = ({ values, setValues }) => {
  const [data, setData] = useState(values);
  const { frequency, from, fromAmount, to } = data;
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <VStack
      $style={{
        backgroundColor: colors.bgSecondary.toHex(),
        borderRadius: "12px",
        gap: "12px",
        padding: "12px",
      }}
    >
      <HStack $style={{ gap: "12px", position: "relative" }}>
        <TemplateItem
          asset={from}
          setAsset={(asset) => setData((prev) => ({ ...prev, from: asset }))}
        />
        <TemplateItem
          asset={to}
          setAsset={(asset) => setData((prev) => ({ ...prev, to: asset }))}
        />
        <VStack
          $style={{
            backgroundColor: colors.bgSecondary.toHex(),
            borderColor: colors.borderLight.toHex(),
            borderRadius: "50%",
            borderStyle: "solid",
            borderWidth: "1px",
            fontSize: "12px",
            left: "50%",
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
            padding: "8px",
          }}
          $before={{
            backgroundColor: colors.bgSecondary.toHex(),
            inset: "-2px 0",
            left: "50%",
            position: "absolute",
            transform: "translateX(-50%)",
            width: "12px",
            zIndex: -1,
          }}
        >
          <VStack
            as={ChevronRightIcon}
            $style={{
              backgroundColor: colors.bgSecondary.toHex(),
              borderRadius: "50%",
              color: colors.buttonDisabledText.toHex(),
              fontSize: "24px",
              padding: "4px",
            }}
          />
        </VStack>
      </HStack>
      <VStack
        $style={{
          borderColor: colors.borderLight.toHex(),
          borderRadius: "16px",
          borderStyle: "solid",
          borderWidth: "1px",
        }}
      >
        <HStack $style={{ justifyContent: "space-between", padding: "12px" }}>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {t("frequency")}
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {camelCaseToTitle(frequency)}
          </Stack>
        </HStack>
        <Divider light />
        <HStack $style={{ justifyContent: "space-between", padding: "12px" }}>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {t("amount")}
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {toNumberFormat(fromAmount)}
          </Stack>
        </HStack>
      </VStack>
      <HStack $style={{ gap: "8px" }}>
        <VStack
          as="span"
          onClick={() => setValues(data)}
          $style={{
            alignItems: "center",
            backgroundColor: colors.buttonPrimary.toHex(),
            borderRadius: "20px",
            color: colors.buttonTextLight.toHex(),
            cursor: "pointer",
            flexGrow: "1",
            fontSize: "12px",
            height: "40px",
            justifyContent: "center",
          }}
          $hover={{ backgroundColor: colors.buttonPrimaryHover.toHex() }}
        >
          {t("useTemplate")}
        </VStack>
        <VStack
          as="span"
          onClick={() => setValues(data, true)}
          $style={{
            alignItems: "center",
            backgroundColor: colors.bgTertiary.toHex(),
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px",
            height: "40px",
            justifyContent: "center",
            width: "40px",
          }}
          $hover={{ color: colors.accentFour.toHex() }}
        >
          <PencilLineIcon />
        </VStack>
      </HStack>
    </VStack>
  );
};

const TemplateItem: FC<{
  asset: AssetProps;
  setAsset: (asset: AssetProps) => void;
}> = ({ asset, setAsset }) => {
  const [token, setToken] = useState<Token | undefined>(undefined);
  const { getTokenData } = useQueries();
  const colors = useTheme();

  useEffect(() => {
    if (!asset.token || !token) return;
    let cancelled = false;

    const { chain, decimals } = token;

    getAccount(chain).then((address) => {
      if (cancelled) return;
      if (address) {
        if (chain === chains.Solana) {
          const mint = new PublicKey(asset.token);
          const owner = new PublicKey(address);

          getAssociatedTokenAddress(
            mint,
            owner,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
            .then((address) => {
              if (cancelled) return;
              setAsset({ ...asset, address: address.toBase58(), decimals });
            })
            .catch(() => {
              if (cancelled) return;
              setAsset({ ...asset, decimals });
            });
        } else {
          setAsset({ ...asset, address, decimals });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [asset.token, token]);

  useEffect(() => {
    if (asset.token) {
      getTokenData(asset.chain, asset.token)
        .catch(() => undefined)
        .then(setToken);
    } else {
      setToken(nativeTokens[asset.chain]);
    }
  }, [asset.chain, asset.token]);

  return (
    <VStack
      $style={{
        alignItems: "center",
        backgroundColor: colors.bgTertiary.toHex(),
        borderColor: colors.borderLight.toHex(),
        borderRadius: "16px",
        borderStyle: "solid",
        borderWidth: "1px",
        gap: "8px",
        justifyContent: "center",
        height: "88px",
        width: "100%",
      }}
    >
      {token ? (
        <>
          <Stack $style={{ position: "relative" }}>
            <TokenImage
              alt={token.ticker}
              borderRadius="50%"
              height="30px"
              src={token.logo}
              width="30px"
            />
            {!!token.id && (
              <Stack
                $style={{ bottom: "-4px", position: "absolute", right: "-4px" }}
              >
                <TokenImage
                  alt={token.chain}
                  borderRadius="50%"
                  height="16px"
                  src={`/tokens/${token.chain.toLowerCase()}.svg`}
                  width="16px"
                />
              </Stack>
            )}
          </Stack>
          <Stack as="span">{token.ticker}</Stack>
        </>
      ) : (
        <Spin />
      )}
    </VStack>
  );
};
