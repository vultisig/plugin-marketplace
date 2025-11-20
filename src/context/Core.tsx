import { createContext } from "react";

import { setChain } from "@/storage/chain";
import { setCurrency } from "@/storage/currency";
import { setLanguage } from "@/storage/language";
import { setTheme } from "@/storage/theme";
import { Currency } from "@/utils/currency";
import { Language } from "@/utils/language";
import { Theme } from "@/utils/theme";
import { Vault } from "@/utils/types";

export type CoreContextProps = {
  address?: string;
  baseValue: number;
  chain: string;
  connect: () => void;
  currency: Currency;
  disconnect: () => void;
  isConnected: boolean;
  language: Language;
  setChain: typeof setChain;
  setCurrency: typeof setCurrency;
  setLanguage: typeof setLanguage;
  setTheme: typeof setTheme;
  theme: Theme;
  vault?: Vault;
};

export const CoreContext = createContext<CoreContextProps | undefined>(
  undefined
);
