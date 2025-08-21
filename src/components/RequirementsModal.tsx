import { Drawer } from "antd";
import { FC, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Stack, VStack } from "@/components/Stack";
import { modalHash } from "@/utils/constants/core";
import { PluginRequirements } from "@/proto/recipe_specification_pb";
import { useGoBack } from "@/hooks/useGoBack";
import { Divider } from "@/components/Divider";

export const RequirementsModal: FC<PluginRequirements> = ({
  minVultisigVersion,
  supportedChains,
}) => {
  const [visible, setVisible] = useState(false);
  const { hash } = useLocation();
  const goBack = useGoBack();

  useEffect(() => setVisible(hash === modalHash.requirements), [hash]);

  return (
    <Drawer
      footer={null}
      open={visible}
      onClose={() => goBack()}
      placement="bottom"
      title="Requirements"
    >
      <VStack $style={{ gap: "16px" }}>
        <Stack as="span">{`Min Vultisig Version: ${minVultisigVersion}`}</Stack>
        <Divider />
        <Stack as="span">{`Supported Chains: ${supportedChains.join(
          ", "
        )}`}</Stack>
      </VStack>
    </Drawer>
  );
};
