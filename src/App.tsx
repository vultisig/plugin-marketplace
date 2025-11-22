import { I18nextProvider } from "react-i18next";

import { i18nInstance } from "@/i18n/config";
import { AntdProvider } from "@/providers/Antd";
import { CoreProvider } from "@/providers/Core";
import { QueryProvider } from "@/providers/Query";
import { StyledProvider } from "@/providers/Styled";
import { Routes } from "@/Routes";

export const App = () => (
  <I18nextProvider i18n={i18nInstance}>
    <QueryProvider>
      <CoreProvider>
        <StyledProvider>
          <AntdProvider>
            <Routes />
          </AntdProvider>
        </StyledProvider>
      </CoreProvider>
    </QueryProvider>
  </I18nextProvider>
);
