export const defaultPageSize = 12;

export const modalHash = {
  currency: "#currency",
  language: "#language",
  payment: "#payment",
  policy: "#policy",
  requirements: "#requirements",
  review: "#review",
} as const;

export const storeApiUrl = import.meta.env.VITE_APP_STORE_URL;
export const vultiApiUrl = import.meta.env.VITE_VULTISIG_SERVER;
