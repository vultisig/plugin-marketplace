import { FC, Fragment } from "react";
import { useTheme } from "styled-components";

import { CheckmarkIcon } from "@/icons/CheckmarkIcon";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";

type AutomationFormSidebarProps = {
  step: number;
  steps: string[];
};

export const AutomationFormSidebar: FC<AutomationFormSidebarProps> = ({
  step,
  steps,
}) => {
  const colors = useTheme();

  return (
    <VStack $style={{ flex: "none", gap: "16px", width: "218px" }}>
      {steps.map((item, index) => {
        const disabled = step < index + 1;
        const passed = step > index + 1;

        return (
          <Fragment key={index}>
            {index > 0 && <Divider light />}
            <HStack $style={{ alignItems: "center", gap: "8px" }}>
              <HStack
                as="span"
                $style={{
                  alignItems: "center",
                  backgroundColor: passed
                    ? colors.success.toHex()
                    : colors.bgSecondary.toHex(),
                  borderRadius: "50%",
                  color: passed
                    ? colors.neutral50.toHex()
                    : disabled
                    ? colors.textTertiary.toHex()
                    : colors.accentFour.toHex(),
                  height: "24px",
                  justifyContent: "center",
                  lineHeight: "24px",
                  width: "24px",
                  ...(disabled || passed
                    ? {}
                    : {
                        borderColor: colors.accentFour.toHex(),
                        borderStyle: "solid",
                        borderWidth: "1px",
                      }),
                }}
              >
                {passed ? <CheckmarkIcon /> : index + 1}
              </HStack>
              <Stack
                as="span"
                $style={{
                  color:
                    disabled || passed
                      ? colors.textTertiary.toHex()
                      : colors.textPrimary.toHex(),
                }}
              >
                {item}
              </Stack>
            </HStack>
          </Fragment>
        );
      })}
    </VStack>
  );
};
