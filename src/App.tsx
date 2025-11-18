import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { i18nInstance } from "@/i18n/config";
import { DefaultLayout } from "@/layouts/Default";
import { AppDetailsPage } from "@/pages/AppDetails";
import { AppsPage } from "@/pages/Apps";
import { FaqPage } from "@/pages/FAQ";
import { NotFoundPage } from "@/pages/NotFound";
import { AntdProvider } from "@/providers/Antd";
import { CoreProvider } from "@/providers/Core";
import { QueryProvider } from "@/providers/Query";
import { StyledProvider } from "@/providers/Styled";
import { routeTree } from "@/utils/routes";

export const App = () => (
  <I18nextProvider i18n={i18nInstance}>
    <QueryProvider>
      <CoreProvider>
        <StyledProvider>
          <AntdProvider>
            <BrowserRouter>
              <Routes>
                <Route path={routeTree.root.path} element={<DefaultLayout />}>
                  <Route element={<AppsPage />} index />
                  <Route
                    element={<AppDetailsPage />}
                    path={routeTree.appDetails.path}
                  />
                  <Route element={<FaqPage />} path={routeTree.faq.path} />
                </Route>
                <Route
                  path={routeTree.notFound.path}
                  element={<NotFoundPage />}
                />
              </Routes>
            </BrowserRouter>
          </AntdProvider>
        </StyledProvider>
      </CoreProvider>
    </QueryProvider>
  </I18nextProvider>
);
