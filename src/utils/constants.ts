export const defaultPageSize = 12;

export const modalHash = {
  currency: "#currency",
  language: "#language",
  payment: "#payment",
  policy: "#policy",
  requirements: "#requirements",
  review: "#review",
} as const;

export const feeAppId: string = import.meta.env.VITE_FEE_APP_ID;
export const storeApiUrl: string = import.meta.env.VITE_APP_STORE_URL;
export const vultiApiUrl: string = import.meta.env.VITE_VULTISIG_SERVER;
