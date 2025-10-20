import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { i18nInstance } from "@/i18n/config";
import { DefaultLayout } from "@/layouts/default";
import { AppDetailsPage } from "@/pages/app-details";
import { AppsPage } from "@/pages/apps";
import { FaqPage } from "@/pages/faq";
import { NotFoundPage } from "@/pages/not-found";
import { AntdProvider } from "@/providers/antd";
import { CoreProvider } from "@/providers/core";
import { StyledProvider } from "@/providers/styled";
import { routeTree } from "@/utils/routes";

export const App = () => (
  <I18nextProvider i18n={i18nInstance}>
    <CoreProvider>
      <StyledProvider>
        <AntdProvider>
          <BrowserRouter>
            <Routes>
              <Route path={routeTree.root.path} element={<DefaultLayout />}>
                <Route
                  element={<Navigate to={routeTree.apps.path} replace />}
                  index
                />
                <Route element={<AppsPage />} path={routeTree.apps.path} />
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
  </I18nextProvider>
);
