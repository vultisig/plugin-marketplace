import { FC } from "react";
import { useTheme } from "styled-components";

import { SuccessModal } from "@/components/SuccessModal";
import { useGoBack } from "@/hooks/useGoBack";
import { Stack } from "@/toolkits/Stack";

export const AutomationFormSuccess: FC<{ visible: boolean }> = ({ visible }) => {
  const goBack = useGoBack();
  const colors = useTheme();

  return (
    <SuccessModal onClose={() => goBack()} visible={visible}>
      <Stack as="span" $style={{ fontSize: "22px", lineHeight: "24px" }}>
        Success!
      </Stack>
      <Stack
        as="span"
        $style={{ color: colors.textTertiary.toHex(), lineHeight: "18px" }}
      >
        New Automation is added
      </Stack>
    </SuccessModal>
  );
};
