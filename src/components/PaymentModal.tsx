import { Modal } from "antd";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { SuccessModal } from "@/components/SuccessModal";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { Button } from "@/toolkits/Button";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { feeAppId, modalHash } from "@/utils/constants";
import { startReshareSession } from "@/utils/extension";

export const PaymentModal = () => {
  const [loading, setLoading] = useState(false);
  const { feeApp, feeAppStatus, updateFeeAppStatus } = useCore();
  const { hash } = useLocation();
  const goBack = useGoBack();
  const colors = useTheme();
  const visible = hash === modalHash.payment;

  const handleInstall = async () => {
    if (loading) return;

    setLoading(true);

    await startReshareSession(feeAppId);

    setLoading(false);

    updateFeeAppStatus();
  };

  if (!feeApp || !feeAppStatus) return null;

  return (
    <>
      <SuccessModal
        onClose={() => goBack()}
        visible={visible && feeAppStatus.isInstalled}
      >
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
            {`${feeApp.title} app was successfully installed.`}
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
        open={visible && !feeAppStatus.isInstalled}
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
            backgroundImage: `url(${feeApp.thumbnailUrl})`,
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
                alt={feeApp.title}
                src={feeApp.logoUrl}
                $style={{ borderRadius: "12px", width: "56px" }}
              />
              <Stack
                as="span"
                $style={{ fontSize: "17px", lineHeight: "20px" }}
              >
                {feeApp.title}
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
              {feeApp.description}
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
