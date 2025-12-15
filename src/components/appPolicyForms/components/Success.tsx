import { Modal } from "antd";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { CrossIcon } from "@/icons/CrossIcon";
import { Stack } from "@/toolkits/Stack";

export const AppPolicyFormSuccess: FC<{ visible: boolean }> = ({ visible }) => {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const colors = useTheme();

  return (
    <Modal
      centered={true}
      closeIcon={<CrossIcon />}
      footer={false}
      onCancel={() => goBack()}
      styles={{
        body: {
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 32,
        },
        container: { overflow: "hidden", padding: 0 },
        footer: { display: "none" },
        header: { margin: 0 },
      }}
      title={
        <Stack
          as="img"
          src="/images/success-banner.jpg"
          $style={{ display: "block", width: "100%" }}
        />
      }
      width={390}
      open={visible}
    >
      <Stack as="span" $style={{ fontSize: "22px", lineHeight: "24px" }}>{`${t(
        "success"
      )}!`}</Stack>
      <Stack
        as="span"
        $style={{ color: colors.textTertiary.toHex(), lineHeight: "18px" }}
      >
        {t("successfulPolicyAdded")}
      </Stack>
    </Modal>
  );
};
