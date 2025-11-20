type RouteKey =
  | "appDetails"
  | "billing"
  | "faq"
  | "myApps"
  | "notFound"
  | "root"
  | "transactions";

export const routeTree = {
  appDetails: {
    link: (id: string) => `/apps/${id}`,
    path: "/apps/:id",
  },
  billing: { path: "/billing" },
  faq: { path: "/faq" },
  myApps: { path: "/my-apps" },
  notFound: { path: "*" },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: string[]) => string }
>;
