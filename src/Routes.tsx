import { FC, ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { useCore } from "@/hooks/useCore";
import { DefaultLayout } from "@/layouts/Default";
import { AppPage } from "@/pages/App";
import { BillingPage } from "@/pages/Billing";
import { FaqPage } from "@/pages/FAQ";
import { MainPage } from "@/pages/Main";
import { MyAppsPage } from "@/pages/MyApps";
import { NotFoundPage } from "@/pages/NotFound";
import { routeTree } from "@/utils/routes";

const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected } = useCore();
  return isConnected ? children : <Navigate to={routeTree.root.path} replace />;
};

export const Routes = () => {
  const router = createBrowserRouter([
    {
      path: routeTree.root.path,
      element: <DefaultLayout />,
      children: [
        { index: true, element: <MainPage /> },
        { path: routeTree.app.path, element: <AppPage /> },
        {
          path: routeTree.billing.path,
          element: (
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          ),
        },
        {
          path: routeTree.myApps.path,
          element: (
            <ProtectedRoute>
              <MyAppsPage />
            </ProtectedRoute>
          ),
        },

        { path: routeTree.faq.path, element: <FaqPage /> },
      ],
    },
    { path: routeTree.notFound.path, element: <NotFoundPage /> },
  ]);

  return <RouterProvider router={router} />;
};
