import { useCallback,useState } from "react";
import { useTheme } from "styled-components";

import { StatusModal } from "@/components/StatusModal";
import { Stack } from "@/toolkits/Stack";
import { isAvailable } from "@/utils/extension";

export const useExtension = () => {
  const [open, setOpen] = useState(false);
  const colors = useTheme();

  const extension = useCallback((onAvailable: () => void) => {
    isAvailable()
      .then(onAvailable)
      .catch(() => setOpen(true));
  }, []);

  const extensionHolder = (
    <StatusModal onClose={() => setOpen(false)} open={open}>
      <Stack as="span" $style={{ fontSize: "22px", lineHeight: "24px" }}>
        Vultisig Extension Not Found
      </Stack>
      <Stack
        as="a"
        href="https://chromewebstore.google.com/detail/vultisig-extension/ggafhcdaplkhmmnlbfjpnnkepdfjaelb"
        target="_blank"
        rel="noopener noreferrer"
        $style={{
          color: colors.textTertiary.toHex(),
          lineHeight: "18px",
          textAlign: "center",
        }}
        $hover={{ color: colors.info.toHex() }}
      >
        Please install the Vultisig Extension from the Chrome Web Store
      </Stack>
    </StatusModal>
  );

  return { extension, extensionHolder };
};
