import { FC } from "react";
import { useTheme } from "styled-components";

import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { Button } from "@/toolkits/Button";
import { HStack, Stack } from "@/toolkits/Stack";
import { App } from "@/utils/types";

type AutomationFormTitleProps = {
  app: App;
  onBack: () => void;
  step: number;
};

export const AutomationFormTitle: FC<AutomationFormTitleProps> = ({
  app,
  onBack,
  step,
}) => {
  const colors = useTheme();

  return (
    <HStack $style={{ gap: "8px" }}>
      {step > 1 && <Button icon={<ChevronLeftIcon />} onClick={onBack} ghost />}
      <Stack
        as="img"
        src={app.logoUrl}
        alt={app.title}
        $style={{ borderRadius: "4px", height: "24px", width: "24px" }}
      />
      <HStack
        $style={{
          fontSize: "22px",
          fontWeight: "500",
          gap: "4px",
          lineHeight: "24px",
        }}
      >
        <Stack as="span">{app.title}</Stack>
        <Stack as="span" $style={{ color: colors.textTertiary.toHex() }}>
          / Add Automation
        </Stack>
      </HStack>
    </HStack>
  );
};
