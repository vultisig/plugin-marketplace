import { DatePicker, DatePickerProps, Form, FormItemProps } from "antd";
import dayjs from "dayjs";
import { FC, useState } from "react";

export const DatePickerFormItem: FC<FormItemProps & { disabled?: boolean }> = ({
  disabled,
  name,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const form = Form.useFormInstance();
  const date = Form.useWatch<string>(name, form);

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

  return (
    <Form.Item
      getValueProps={(value) => ({ value: value && dayjs(value) })}
      name={name}
      normalize={(value) => (value ? dayjs(value).utc().format() : undefined)}
      {...rest}
    >
      <DatePicker
        disabled={disabled}
        disabledDate={disabledDate}
        disabledTime={disabledTime}
        format="YYYY-MM-DD HH:mm"
        onCalendarChange={(next) => {
          if (!next || Array.isArray(next)) return;

          if (date) {
            const current = dayjs(date);

            if (
              !current.isSame(next, "day") &&
              current.hour() !== next.hour() &&
              current.minute() !== next.minute()
            ) {
              form.setFieldValue(name, next);
              setOpen(false);
            }
          } else if (next.hour() > 0 && next.minute() > 0) {
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
