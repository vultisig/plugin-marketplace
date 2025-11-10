import { FC } from "react";
import { useTheme } from "styled-components";

import { Stack } from "@/toolkits/Stack";

type Placement = "center" | "left" | "right";

type DividerProps = {
  light?: boolean;
  placement?: Placement;
  text?: string;
  vertical?: boolean;
};

export const Divider: FC<DividerProps> = ({
  light,
  placement = "center",
  text,
  vertical,
}) => {
  const colors = useTheme();
  const backgroundColor = light
    ? colors.borderLight.toHex()
    : colors.borderNormal.toHex();
  const height = vertical ? "100%" : "1px";
  const width = vertical ? "1px" : "100%";
  const flexDirection = vertical ? "column" : "row";

  return (
    <Stack
      as="span"
      $style={{
        alignItems: "center",
        display: "flex",
        flexDirection,
        gap: text ? "16px" : "0",
      }}
      $after={{
        backgroundColor,
        content: placement !== "left" ? "" : "none",
        height,
        width,
      }}
      $before={{
        backgroundColor,
        content: placement !== "right" ? "" : "none",
        height,
        width,
      }}
    >
      {!!text && (
        <Stack
          $style={{
            fontSize: "12px",
            fontWeight: "500",
            lineHeight: "16px",
            whiteSpace: "nowrap",
            transform: vertical ? "rotate(-90deg)" : "none",
          }}
        >
          {text}
        </Stack>
      )}
    </Stack>
  );
};
