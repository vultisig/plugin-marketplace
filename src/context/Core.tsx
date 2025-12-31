import { VaultBase } from "@vultisig/sdk";
import { createContext } from "react";

import { setCurrency } from "@/storage/currency";
import { setTheme } from "@/storage/theme";
import { Currency } from "@/utils/currency";
import { Theme } from "@/utils/theme";
import { App, FeeAppStatus } from "@/utils/types";

export type CoreContextProps = {
  address?: string;
  baseValue: number;
  connect: () => void;
  currency: Currency;
  disconnect: () => void;
  feeApp?: App;
  feeAppStatus?: FeeAppStatus;
  setCurrency: typeof setCurrency;
  setTheme: typeof setTheme;
  theme: Theme;
  updateFeeAppStatus: () => void;
  vault?: VaultBase;
};

export const CoreContext = createContext<CoreContextProps | undefined>(
  undefined
);
