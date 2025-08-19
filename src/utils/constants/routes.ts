type RouteKey =
  | "faq"
  | "notFound"
  | "plugins"
  | "pluginDetails"
  | "root"
  | "transactions";

export const routeTree = {
  faq: { path: "/faq" },
  notFound: { path: "*" },
  plugins: { path: "/plugins" },
  pluginDetails: {
    link: (id: string | number) => `/plugins/${id}`,
    path: "/plugins/:id",
  },
  root: { path: "/" },
  transactions: { path: "/transactions" },
} satisfies Record<
  RouteKey,
  { path: string; link?: (...args: (string | number)[]) => string }
>;
