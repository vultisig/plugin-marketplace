import { Form, FormItemProps, Input, InputNumber, Select } from "antd";
import { FC } from "react";

import { DatePickerFormItem } from "@/automations/components/DatePickerFormItem";
import { camelCaseToTitle } from "@/utils/functions";
import { FieldProps } from "@/utils/types";

export const DynamicFormItem: FC<FieldProps & FormItemProps> = ({
  enum: enumerable,
  format,
  type,
  ...rest
}) => {
  switch (type) {
    case "int": {
      return (
        <Form.Item {...rest}>
          <InputNumber />
        </Form.Item>
      );
    }
    default: {
      if (enumerable) {
        return (
          <Form.Item {...rest}>
            <Select
              options={enumerable.map((value) => ({
                label: camelCaseToTitle(value),
                value,
              }))}
            />
          </Form.Item>
        );
      } else {
        switch (format) {
          case "date-time": {
            return <DatePickerFormItem {...rest} />;
          }
          default: {
            return (
              <Form.Item {...rest}>
                <Input />
              </Form.Item>
            );
          }
        }
      }
    }
  }
};
