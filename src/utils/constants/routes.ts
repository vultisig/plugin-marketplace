type RouteKey =
  | "apps"
  | "appDetails"
  | "appPolicy"
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
  appPolicy: {
    link: (appId: string, policyId?: string) =>
      `/apps/${appId}/policy${policyId ? `/${policyId}` : ""}`,
    path: "/apps/:appId/policy/:policyId?",
  },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: string[]) => string }
>;
