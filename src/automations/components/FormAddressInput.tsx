import { Form, FormItemProps, Input } from "antd";
import { FC } from "react";

import { useWalletCore } from "@/hooks/useWalletCore";
import { Chain } from "@/utils/chain";

export const AutomationFormAddressInput: FC<
  FormItemProps & { chain?: Chain; disabled?: boolean }
> = ({ chain, disabled, rules = [], ...rest }) => {
  const { isValidAddress } = useWalletCore();

  return (
    <Form.Item
      rules={[
        ...rules,
        {
          validator: async (_, address) => {
            if (!address || !chain || isValidAddress(chain, address)) return;

            return Promise.reject(new Error("Please enter a valid address"));
          },
        },
      ]}
      {...rest}
    >
      <Input disabled={disabled} />
    </Form.Item>
  );
};
