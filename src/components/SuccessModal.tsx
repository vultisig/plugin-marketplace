import { Modal } from "antd";
import { FC, ReactNode } from "react";

import { Stack } from "@/toolkits/Stack";

type SuccessModalProps = {
  children?: ReactNode;
  onClose: () => void;
  visible?: boolean;
};

export const SuccessModal: FC<SuccessModalProps> = ({
  children,
  onClose,
  visible,
}) => (
  <Modal
    centered={true}
    closable={false}
    footer={false}
    onCancel={onClose}
    styles={{
      body: {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 32,
      },
      container: { overflow: "hidden", padding: 0 },
      footer: { display: "none" },
      header: { margin: 0 },
    }}
    title={
      <Stack
        as="img"
        src="/images/success-banner.jpg"
        $style={{ display: "block", width: "100%" }}
      />
    }
    width={390}
    open={visible}
  >
    {children}
  </Modal>
);
