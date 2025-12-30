import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { base64Decode, base64Encode } from "@bufbuild/protobuf/wire";
import {
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Table,
  TableProps,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import { cloneDeep } from "lodash-es";
import { FC, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";

import { AutomationFormAmount } from "@/automations/components/Amount";
import { AutomationFormAmountInput } from "@/automations/components/FormAmountInput";
import { AutomationFormCheckboxDate } from "@/automations/components/FormCheckboxDate";
import { AutomationFormDatePicker } from "@/automations/components/FormDatePicker";
import { AutomationFormSidebar } from "@/automations/components/FormSidebar";
import { AutomationFormSuccess } from "@/automations/components/FormSuccess";
import { AutomationFormTitle } from "@/automations/components/FormTitle";
import { AutomationFormToken } from "@/automations/components/Token";
import { AutomationFormProps } from "@/automations/Default";
import { AssetProps, AssetWidget } from "@/automations/widgets/Asset";
import { TokenImage } from "@/components/TokenImage";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useDiscard } from "@/hooks/useDiscard";
import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { ChevronRightIcon } from "@/icons/ChevronRightIcon";
import { CrossIcon } from "@/icons/CrossIcon";
import { TrashIcon } from "@/icons/TrashIcon";
import { PolicySchema } from "@/proto/policy_pb";
import { getVaultId } from "@/storage/vaultId";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { addPolicy, getRecipeSuggestion } from "@/utils/api";
import { nativeTokens } from "@/utils/chain";
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
import { AppAutomation, Token } from "@/utils/types";

type CustomAppAutomation = AppAutomation & {
  configuration?: DataProps;
  name: string;
};

type DataProps = {
  endDate: number;
  frequency: string;
  from: AssetProps;
  fromAmount: string;
  name: string;
  startDate: number;
  to: AssetProps;
};

type StateProps = {
  isAdded: boolean;
  submitting: boolean;
  step: number;
};

export const RecurringSwapsForm: FC<AutomationFormProps> = ({
  app,
  automations,
  loading,
  onCreate,
  onDelete,
  schema,
}) => {
  const [state, setState] = useState<StateProps>({
    isAdded: false,
    submitting: false,
    step: 1,
  });
  const { isAdded, step, submitting } = state;
  const { messageAPI } = useAntd();
  const { address = "" } = useCore();
  const { id, pricing } = app;
  const {
    configuration,
    configurationExample,
    pluginId,
    pluginVersion,
    requirements,
  } = schema;
  const { hash } = useLocation();
  const { discard, discardHolder } = useDiscard();
  const [form] = Form.useForm<DataProps>();
  const values = Form.useWatch([], form);
  const goBack = useGoBack();
  const colors = useTheme();
  const supportedChains = requirements?.supportedChains || [];
  const visible = hash === modalHash.automation;

  const modifiedAutomations: CustomAppAutomation[] = useMemo(() => {
    return automations.map((automation) => {
      try {
        const decoded = base64Decode(automation.recipe);
        const { configuration, name } = fromBinary(PolicySchema, decoded);

        if (!configuration) return { ...automation, name };

        return {
          ...automation,
          configuration: configuration as DataProps,
          name,
        };
      } catch {
        return { ...automation, name: "" };
      }
    });
  }, [automations]);

  const columns: TableProps<CustomAppAutomation>["columns"] = [
    {
      dataIndex: "name",
      key: "name",
      title: "Name",
    },
    {
      align: "center",
      dataIndex: "configuration",
      key: "startDate",
      render: ({ startDate }: DataProps) =>
        dayjs(startDate).format("YYYY-MM-DD"),
      title: "Start Date",
    },
    {
      align: "center",
      dataIndex: "configuration",
      key: "frequency",
      render: ({ frequency }: DataProps) => kebabCaseToTitle(frequency),
      title: "Frequency",
    },
    {
      align: "center",
      dataIndex: "configuration",
      key: "from",
      render: ({ from }: DataProps) => (
        <AutomationFormToken chain={from.chain} id={from.token} />
      ),
      title: "From",
    },
    {
      align: "center",
      dataIndex: "configuration",
      key: "to",
      render: ({ to }: DataProps) => (
        <AutomationFormToken chain={to.chain} id={to.token} />
      ),
      title: "To",
    },
    {
      align: "center",
      dataIndex: "configuration",
      key: "amount",
      render: ({ from, fromAmount }: DataProps) => {
        return (
          <AutomationFormAmount
            amount={fromAmount}
            chain={from.chain}
            tokenId={from.token}
          />
        );
      },
      title: "Amount",
    },
    {
      align: "center",
      key: "action",
      render: (_, { id, signature }) => {
        if (!signature) return null;

        return (
          <HStack $style={{ justifyContent: "center" }}>
            <Button
              icon={<TrashIcon fontSize={16} />}
              kind="danger"
              onClick={() => onDelete(id, signature)}
              ghost
            />
          </HStack>
        );
      },
      title: "Action",
      width: 80,
    },
  ];

  const handleBack = () => {
    setState((prevState) => ({ ...prevState, step: prevState.step - 1 }));
  };

  const handleCancel = () => {
    if (step === 3) {
      discard(() => goBack());
    } else {
      goBack();
    }
  };

  const handleStep = () => {
    if (!configuration) return;

    if (step === 1) {
      form.resetFields();

      setState((prevState) => ({ ...prevState, step: 2 }));
    } else {
      form
        .validateFields()
        .then((values) => {
          if (step === 2) {
            setState((prevState) => ({ ...prevState, step: 3 }));
          } else {
            setState((prevState) => ({ ...prevState, submitting: true }));

            const configurationData = getConfiguration(
              configuration,
              cloneDeep({
                ...values,
                fromAmount: parseUnits(
                  Number(values.fromAmount).toFixed(values.from.decimals),
                  values.from.decimals
                ).toString(),
              }),
              configuration.definitions
            );

            getRecipeSuggestion(id, configurationData)
              .then(({ maxTxsPerWindow, rateLimitWindow, rules = [] }) => {
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

                const policy: AppAutomation = {
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
                        setState((prevState) => ({
                          ...prevState,
                          isAdded: true,
                          submitting: false,
                        }));

                        onCreate();
                      })
                      .catch((error: Error) => {
                        setState((prevState) => ({
                          ...prevState,
                          submitting: false,
                        }));

                        messageAPI.error(error.message);
                      });
                  })
                  .catch(() => {
                    messageAPI.error("Failed to sign automation");

                    setState((prevState) => ({
                      ...prevState,
                      submitting: false,
                    }));
                  });
              })
              .catch(() => {
                setState((prev) => ({ ...prev, submitting: false }));

                messageAPI.error("Failed to get suggestion from app");
              });
          }
        })
        .catch(() => {});
    }
  };

  const handleTemplate = (data: DataProps) => {
    form.resetFields();
    form.setFieldsValue(data);

    setState((prevState) => ({ ...prevState, step: 2 }));
  };

  useEffect(() => {
    if (!visible) return;

    form.resetFields();

    setState({ isAdded: false, step: 1, submitting: false });
  }, [form, visible]);

  return (
    <>
      <Tabs
        items={[
          {
            children: (
              <Table
                columns={columns}
                dataSource={modifiedAutomations}
                loading={loading}
                pagination={false}
                rowKey="id"
                size="small"
              />
            ),
            key: "upcoming",
            label: "Upcoming",
          },
          { disabled: true, key: "history", label: "History" },
        ]}
      />

      <AutomationFormSuccess open={visible && isAdded} />

      <Modal
        centered={true}
        closeIcon={<CrossIcon />}
        footer={
          <>
            <Stack $style={{ flex: "none", width: "218px" }} />
            <HStack $style={{ flexGrow: 1, justifyContent: "center" }}>
              <Button loading={submitting} onClick={handleStep}>
                {step > 2
                  ? "Submit"
                  : step > 1
                  ? "Continue"
                  : "Create your own automations"}
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
          steps={["Templates", "Automations", "Overview"]}
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
              {configurationExample?.length ? (
                configurationExample.map((example, index) => (
                  <Template
                    key={index}
                    setValues={handleTemplate}
                    values={example as DataProps}
                  />
                ))
              ) : (
                <Empty description="No templates available" />
              )}
            </Stack>
            <Stack
              $style={{
                columnGap: "24px",
                display: step === 2 ? "grid" : "none",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              <AutomationFormDatePicker label="End Date" name="endDate" />
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
              <AutomationFormCheckboxDate name="startDate" />
              <AssetWidget chains={supportedChains} keys={["from"]} />
              <AutomationFormAmountInput
                asset={values?.from}
                label="Amount"
                name="fromAmount"
                rules={[{ required: true }]}
              />
              <AssetWidget chains={supportedChains} keys={["to"]} />
            </Stack>
            {step === 3 && <Overview {...values} />}
          </Form>
        </VStack>
      </Modal>

      {discardHolder}
    </>
  );
};

const Overview: FC<DataProps> = ({
  endDate,
  frequency = "",
  from,
  fromAmount = 0,
  startDate,
  to,
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
          {kebabCaseToTitle(frequency)}
        </Stack>
      </HStack>
      <Divider />
      {!!from && (
        <>
          <HStack
            $style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack as="span">From</Stack>
            <AutomationFormToken chain={from.chain} id={from.token} />
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
      {!!to && (
        <HStack
          $style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack as="span">To</Stack>
          <AutomationFormToken chain={to.chain} id={to.token} />
        </HStack>
      )}
    </VStack>
  );
};

const Template: FC<{
  values: DataProps;
  setValues: (data: DataProps) => void;
}> = ({ values, setValues }) => {
  const [data, setData] = useState(values);
  const { frequency, from, fromAmount, to } = data;
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
            Frequency
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {kebabCaseToTitle(frequency)}
          </Stack>
        </HStack>
        <Divider light />
        <HStack $style={{ justifyContent: "space-between", padding: "12px" }}>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            Amount
          </Stack>
          <Stack as="span" $style={{ fontSize: "12px" }}>
            {toNumberFormat(fromAmount)}
          </Stack>
        </HStack>
      </VStack>
      <VStack
        as="span"
        onClick={() => setValues(data)}
        $style={{
          alignItems: "center",
          backgroundColor: colors.buttonPrimary.toHex(),
          borderRadius: "20px",
          color: colors.buttonText.toHex(),
          cursor: "pointer",
          flexGrow: "1",
          fontSize: "12px",
          height: "40px",
          justifyContent: "center",
        }}
        $hover={{ backgroundColor: colors.buttonPrimaryHover.toHex() }}
      >
        Get Started
      </VStack>
    </VStack>
  );
};

const TemplateItem: FC<{
  asset: AssetProps;
  setAsset: (asset: AssetProps) => void;
}> = ({ asset, setAsset }) => {
  const [token, setToken] = useState<Token | undefined>(undefined);
  const { vault } = useCore();
  const { getTokenData } = useQueries();
  const colors = useTheme();

  useEffect(() => {
    if (!vault) return;

    vault.address(asset.chain).then((address) => {
      if (asset.token) {
        getTokenData(asset.chain, asset.token)
          .then((token) => {
            setAsset({ ...asset, address, decimals: token.decimals });
            setToken(token);
          })
          .catch(() => {
            //Todo: handle error
          });
      } else {
        const token = nativeTokens[asset.chain];
        setAsset({ ...asset, address, decimals: token.decimals });
        setToken(token);
      }
    });
  }, [asset.chain, asset.token, vault]);

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
            {(!!token.id || token.chain !== asset.chain) && (
              <Stack
                $style={{ bottom: "-4px", position: "absolute", right: "-4px" }}
              >
                <TokenImage
                  alt={asset.chain}
                  borderRadius="50%"
                  height="16px"
                  src={`/tokens/${asset.chain.toLowerCase()}.svg`}
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
