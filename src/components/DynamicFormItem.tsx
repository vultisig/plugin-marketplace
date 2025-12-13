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
  const form = Form.useFormInstance();
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
  //const initialValue = firstAvailable.subtract(1, "day");
  const initialValue = firstAvailable.subtract(1, "day");
  const lastSelectedValue = initialValue.hour(0).minute(0).second(0)
  console.log("initialValue: ",  initialValue.format("YYYY-MM-DD HH:mm"));
  console.log("lastSelectedValue: ",  lastSelectedValue.format("YYYY-MM-DD HH:mm"));


  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<dayjs.Dayjs | null>(null); // committed
  const [draft, setDraft] = useState<dayjs.Dayjs | null>(null); // internal
  const [initial, setInitial] = useState<dayjs.Dayjs>(initialValue);
  const [lastSelected, setLastSelected] = useState<dayjs.Dayjs>(lastSelectedValue);
  const isDefaultTime = (d: dayjs.Dayjs) => d.hour() === 0 || d.minute() === 0;
  const allPartsChanged = (init: dayjs.Dayjs, curr: dayjs.Dayjs) => {
    return (
      !init.isSame(curr, "day") &&
      init.hour() !== curr.hour() &&
      init.minute() !== curr.minute()
    );
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
                onOpenChange={setOpen}
                disabledDate={disabledDate}
                disabledTime={disabledTime}
                format="YYYY-MM-DD HH:mm"
                showNow={false}
                needConfirm
                showTime={{
                  hideDisabledOptions: true,
                  minuteStep: 5,
                  showSecond: false,
                }}
                defaultPickerValue={initialValue}
                // Draft updates (preview only)
                onCalendarChange={(next) => {
                  if (!next) return;

                  setDraft(next);
                  debugger;
                  if (isDefaultTime(next)) return;
                  if (allPartsChanged(initial, next) && allPartsChanged(lastSelected, next)) {
                    if (rest.name) {
                      form.setFieldValue(rest.name as string, next);
                    } else {
                      console.log(
                        "No field name specified for DynamicFormItem: ",
                        rest
                      );
                    }
                    // ✅ Auto-confirm path
                    setValue(next);
                    setLastSelected(next);
                    setDraft(null);
                    setOpen(false);
                  }
                }}
                // OK button path
                onChange={(confirmed) => {
                  if (!confirmed) return;

                  setValue(confirmed);
                  setLastSelected(confirmed);
                  setDraft(null);
                  setOpen(false);
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
