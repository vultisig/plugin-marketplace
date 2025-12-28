import { Form, FormItemProps } from "antd";
import { FC, useEffect, useState } from "react";
import { useTheme } from "styled-components";
import { formatUnits } from "viem";

import { AssetProps } from "@/automations/widgets/Asset";
import { useCore } from "@/hooks/useCore";
import { InputDigits } from "@/toolkits/InputDigits";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { toNumberFormat } from "@/utils/functions";

export const AutomationFormAmountInput: FC<
  FormItemProps & { assetKeys: string[]; disabled?: boolean }
> = ({ assetKeys, disabled, ...rest }) => {
  const [balance, setBalance] = useState<string>("");
  const { vault } = useCore();
  const form = Form.useFormInstance();
  const asset = Form.useWatch<AssetProps>(assetKeys, form);
  const colors = useTheme();

  useEffect(() => {
    if (!asset || !vault) return;

    vault.balance(asset.chain, asset.token).then(({ amount }) => {
      setBalance(toNumberFormat(formatUnits(BigInt(amount), asset.decimals)));
    });
  }, [asset, vault]);

  return (
    <VStack>
      <Form.Item {...rest}>
        <InputDigits disabled={disabled} />
      </Form.Item>
      <HStack $style={{ justifyContent: "space-between", marginTop: "-6px" }}>
        <Stack
          as="span"
          $style={{ color: colors.textTertiary.toHex(), fontSize: "13px" }}
        >
          Balance:
        </Stack>
        <Stack
          as="span"
          $style={{ color: colors.textTertiary.toHex(), fontSize: "13px" }}
        >
          {balance}
        </Stack>
      </HStack>
    </VStack>
  );
};
