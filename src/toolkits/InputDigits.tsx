import { Input, InputProps } from "antd";
import { FC } from "react";

export const InputDigits: FC<InputProps> = ({ onChange, ...rest }) => (
  <Input
    {...rest}
    onChange={(e) => {
      if (onChange) {
        const value = e.target.value
          .replace(/[^0-9.]/g, "")
          .replace(/(\..*)\./g, "$1");

        onChange({ ...e, target: { ...e.target, value } });
      }
    }}
  />
);
