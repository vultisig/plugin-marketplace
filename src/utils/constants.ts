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
export const freeMode: boolean = import.meta.env.VITE_FREE_MODE === "true";
export const recurringSendsAppId: string = import.meta.env
  .VITE_RECURRING_SENDS_APP_ID;
export const recurringSwapsAppId: string = import.meta.env
  .VITE_RECURRING_SWAPS_APP_ID;
export const storeApiUrl: string = import.meta.env.VITE_APP_STORE_URL;
export const vultiApiUrl: string = import.meta.env.VITE_VULTISIG_SERVER;
