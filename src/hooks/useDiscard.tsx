import { Modal } from "antd";
import { useCallback,useState } from "react";
import { useTheme } from "styled-components";

import { Button } from "@/toolkits/Button";
import { HStack, Stack, VStack } from "@/toolkits/Stack";

export const useDiscard = () => {
  const [open, setOpen] = useState(false);
  const [onLeaveCallback, setOnLeaveCallback] = useState<() => void>(() => {});
  const colors = useTheme();

  const discard = useCallback((onLeave: () => void) => {
    setOnLeaveCallback(() => onLeave);
    setOpen(true);
  }, []);

  const discardHolder = (
    <Modal
      closable={false}
      footer={null}
      maskClosable={false}
      onCancel={() => setOpen(false)}
      open={open}
      styles={{ container: { padding: "32px 24px 24px" } }}
      centered
    >
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
            onClick={() => setOpen(false)}
            $style={{ width: "100%" }}
          >
            No, go back
          </Stack>

          <Stack
            as={Button}
            kind="danger"
            onClick={() => {
              setOpen(false);
              onLeaveCallback();
            }}
            $style={{ width: "100%" }}
          >
            Yes, leave
          </Stack>
        </HStack>
      </VStack>
    </Modal>
  );

  return { discard, discardHolder };
};
