import {
  DatePicker,
  DatePickerProps,
  Form,
  FormItemProps,
  Input,
  InputNumber,
  Select,
} from "antd";
import dayjs from "dayjs";
import { FC, ReactNode } from "react";

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

  const disabledDate: DatePickerProps["disabledDate"] = (current) => {
    return current && current.isBefore(dayjs(), "day");
  };

  const disabledTime: DatePickerProps["disabledTime"] = (current) => {
    const now = dayjs();

    // Disable hours before current hour if same day
    const disabledHours = () => {
      if (!current) return [];
      if (current.isSame(now, "day")) {
        return Array.from({ length: now.hour() }, (_, i) => i);
      }
      return [];
    };

    // Disable minutes before current minute if same hour
    const disabledMinutes = () => {
      if (!current) return [];
      if (current.isSame(now, "hour")) {
        return Array.from({ length: now.minute() }, (_, i) => i);
      }
      return [];
    };

    return { disabledHours, disabledMinutes };
  };

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
                disabledDate={disabledDate}
                disabledTime={disabledTime}
                format="YYYY-MM-DD HH:mm"
                showNow={false}
                showTime={{
                  hideDisabledOptions: true,
                  minuteStep: 5,
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
