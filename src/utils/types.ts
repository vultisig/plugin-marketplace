import type * as CSS from "csstype";

import { Policy } from "@/proto/policy_pb";
import { RecipeSchema as ProtoRecipeSchema } from "@/proto/recipe_specification_pb";
import { Chain } from "@/utils/chain";

export type App = {
  categoryId: string;
  createdAt: string;
  description: string;
  id: string;
  pricing: AppPricing[];
  rating: { count: number; rate: number };
  ratings: { count: number; rating: number }[];
  serverEndpoint: string;
  title: string;
  updatedAt: string;
};

export type AppFilters = {
  categoryId: string;
  sort: string;
  term: string;
};

export type AppPolicy = {
  active: boolean;
  id: string;
  pluginVersion: string;
  pluginId: string;
  policyVersion: number;
  publicKey: string;
  recipe: string;
  signature?: string;
};

export type AppPricing = {
  amount: number;
  createdAt: string;
  frequency: string;
  id: string;
  metric: string;
  type: string;
  updatedAt: string;
};

export type AuthToken = {
  chainCodeHex: string;
  message: string;
  publicKey: string;
  signature: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Configuration = {
  properties: Record<string, FieldProps>;
  required: string[];
};

export type CSSProperties = CSS.Properties<string>;

export type CustomAppPolicy = AppPolicy & { parsedRecipe: Policy };

export type Definitions = Record<string, Configuration>;

export type FieldProps = {
  description?: string;
  enum?: string[];
  format?: string;
  type?: string;
  $ref?: Widget;
};

export type OneInchToken = {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  name: string;
};

export type JupiterToken = {
  id: string;
  symbol: string;
  decimals: number;
  icon?: string;
  name: string;
};

export type ListFilters = {
  skip: number;
  take?: number;
};

export type RecipeSchema = Omit<ProtoRecipeSchema, "configuration"> & {
  configuration?: Configuration & { definitions: Definitions };
};

export type ReshareForm = {
  email: string;
  hexChainCode: string;
  hexEncryptionKey: string;
  localPartyId: string;
  name: string;
  oldParties: string[];
  pluginId: string;
  publicKey: string;
  sessionId: string;
};

export type Review = {
  address: string;
  comment: string;
  createdAt: string;
  id: string;
  pluginId: string;
  rating: number;
};

export type ReviewForm = {
  address: string;
  comment: string;
  rating: number;
};

export type Token = {
  chain: Chain;
  decimals: number;
  id: string;
  logo: string;
  name: string;
  ticker: string;
};

export type Vault = {
  hexChainCode: string;
  isFastVault: boolean;
  name: string;
  publicKeyEcdsa: string;
  publicKeyEddsa: string;
  uid: string;
};

export type Widget = "#/definitions/asset";
