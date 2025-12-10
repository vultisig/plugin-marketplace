import { create, JsonObject } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { v4 as uuidv4 } from "uuid";

import { BillingFrequency, FeePolicySchema, FeeType } from "@/proto/policy_pb";
import { Currency, currencySymbols } from "@/utils/currency";
import {
  App,
  AppPolicy,
  AppPricing,
  Configuration,
  CSSProperties,
  Definitions,
  FieldProps,
} from "@/utils/types";

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

const toTimestamp = (date: Date) => {
  const millis = date.getTime();

  return {
    nanos: (millis % 1000) * 1_000_000,
    seconds: BigInt(Math.floor(millis / 1000)),
  };
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

export const getConfiguration = (
  configuration: Configuration,
  values: JsonObject,
  definitions?: Definitions
): JsonObject => {
  return Object.fromEntries(
    Object.entries(configuration.properties).flatMap(([key, field]) => {
      const value = values[key];

      if (value === undefined) return [];

      if (field.$ref) {
        const fieldRef = getFieldRef(field, definitions);

        if (!fieldRef) return [];

        return [
          [key, getConfiguration(fieldRef, value as JsonObject, definitions)],
        ];
      }

      return [[key, value]];
    })
  );
};

export const getFeePolicies = (pricing: AppPricing[]) => {
  return pricing.map((price) => {
    let frequency = BillingFrequency.BILLING_FREQUENCY_UNSPECIFIED;
    let type = FeeType.FEE_TYPE_UNSPECIFIED;

    switch (price.frequency) {
      case "daily":
        frequency = BillingFrequency.DAILY;
        break;
      case "weekly":
        frequency = BillingFrequency.WEEKLY;
        break;
      case "biweekly":
        frequency = BillingFrequency.BIWEEKLY;
        break;
      case "monthly":
        frequency = BillingFrequency.MONTHLY;
        break;
    }

    switch (price.type) {
      case "once":
        type = FeeType.ONCE;
        break;
      case "recurring":
        type = FeeType.RECURRING;
        break;
      case "per-tx":
        type = FeeType.TRANSACTION;
        break;
    }

    return create(FeePolicySchema, {
      amount: BigInt(price.amount),
      description: "",
      frequency,
      id: uuidv4(),
      startDate: create(TimestampSchema, toTimestamp(new Date())),
      type,
    });
  });
};

export const getFieldRef = (field: FieldProps, definitions?: Definitions) => {
  if (!definitions) return;

  const key = field.$ref?.replace("#/definitions/", "");

  if (!key || !definitions[key]) return;

  return definitions[key];
};

export const match = <T extends string | number | symbol, V>(
  value: T,
  handlers: { [key in T]: () => V }
): V => {
  const handler = handlers[value];

  return handler();
};

export const normalizeApp = (app: App) => {
  const {
    avgRating = 0,
    faqs = [],
    features = [],
    images = [],
    installations = 0,
    logoUrl = "",
    pricing = [],
    ratesCount = 0,
    thumbnailUrl = "",
    ...rest
  } = app;

  const normalizedApp: App = {
    ...rest,
    avgRating,
    faqs,
    features,
    images,
    installations,
    logoUrl,
    pricing,
    ratesCount,
    thumbnailUrl,
  };

  return normalizedApp;
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
