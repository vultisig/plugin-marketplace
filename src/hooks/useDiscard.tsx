import { useTheme } from "styled-components";

import { useAntd } from "@/hooks/useAntd";
import { Button } from "@/toolkits/Button";
import { HStack, Stack, VStack } from "@/toolkits/Stack";

export const useDiscard = () => {
  const { modalAPI } = useAntd();
  const colors = useTheme();

  const showDiscard = (onLeave: () => void) => {
    const modal = modalAPI.confirm({
      centered: true,
      content: (
        <VStack $style={{ gap: "24px" }}>
          <VStack $style={{ gap: "12px" }}>
            <Stack
              $style={{
                fontSize: "22px",
                lineHeight: "24px",
                textAlign: "center",
              }}
            >
              Unsaved Changes
            </Stack>

            <Stack
              $style={{
                color: colors.textTertiary.toHex(),
                lineHeight: "18px",
                textAlign: "center",
              }}
            >
              Are you sure you want to leave?
            </Stack>
          </VStack>

          <HStack $style={{ gap: "12px", justifyContent: "center" }}>
            <Stack
              as={Button}
              onClick={() => modal.destroy()}
              $style={{ width: "100%" }}
            >
              No, go back
            </Stack>

            <Stack
              as={Button}
              kind="danger"
              onClick={() => {
                modal.destroy();
                onLeave();
              }}
              $style={{ width: "100%" }}
            >
              Yes, leave
            </Stack>
          </HStack>
        </VStack>
      ),
      footer: null,
      icon: null,
      styles: { container: { padding: "32px 24px 24px" } },
    });

    return modal;
  };

  return showDiscard;
};
