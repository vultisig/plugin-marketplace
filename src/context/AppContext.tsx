import { MessageInstance } from "antd/es/message/interface";
import { HookAPI } from "antd/es/modal/useModal";
import { createContext } from "react";

import { setChain } from "@/storage/chain";
import { setCurrency } from "@/storage/currency";
import { setLanguage } from "@/storage/language";
import { setTheme } from "@/storage/theme";
import { Currency } from "@/utils/constants/currency";
import { Language } from "@/utils/constants/language";
import { Theme } from "@/utils/constants/theme";

interface AppContextType {
  address?: string;
  chain: string;
  connect: () => void;
  currency: Currency;
  disconnect: () => void;
  isConnected: boolean;
  language: Language;
  messageAPI: MessageInstance;
  modalAPI: HookAPI;
  setChain: typeof setChain;
  setCurrency: typeof setCurrency;
  setLanguage: typeof setLanguage;
  setTheme: typeof setTheme;
  theme: Theme;
  vaultId?: string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
