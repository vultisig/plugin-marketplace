type RouteKey =
  | "apps"
  | "appDetails"
  | "billing"
  | "faq"
  | "notFound"
  | "root"
  | "transactions";

export const routeTree = {
  apps: { path: "/apps" },
  appDetails: {
    link: (id: string) => `/apps/${id}`,
    path: "/apps/:id",
  },
  billing: { path: "/billing" },
  faq: { path: "/faq" },
  notFound: { path: "*" },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: string[]) => string }
>;
