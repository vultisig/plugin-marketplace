type RouteKey =
  | "apps"
  | "appDetails"
  | "appPolicy"
  | "faq"
  | "notFound"
  | "root"
  | "transactions";

type Id = string | number;

export const routeTree = {
  faq: { path: "/faq" },
  notFound: { path: "*" },
  apps: { path: "/apps" },
  appDetails: {
    link: (id: Id) => `/apps/${id}`,
    path: "/apps/:id",
  },
  appPolicy: {
    link: (appId: Id, policyId?: Id) =>
      `/apps/${appId}/policy${policyId ? `/${policyId}` : ""}`,
    path: "/apps/:appId/policy/:policyId?",
  },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: Id[]) => string }
>;
