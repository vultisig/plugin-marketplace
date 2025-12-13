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
import { FC, ReactNode, useRef, useState } from "react";

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

  const now = dayjs();
  const minuteStep = 5;
  //debugger;

  // Compute first 5-minute allowed chunk
  const nextMinuteStep = Math.ceil(now.minute() / minuteStep) * minuteStep;

  let firstAvailable = now.minute(nextMinuteStep).second(0);

  // Handle overflow (e.g. 11:60 -> 12:00)
  if (nextMinuteStep === 60) {
    firstAvailable = firstAvailable.add(1, "hour").minute(0);
  }

  // Initial value = yesterday at first available time
  const initialValue = firstAvailable.subtract(1, "day");

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<dayjs.Dayjs | null>(null);
  const [initial, setInitial] = useState<dayjs.Dayjs>(initialValue);

  const allPartsChanged = (init: dayjs.Dayjs, curr: dayjs.Dayjs) => {
    const dayChanged = !init.isSame(curr, "day");
    const hourChanged = init.hour() !== curr.hour();
    const minuteChanged = init.minute() !== curr.minute();
    return dayChanged && hourChanged && minuteChanged;
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
                open={open}
                value={value}
                onOpenChange={(o) => setOpen(o)}
                disabledDate={disabledDate}
                disabledTime={disabledTime}
                format="YYYY-MM-DD HH:mm"
                showNow={false}
                showTime={{
                  hideDisabledOptions: true,
                  minuteStep: 5,
                  showSecond: false,
                  defaultValue: undefined,
                }}
                onChange={(newValue) => {
                  setValue(newValue);
                }}
                defaultPickerValue={initialValue}
                needConfirm={true}
                onCalendarChange={(newValue) => {
                  // Auto-close when both date and time are selected
                  if (newValue && allPartsChanged(initial, newValue)) {
                    console.log("✔ All parts changed → closing");
                    console.log("Selected date-time:", newValue);
                    setValue(newValue);
                    setInitial(newValue);
                    setOpen(false);
                  }
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
