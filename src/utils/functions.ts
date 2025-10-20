import { Dayjs } from "dayjs";

import { Currency, currencySymbols } from "@/utils/currency";
import { AppPolicy, AppPricing, CSSProperties } from "@/utils/types";

const isArray = (arr: any): arr is any[] => {
  return Array.isArray(arr);
};

const isObject = (obj: any): obj is Record<string, any> => {
  return obj === Object(obj) && !isArray(obj) && typeof obj !== "function";
};

const toCamel = (value: string) => {
  return value.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

const toKebab = (value: string) => {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
};

const toSnake = (value: string) => {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const toValueFormat = (
  value: number | string,
  currency: Currency,
  decimal = 2
): string => {
  return `${currencySymbols[currency]}${toNumberFormat(value, decimal)}`;
};

export const camelCaseToTitle = (input: string) => {
  if (!input) return input;

  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const cssPropertiesToString = (styles: CSSProperties) => {
  return Object.entries(styles)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${toKebab(key)}: ${value};`)
    .join("\n");
};

export const formatDuration = (seconds: number): string => {
  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
  const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;

  const days = Math.floor(seconds / SECONDS_IN_DAY);
  const hours = Math.floor((seconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
  const minutes = Math.floor((seconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
  const secs = seconds % SECONDS_IN_MINUTE;

  const parts = [
    { label: "d", value: days },
    { label: "h", value: hours },
    { label: "m", value: minutes },
    { label: "s", value: secs },
  ];

  return parts
    .filter((part) => part.value > 0)
    .map((part) => `${part.value}${part.label}`)
    .join(" / ");
};

export const match = <T extends string | number | symbol, V>(
  value: T,
  handlers: { [key in T]: () => V }
): V => {
  const handler = handlers[value];

  return handler();
};

export const policyToHexMessage = ({
  pluginVersion,
  policyVersion,
  publicKey,
  recipe,
}: Pick<
  AppPolicy,
  "pluginVersion" | "policyVersion" | "publicKey" | "recipe"
>) => {
  const delimiter = "*#*";

  const fields = [recipe, publicKey, String(policyVersion), pluginVersion];

  for (const item of fields) {
    if (item.includes(delimiter)) {
      throw new Error("invalid policy signature");
    }
  }

  return fields.join(delimiter);
};

export const pricingText = ({
  baseValue,
  currency,
  amount,
  frequency,
  type,
}: Pick<AppPricing, "amount" | "frequency" | "type"> & {
  baseValue: number;
  currency: Currency;
}) => {
  const value = toValueFormat((amount / 1e6) * baseValue, currency, 8);

  switch (type) {
    case "once":
      return `${value} one time installation fee`;
    case "recurring":
      return `${value} ${frequency} recurring fee`;
    case "per-tx":
      return `${value} per transaction fee`;
    default:
      return "Unknown pricing type";
  }
};

export const snakeCaseToTitle = (input: string) => {
  if (!input) return input;

  return input
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const toCamelCase = <T>(obj: T): T => {
  if (isObject(obj)) {
    const result: Record<string, unknown> = {};

    Object.keys(obj).forEach((key) => {
      const camelKey = toCamel(key);
      result[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    });

    return result as T;
  } else if (isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as T;
  }

  return obj;
};

// export const toKebabCase = <T>(obj: T): T => {
//   if (isObject(obj)) {
//     const result: Record<string, unknown> = {};

//     Object.keys(obj).forEach((key) => {
//       const kebabKey = toKebab(key);
//       result[kebabKey] = toKebabCase((obj as Record<string, unknown>)[key]);
//     });

//     return result as T;
//   } else if (isArray(obj)) {
//     return obj.map((item) => toKebabCase(item)) as T;
//   }

//   return obj;
// };

export const toNumberFormat = (value: number | string, decimal = 20) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimal,
    useGrouping: true,
  });

  const num = typeof value === "string" ? Number(value.trim()) : value;

  return isNaN(num) ? value.toString() : formatter.format(num);
};

export const toSnakeCase = <T>(obj: T): T => {
  if (isObject(obj)) {
    const result: Record<string, unknown> = {};

    Object.keys(obj).forEach((key) => {
      const snakeKey = toSnake(key);
      result[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
    });

    return result as T;
  } else if (isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as T;
  }

  return obj;
};

export const toTimestamp = (input: Date | Dayjs) => {
  const date = input instanceof Date ? input : input.toDate();
  const millis = date.getTime();

  return {
    nanos: (millis % 1000) * 1_000_000,
    seconds: BigInt(Math.floor(millis / 1000)),
  };
};
