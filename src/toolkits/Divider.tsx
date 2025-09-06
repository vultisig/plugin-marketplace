import { FC } from "react";
import { useTheme } from "styled-components";

import { Stack } from "@/toolkits/Stack";

type DividerProps = {
  vertical?: boolean;
};

export const Divider: FC<DividerProps> = ({ vertical }) => {
  const colors = useTheme();

  return (
    <Stack
      as="span"
      $style={{
        backgroundColor: colors.borderLight.toHex(),
        ...(vertical ? { width: "1px" } : { height: "1px" }),
      }}
    />
  );
};
