import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
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

  const router = createBrowserRouter([
    {
      path: routeTree.root.path,
      element: <DefaultLayout />,
      children: [
        {
          index: true,
          element: <MainPage />,
        },
        {
          path: routeTree.app.path,
          element: <AppPage />,
        },
        isConnected
          ? {
              path: routeTree.myApps.path,
              element: <MyAppsPage />,
            }
          : {
              path: routeTree.myApps.path,
              element: <Navigate to={routeTree.root.path} replace />,
            },
        {
          path: routeTree.faq.path,
          element: <FaqPage />,
        },
      ],
    },
    {
      path: routeTree.notFound.path,
      element: <NotFoundPage />,
    },
  ]);

  return <RouterProvider router={router} />;
};
