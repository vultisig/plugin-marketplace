type RouteKey =
  | "apps"
  | "appDetails"
  | "faq"
  | "notFound"
  | "root"
  | "transactions";

export const routeTree = {
  faq: { path: "/faq" },
  notFound: { path: "*" },
  apps: { path: "/apps" },
  appDetails: {
    link: (id: string) => `/apps/${id}`,
    path: "/apps/:id",
  },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: string[]) => string }
>;
