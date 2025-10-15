import dayjs from "dayjs";
import { FC, ReactNode } from "react";

import { DatePicker } from "@/toolkits/DatePicker";
import { Input } from "@/toolkits/Input";
import { InputNumber } from "@/toolkits/InputNumber";
import { Select } from "@/toolkits/Select";
import { camelCaseToTitle } from "@/utils/functions";
import { DynamicFieldProps } from "@/utils/types";

export const DynamicField: FC<DynamicFieldProps & { disabled?: boolean }> = (
  field
) => {
  let element: ReactNode;

  switch (field.type) {
    case "int": {
      element = <InputNumber />;

      break;
    }
    default: {
      if (field.enum) {
        element = (
          <Select
            disabled={field.disabled}
            options={field.enum.map((value) => ({
              label: camelCaseToTitle(value),
              value,
            }))}
          />
        );
      } else {
        switch (field.format) {
          case "date-time": {
            element = (
              <DatePicker
                disabled={field.disabled}
                disabledDate={(current) => {
                  return current && current.isBefore(dayjs(), "day");
                }}
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
            element = <Input />;
            break;
          }
        }
        break;
      }
    }
  }

  return element;
};
