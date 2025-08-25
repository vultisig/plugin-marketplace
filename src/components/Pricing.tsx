import { FC } from "react";
import { useTheme } from "styled-components";

import { Stack, VStack } from "@/components/Stack";
import { App, AppPricing } from "@/utils/types";

type PricingProps = Pick<App, "pricing"> & {
  center?: boolean;
};

export const Pricing: FC<PricingProps> = ({ center, pricing }) => {
  const colors = useTheme();

  const pricingText = ({ amount, frequency, type }: AppPricing) => {
    switch (type) {
      case "once":
        return `$${amount / 1e6} one time installation fee`;
      case "recurring":
        return `$${amount / 1e6} ${frequency} recurring fee`;
      case "per-tx":
        return `$${amount / 1e6} per transaction fee`;
      default:
        return "Unknown pricing type";
    }
  };

  return (
    <VStack
      as="span"
      $style={{
        alignItems: center ? "center" : "normal",
        color: colors.textSecondary.toHex(),
        flexGrow: "1",
        fontWeight: "500",
      }}
    >
      {pricing.length ? (
        pricing.map((price, index) => (
          <Stack as="span" key={index}>
            {pricingText(price)}
          </Stack>
        ))
      ) : (
        <Stack as="span">This plugin is free</Stack>
      )}
    </VStack>
  );
};
