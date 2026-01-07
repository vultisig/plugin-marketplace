type RouteKey =
  | "app"
  | "automations"
  | "billing"
  | "faq"
  | "feeTransactions"
  | "myApps"
  | "notFound"
  | "root"
  | "transactions";

export const routeTree = {
  app: {
    link: (id: string) => `/app/${id}`,
    path: "/app/:id",
  },

  automations: {
    link: (id: string) => `/app/${id}/automations`,
    path: "/app/:id/automations",
  },
  billing: { path: "/billing" },
  faq: { path: "/faq" },
  feeTransactions: {
    link: (id: string) => `/app/${id}/transactions`,
    path: "/app/:id/transactions",
  },
  myApps: { path: "/my-apps" },
  notFound: { path: "*" },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: string[]) => string }
>;
