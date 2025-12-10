import { FC } from "react";

import { HStack, Stack, VStack } from "@/toolkits/Stack";

export const RecurringSwapsImages = () => {
  return (
    <HStack $style={{ gap: "16px" }}>
      <VStack $style={{ gap: "16px", overflow: "hidden" }}>
        <RecurringSwapsImage id="1" />
        <RecurringSwapsImage id="3" />
      </VStack>
      <VStack $style={{ gap: "16px", overflow: "hidden" }}>
        <RecurringSwapsImage id="2" />
        <RecurringSwapsImage id="4" />
      </VStack>
    </HStack>
  );
};

const RecurringSwapsImage: FC<{ id: string }> = ({ id }) => (
  <Stack
    as="img"
    alt="Recurring Swaps"
    src={`/media/recurring-swaps-img-0${id}.jpg`}
    style={{ borderRadius: "16px" }}
  />
);
