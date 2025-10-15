import { Form, FormItemProps } from "antd";
import dayjs from "dayjs";
import { FC, ReactNode } from "react";

import { DatePicker } from "@/toolkits/DatePicker";
import { Input } from "@/toolkits/Input";
import { InputNumber } from "@/toolkits/InputNumber";
import { Select } from "@/toolkits/Select";
import { camelCaseToTitle } from "@/utils/functions";
import { FieldProps } from "@/utils/types";

type DynamicFormItemProps = FieldProps & FormItemProps & { disabled?: boolean };

export const DynamicFormItem: FC<DynamicFormItemProps> = ({
  disabled,
  enum: enumerable,
  format,
  type,
  ...rest
}) => {
  let element: ReactNode;

  switch (type) {
    case "int": {
      element = <InputNumber disabled={disabled} />;

      break;
    }
    default: {
      if (enumerable) {
        element = (
          <Select
            disabled={disabled}
            options={enumerable.map((value) => ({
              label: camelCaseToTitle(value),
              value,
            }))}
          />
        );
      } else {
        switch (format) {
          case "date-time": {
            element = (
              <DatePicker
                disabled={disabled}
                disabledDate={(current) =>
                  current && current.isBefore(dayjs(), "day")
                }
                format="YYYY-MM-DD HH:mm"
                showNow={false}
                showTime={{
                  disabledHours: () => {
                    const nextHour = dayjs()
                      .add(1, "hour")
                      .startOf("hour")
                      .hour();

                    return Array.from({ length: nextHour }, (_, i) => i);
                  },
                  format: "HH",
                  showMinute: false,
                  showSecond: false,
                }}
              />
            );

            break;
          }
          default: {
            element = <Input disabled={disabled} />;
            break;
          }
        }
        break;
      }
    }
  }

  return <Form.Item {...rest}>{element}</Form.Item>;
};
