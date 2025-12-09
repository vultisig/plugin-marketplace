import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { Button } from "@/toolkits/Button";
import { HStack, Stack } from "@/toolkits/Stack";
import { App } from "@/utils/types";

type AppPolicyFormTitleProps = {
  app: App;
  onBack: () => void;
  step: number;
};

export const AppPolicyFormTitle: FC<AppPolicyFormTitleProps> = ({
  app,
  onBack,
  step,
}) => {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <HStack $style={{ gap: "8px" }}>
      {step > 1 && <Button icon={<ChevronLeftIcon />} onClick={onBack} ghost />}
      <Stack
        as="img"
        src={app.logoUrl}
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
          {`/ ${t("addAutomation")}`}
        </Stack>
      </HStack>
    </HStack>
  );
};
