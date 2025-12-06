import { FC, useState } from "react";
import { useTheme } from "styled-components";

import { Stack, VStack } from "@/toolkits/Stack";
import { CSSProperties } from "@/utils/types";

type TokenImageProps = {
  alt: string;
  borderRadius: CSSProperties["borderRadius"];
  height: CSSProperties["height"];
  src: string;
  width: CSSProperties["width"];
};

export const TokenImage: FC<TokenImageProps> = ({
  alt,
  borderRadius,
  height,
  src,
  width,
}) => {
  const [status, setStatus] = useState<"default" | "success" | "error">(
    "default"
  );
  const colors = useTheme();

  return status === "error" ? (
    <VStack
      as="span"
      $style={{
        alignItems: "center",
        backgroundColor: colors.bgTertiary.toHex(),
        borderRadius,
        color: colors.textSecondary.toHex(),
        fontSize: "12px",
        fontWeight: "500",
        height,
        justifyContent: "center",
        width,
      }}
    >
      {alt.toUpperCase().charAt(0)}
    </VStack>
  ) : (
    <Stack
      as="img"
      alt={alt}
      src={src}
      onError={() => setStatus("error")}
      onLoad={() => setStatus("success")}
      $style={{
        borderRadius,
        display: "block",
        height,
        opacity: status === "success" ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
        width,
      }}
    />
  );
};
