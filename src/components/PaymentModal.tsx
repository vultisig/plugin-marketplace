import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants/core";
import { Button } from "@/toolkits/Button";
import { startReshareSession } from "@/utils/services/extension";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";

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
        <Stack
          as="img"
          alt="Payment App Required"
          src={`/plugins/automate-your-payrolls.jpg`}
          $style={{ borderRadius: "12px", width: "346px" }}
        />
        <VStack $style={{ alignItems: "start", gap: "24px" }}>
          <VStack $style={{ gap: "20px" }}>
            <HStack $style={{ gap: "12px" }}>
              <Stack
                as="img"
                alt="Payment App Required"
                src={`/plugins/payroll.png`}
                $style={{ width: "56px" }}
              />
              <VStack $style={{ gap: "4px", justifyContent: "center" }}>
                <Stack
                  as="span"
                  $style={{
                    fontSize: "17px",
                    fontWeight: "500",
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
                    fontWeight: "500",
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
                fontWeight: "500",
                lineHeight: "18px",
              }}
            >
              This plugin handles payments securely using your wallet, with full
              control over fees and visibility. This is a one-time setup.
            </Stack>
          </VStack>
          <Button
            icon={<CirclePlusIcon fontSize={16} />}
            kind="primary"
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
