import { FC } from "react";

import { HStack, Stack, VStack } from "@/toolkits/Stack";

export const RecurringSendsImages = () => {
  return (
    <HStack $style={{ gap: "16px" }}>
      <VStack $style={{ gap: "16px", overflow: "hidden" }}>
        <RecurringSendsImage id="1" />
        <RecurringSendsImage id="3" />
      </VStack>
      <VStack $style={{ gap: "16px", overflow: "hidden" }}>
        <RecurringSendsImage id="2" />
        <RecurringSendsImage id="4" />
      </VStack>
    </HStack>
  );
};

const RecurringSendsImage: FC<{ id: string }> = ({ id }) => (
  <Stack
    as="img"
    alt="Recurring Sends"
    src={`/media/recurring-sends-img-0${id}.jpg`}
    style={{ borderRadius: "16px" }}
  />
);
