import {
  BrowserRouter,
  Navigate,
  Route,
  Routes as ReactRoutes,
} from "react-router-dom";

import { useCore } from "@/hooks/useCore";
import { DefaultLayout } from "@/layouts/Default";
import { AppPage } from "@/pages/App";
import { FaqPage } from "@/pages/FAQ";
import { MainPage } from "@/pages/Main";
import { MyAppsPage } from "@/pages/MyApps";
import { NotFoundPage } from "@/pages/NotFound";
import { routeTree } from "@/utils/routes";

export const Routes = () => {
  const { isConnected } = useCore();

  return (
    <BrowserRouter>
      <ReactRoutes>
        <Route path={routeTree.root.path} element={<DefaultLayout />}>
          <Route element={<MainPage />} index />
          <Route element={<AppPage />} path={routeTree.app.path} />
          {isConnected ? (
            <Route element={<MyAppsPage />} path={routeTree.myApps.path} />
          ) : (
            <Route
              path={routeTree.myApps.path}
              element={<Navigate to={routeTree.root.path} replace />}
            />
          )}
          <Route element={<FaqPage />} path={routeTree.faq.path} />
        </Route>
        <Route path={routeTree.notFound.path} element={<NotFoundPage />} />
      </ReactRoutes>
    </BrowserRouter>
  );
};
