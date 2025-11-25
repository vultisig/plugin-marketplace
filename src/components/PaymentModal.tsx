import { Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { Button } from "@/toolkits/Button";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { feeAppId, modalHash } from "@/utils/constants";
import { startReshareSession } from "@/utils/extension";
import { App } from "@/utils/types";

export const PaymentModal = () => {
  const { t } = useTranslation();
  const [app, setApp] = useState<App | undefined>(undefined);
  const { hash } = useLocation();
  const { getAppData } = useQueries();
  const goBack = useGoBack();
  const colors = useTheme();

  const visible = useMemo(() => hash === modalHash.payment, [hash]);

  useEffect(() => {
    getAppData(feeAppId).then(setApp);
  }, []);

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
      {app ? (
        <HStack $style={{ alignItems: "center", gap: "24px" }}>
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
              icon={<CirclePlusIcon fontSize={16} />}
              onClick={() => startReshareSession(feeAppId)}
            >
              {t("addToVault")}
            </Button>
          </VStack>
        </HStack>
      ) : (
        <VStack $style={{ alignItems: "center" }}>
          <Spin />
        </VStack>
      )}
    </Modal>
  );
};
