import { Stack } from "@/components/Stack";
import { FC, ReactNode } from "react";
import { useTheme } from "styled-components";
import { ThemeColorKeys } from "@/utils/constants/styled";

export const Tag: FC<{
  children: ReactNode;
  bgColor?: ThemeColorKeys;
  txtColor?: ThemeColorKeys;
}> = ({ children, bgColor = "bgPrimary", txtColor = "textPrimary" }) => {
  const colors = useTheme();

  return (
    <Stack
      as="span"
      $style={{
        backgroundColor: colors[bgColor].toHex(),
        borderRadius: "6px",
        color: colors[txtColor].toHex(),
        display: "inline-flex",
        fontSize: "12px",
        lineHeight: "24px",
        padding: "0 8px",
      }}
    >
      {children}
    </Stack>
  );
};
