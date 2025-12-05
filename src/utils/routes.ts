type RouteKey =
  | "app"
  | "billing"
  | "faq"
  | "myApps"
  | "notFound"
  | "root"
  | "transactions";

export const routeTree = {
  app: {
    link: (id: string) => `/app/${id}`,
    path: "/app/:id",
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
