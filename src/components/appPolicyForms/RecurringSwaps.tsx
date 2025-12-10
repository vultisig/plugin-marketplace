import { create, JsonObject, toBinary } from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { Form, Modal } from "antd";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";

import { AppPolicyFormConfiguration } from "@/components/appPolicyForms/components/Configuration";
import { AppPolicyFormSidebar } from "@/components/appPolicyForms/components/Sidebar";
import { AppPolicyFormSuccess } from "@/components/appPolicyForms/components/Success";
import { AppPolicyFormTitle } from "@/components/appPolicyForms/components/Title";
import { DefaultPolicyFormProps } from "@/components/appPolicyForms/Default";
import { AssetTemplate } from "@/components/appPolicyForms/templates/Asset";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { CrossIcon } from "@/icons/CrossIcon";
import { PolicySchema } from "@/proto/policy_pb";
import { getVaultId } from "@/storage/vaultId";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { addPolicy, getRecipeSuggestion } from "@/utils/api";
import { modalHash } from "@/utils/constants";
import { personalSign } from "@/utils/extension";
import {
  getConfiguration,
  getFeePolicies,
  policyToHexMessage,
} from "@/utils/functions";
import { AppPolicy } from "@/utils/types";

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
  const { messageAPI } = useAntd();
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
  const [form] = Form.useForm<JsonObject>();
  const goBack = useGoBack();
  const colors = useTheme();
  const supportedChains = requirements?.supportedChains || [];
  const visible = hash === modalHash.policy;

  const handleSubmit = (values: JsonObject) => {
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
        values.fromAmount as string,
        (values.from as JsonObject).decimals as number
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

  const handleTemplate = (data: JsonObject, edit?: boolean) => {
    form.setFieldsValue(data);

    if (edit) {
      setState((prevState) => ({ ...prevState, step: 2 }));
    } else {
      handleSubmit(data);
    }
  };

  useEffect(() => {
    if (!visible) return;

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
            <Button
              loading={loading}
              onClick={() =>
                step > 1
                  ? form.submit()
                  : setState((prevState) => ({ ...prevState, step: 2 }))
              }
            >
              {step > 1 ? t("submit") : t("createOwnAutomations")}
            </Button>
          </HStack>
        </>
      }
      maskClosable={false}
      onCancel={() => goBack()}
      open={visible}
      styles={{
        body: { display: "flex", gap: 32 },
        footer: { display: "flex", gap: 65, marginTop: 24 },
        header: { marginBottom: 32 },
      }}
      title={
        <AppPolicyFormTitle
          app={app}
          onBack={() =>
            setState((prevState) => ({
              ...prevState,
              step: prevState.step - 1,
            }))
          }
          step={step}
        />
      }
      width={992}
    >
      <AppPolicyFormSidebar
        steps={[t("templates"), t("automations")]}
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
        <Form
          autoComplete="off"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Stack
            $style={{
              columnGap: "24px",
              display: step === 1 ? "grid" : "none",
              gridTemplateColumns: "repeat(2, 1fr)",
            }}
          >
            {configurationExample.map((example, index) => (
              <AssetTemplate
                defaultValues={example}
                key={index}
                onSelect={handleTemplate}
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
            <AppPolicyFormConfiguration
              chains={supportedChains}
              configuration={configuration}
              definitions={configuration.definitions}
              form={form}
            />
          </Stack>
        </Form>
      </VStack>
    </Modal>
  );
};
