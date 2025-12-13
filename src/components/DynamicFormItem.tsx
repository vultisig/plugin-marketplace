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
import { FC, useEffect, useState } from "react";

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

const DatePickerFormItem: FC<FieldProps & FormItemProps> = ({
  name,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const form = Form.useFormInstance();
  const date = Form.useWatch<number>(name, form);
  const isValid = !date || !isNaN(date);

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

  useEffect(() => {
    if (!isValid) form.setFieldValue(name, dayjs(date).valueOf());
  }, [isValid]);

  if (!isValid) return null;

  return (
    <Form.Item
      getValueProps={(value) => ({ value: value && dayjs(value) })}
      name={name}
      normalize={(value) => value && dayjs(value).valueOf()}
      {...rest}
    >
      <DatePicker
        disabledDate={disabledDate}
        disabledTime={disabledTime}
        format="YYYY-MM-DD HH:mm"
        onCalendarChange={(next) => {
          if (!date || !next || Array.isArray(next)) return;

          const current = dayjs(date);

          if (
            !current.isSame(next, "day") &&
            current.hour() !== next.hour() &&
            current.minute() !== next.minute()
          ) {
            form.setFieldValue(name, next);
            setOpen(false);
          }
        }}
        onOpenChange={setOpen}
        open={open}
        showNow={false}
        showTime={{
          hideDisabledOptions: true,
          minuteStep: 5,
          showSecond: false,
        }}
      />
    </Form.Item>
  );
};
