import { List, Modal } from "antd";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { Stack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants";
import { currencies, Currency, currencySymbols } from "@/utils/currency";

export const CurrencyModal = () => {
  const [visible, setVisible] = useState(false);
  const { currency, setCurrency } = useCore();
  const { hash } = useLocation();
  const goBack = useGoBack();
  const colors = useTheme();

  const handleSelect = (key: Currency): void => {
    setCurrency(key);

    goBack();
  };

  useEffect(() => setVisible(hash === modalHash.currency), [hash]);

  return (
    <Modal
      centered={true}
      footer={false}
      maskClosable={false}
      onCancel={() => goBack()}
      open={visible}
      styles={{ footer: { display: "none" } }}
      title="Change Currency"
      width={360}
    >
      <List
        dataSource={currencies.map((key) => ({
          key,
          title: currencySymbols[key],
        }))}
        renderItem={({ key, title }) => {
          const isActive = key === currency;

          return (
            <Stack
              as={List.Item}
              key={key}
              onClick={() => handleSelect(key)}
              {...(isActive
                ? {
                    $style: { color: `${colors.success.toHex()} !important` },
                  }
                : {
                    $hover: { color: colors.buttonPrimary.toHex() },
                    $style: { cursor: "pointer" },
                  })}
            >
              <span>{title}</span>
              <span>{key.toUpperCase()}</span>
            </Stack>
          );
        }}
      />
    </Modal>
  );
};
