import { FC } from "react";
import { useTheme } from "styled-components";

import { StatusModal } from "@/components/StatusModal";
import { useGoBack } from "@/hooks/useGoBack";
import { Stack } from "@/toolkits/Stack";

export const AutomationFormSuccess: FC<{ open: boolean }> = ({ open }) => {
  const goBack = useGoBack();
  const colors = useTheme();

  return (
    <StatusModal onClose={() => goBack()} open={open} success>
      <Stack as="span" $style={{ fontSize: "22px", lineHeight: "24px" }}>
        Success!
      </Stack>
      <Stack
        as="span"
        $style={{ color: colors.textTertiary.toHex(), lineHeight: "18px" }}
      >
        New Automation is added
      </Stack>
    </StatusModal>
  );
};
