import type * as CSS from "csstype";

import { Policy } from "@/proto/policy_pb";
import { RecipeSchema } from "@/proto/recipe_specification_pb";

export type AuthTokenForm = {
  chainCodeHex: string;
  message: string;
  publicKey: string;
  signature: string;
};

export type Category = {
  id: string;
  name: string;
};

export type CustomAppPolicy = AppPolicy & { parsedRecipe: Policy };

export type CustomRecipeSchema = Omit<RecipeSchema, "configuration"> & {
  configuration?: {
    properties: Record<string, DynamicFieldProps>;
    required: string[];
    type: "object";
  };
};

export type DynamicFieldProps = {
  enum: string[];
  format: string;
  type: string;
};

export type ListFilters = {
  skip: number;
  take?: number;
};

export type App = {
  categoryId: string;
  createdAt: string;
  description: string;
  id: string;
  pricing: AppPricing[];
  rating: { count: number; rate: number };
  ratings: Rating[];
  serverEndpoint: string;
  title: string;
  updatedAt: string;
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

type Rating = {
  count: number;
  rating: number;
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

export type Vault = {
  hexChainCode: string;
  isFastVault: boolean;
  name: string;
  publicKeyEcdsa: string;
  publicKeyEddsa: string;
  uid: string;
};

export type AppFilters = {
  categoryId: string;
  sort: string;
  term: string;
};

export type CSSProperties = CSS.Properties<string>;
