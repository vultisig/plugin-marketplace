import { Modal } from "antd";
import { FC, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { SuccessModal } from "@/components/SuccessModal";
import { useGoBack } from "@/hooks/useGoBack";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { Button } from "@/toolkits/Button";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getApp, isAppInstalled } from "@/utils/api";
import { feeAppId, modalHash } from "@/utils/constants";
import { startReshareSession } from "@/utils/extension";
import { App } from "@/utils/types";

type PaymentModalProps = { onFinish: () => void };

type StateProps = { app?: App; isInstalled: boolean; loading?: boolean };

export const PaymentModal: FC<PaymentModalProps> = ({ onFinish }) => {
  const [state, setState] = useState<StateProps>({ isInstalled: false });
  const { app, isInstalled, loading } = state;
  const { hash } = useLocation();
  const goBack = useGoBack();
  const colors = useTheme();
  const visible = hash === modalHash.payment;

  const handleInstall = async () => {
    if (loading) return;

    setState((prevState) => ({ ...prevState, loading: true }));

    const isInstalled = await startReshareSession(feeAppId);

    if (isInstalled) onFinish();

    setState((prevState) => ({
      ...prevState,
      isInstalled,
      loading: false,
    }));
  };

  useEffect(() => {
    if (!visible) return;

    Promise.all([getApp(feeAppId), isAppInstalled(feeAppId)])
      .then(([app, isInstalled]) =>
        setState((prevState) => ({ ...prevState, app, isInstalled }))
      )
      .catch(() => goBack());
  }, [visible]);

  if (!app) return null;

  return (
    <>
      <SuccessModal onClose={() => goBack()} visible={visible && isInstalled}>
        <Stack as="span" $style={{ fontSize: "22px", lineHeight: "24px" }}>
          Installation Successful
        </Stack>
        <VStack $style={{ alignItems: "center", gap: "4px" }}>
          <Stack
            as="span"
            $style={{
              color: colors.textTertiary.toHex(),
              lineHeight: "18px",
            }}
          >
            {`${app.title} app was successfully installed.`}
          </Stack>
          <Stack
            as="span"
            $style={{
              color: colors.textTertiary.toHex(),
              lineHeight: "18px",
            }}
          >
            You can now install other apps.
          </Stack>
        </VStack>
      </SuccessModal>

      <Modal
        centered={true}
        closable={false}
        footer={false}
        onCancel={() => goBack()}
        open={visible && !isInstalled}
        styles={{
          body: { alignItems: "center", display: "flex", gap: 24 },
          container: { padding: 16 },
          footer: { display: "none" },
        }}
        title={false}
        width={768}
      >
        <VStack
          $style={{
            aspectRatio: 3 / 2,
            backgroundImage: `url(${app.thumbnailUrl})`,
            backgroundPosition: "center center",
            backgroundSize: "cover",
            borderRadius: "12px",
            flex: "none",
            width: "346px",
          }}
        />
        <VStack $style={{ alignItems: "flex-start", gap: "24px" }}>
          <VStack $style={{ gap: "20px" }}>
            <HStack $style={{ alignItems: "center", gap: "12px" }}>
              <Stack
                as="img"
                alt={app.title}
                src={app.logoUrl}
                $style={{ borderRadius: "12px", width: "56px" }}
              />
              <Stack
                as="span"
                $style={{ fontSize: "17px", lineHeight: "20px" }}
              >
                {app.title}
              </Stack>
            </HStack>
            <Stack
              as="span"
              $style={{
                color: colors.textSecondary.toHex(),
                fontSize: "14px",
                lineHeight: "18px",
              }}
            >
              {app.description}
            </Stack>
          </VStack>
          <Button
            disabled={loading}
            icon={<CirclePlusIcon fontSize={16} />}
            loading={loading}
            onClick={handleInstall}
          >
            Add to Vault
          </Button>
        </VStack>
      </Modal>
    </>
  );
};
