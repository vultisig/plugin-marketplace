import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { Button } from "@/toolkits/Button";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants";
import { startReshareSession } from "@/utils/extension";

export const PaymentModal = () => {
  const [visible, setVisible] = useState(false);
  const { hash } = useLocation();
  const goBack = useGoBack();
  const colors = useTheme();

  useEffect(() => setVisible(hash === modalHash.payment), [hash]);

  return (
    <Modal
      centered={true}
      closable={false}
      footer={false}
      onCancel={() => goBack()}
      open={visible}
      styles={{ content: { padding: 16 }, footer: { display: "none" } }}
      title={false}
      width={768}
    >
      <HStack $style={{ alignItems: "center", gap: "24px" }}>
        <VStack
          $style={{
            aspectRatio: 3 / 2,
            backgroundImage: "url(/media/payment-app-required.jpg)",
            backgroundPosition: "center center",
            backgroundSize: "cover",
            borderRadius: "12px",
            flex: "none",
            width: "346px",
          }}
        />
        <VStack $style={{ alignItems: "flex-start", gap: "24px" }}>
          <VStack $style={{ gap: "20px" }}>
            <HStack $style={{ gap: "12px" }}>
              <Stack
                as="img"
                alt="Payment App Required"
                src="/media/payment.png"
                $style={{ width: "56px" }}
              />
              <VStack $style={{ gap: "4px", justifyContent: "center" }}>
                <Stack
                  as="span"
                  $style={{
                    fontSize: "17px",
                    lineHeight: "20px",
                  }}
                >
                  Payment App Required
                </Stack>
                <Stack
                  as="span"
                  $style={{
                    color: colors.textTertiary.toHex(),
                    fontSize: "12px",
                    lineHeight: "16px",
                  }}
                >
                  Required Standard App
                </Stack>
              </VStack>
            </HStack>
            <Stack
              as="span"
              $style={{
                color: colors.textSecondary.toHex(),
                fontSize: "14px",
                lineHeight: "18px",
              }}
            >
              This plugin handles payments securely using your wallet, with full
              control over fees and visibility. This is a one-time setup.
            </Stack>
          </VStack>
          <Button
            icon={<CirclePlusIcon fontSize={16} />}
            onClick={() =>
              startReshareSession(import.meta.env.VITE_FEE_PLUGIN_ID)
            }
          >
            Add to vault
          </Button>
        </VStack>
      </HStack>
    </Modal>
  );
};
