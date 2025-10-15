import { fromBinary, fromJson } from "@bufbuild/protobuf";
import { base64Decode } from "@bufbuild/protobuf/wire";

import {
  PolicySchema,
  PolicySuggestJson,
  PolicySuggestSchema,
} from "@/proto/policy_pb";
import { getVaultId } from "@/storage/vaultId";
import { PAGE_SIZE } from "@/utils/constants/core";
import { toSnakeCase } from "@/utils/functions";
import { del, get, post } from "@/utils/services/api";
import {
  App,
  AppFilters,
  AppPolicy,
  AuthTokenForm,
  Category,
  CustomAppPolicy,
  CustomRecipeSchema,
  ListFilters,
  ReshareForm,
  Review,
  ReviewForm,
} from "@/utils/types";

const baseUrl = import.meta.env.VITE_MARKETPLACE_URL;

export const addPolicy = async (data: AppPolicy) =>
  post<AppPolicy>(`${baseUrl}/plugin/policy`, toSnakeCase(data));

export const addReview = async (appId: string, data: ReviewForm) =>
  post<Review>(`${baseUrl}/plugins/${appId}/reviews`, toSnakeCase(data));

export const delPolicy = (id: string, signature: string) =>
  del(`${baseUrl}/plugin/policy/${id}`, { data: { signature } });

export const getAuthToken = async (data: AuthTokenForm) =>
  post<{ token: string }>(`${baseUrl}/auth`, toSnakeCase(data)).then(
    ({ token }) => token
  );

export const getApp = async (id: string) =>
  get<App>(`${baseUrl}/plugins/${id}`).then((plugin) => {
    const count =
      plugin.ratings?.reduce((sum, item) => sum + item.count, 0) || 0;
    const average = count
      ? plugin.ratings.reduce(
          (sum, item) => sum + item.rating * item.count,
          0
        ) / count
      : 0;
    const clamped = Math.min(Math.max(average, 1), 5);
    const rate = Math.round(clamped * 2) / 2;

    return {
      ...plugin,
      pricing: plugin.pricing || [],
      rating: { count, rate },
      ratings: plugin.ratings || [],
    };
  });

export const getApps = ({
  categoryId,
  skip,
  sort = "-created_at",
  take = PAGE_SIZE,
  term,
}: ListFilters & AppFilters) =>
  get<{ plugins: App[]; totalCount: number }>(`${baseUrl}/plugins`, {
    params: toSnakeCase({ categoryId, skip, sort, take, term }),
  }).then(({ plugins, totalCount }) => {
    const modifiedPlugins: App[] =
      plugins?.map((plugin) => ({
        ...plugin,
        pricing: plugin.pricing || [],
      })) || [];

    return { plugins: modifiedPlugins, totalCount };
  });

export const getCategories = () => get<Category[]>(`${baseUrl}/categories`);

export const getPolicies = (
  appId: string,
  { skip, take = PAGE_SIZE }: ListFilters
) =>
  get<{ policies: AppPolicy[]; totalCount: number }>(
    `${baseUrl}/plugin/policies/${appId}`,
    { params: toSnakeCase({ skip, take }) }
  ).then(({ policies, totalCount }) => {
    const modifiedPolicies: CustomAppPolicy[] =
      policies?.map((policy) => {
        const decoded = base64Decode(policy.recipe);
        const parsedRecipe = fromBinary(PolicySchema, decoded);

        return { ...policy, parsedRecipe };
      }) || [];

    return { policies: modifiedPolicies, totalCount };
  });

export const getRecipeSpecification = (appId: string) =>
  get<CustomRecipeSchema>(
    `${baseUrl}/plugins/${appId}/recipe-specification`
  ).catch(() => undefined);

export const getRecipeSuggestion = (
  appId: string,
  configuration: Record<string, string>
) =>
  post<PolicySuggestJson>(
    `${baseUrl}/plugins/${appId}/recipe-specification/suggest`,
    { configuration }
  )
    .then((suggest) => fromJson(PolicySuggestSchema, suggest))
    .catch(() => fromJson(PolicySuggestSchema, {}));

export const getReviews = (
  appId: string,
  { skip, take = PAGE_SIZE }: ListFilters
) =>
  get<{ reviews: Review[]; totalCount: number }>(
    `${baseUrl}/plugins/${appId}/reviews`,
    { params: toSnakeCase({ skip, take }) }
  ).then(({ reviews, totalCount }) => ({ reviews: reviews || [], totalCount }));

export const isAppInstalled = (id: string) =>
  get(`${baseUrl}/vault/exist/${id}/${getVaultId()}`)
    .then(() => true)
    .catch(() => false);

export const reshareVault = (data: ReshareForm) =>
  post(`${baseUrl}/vault/reshare`, toSnakeCase(data));

export const uninstallApp = (appId: string) =>
  del(`${baseUrl}/plugin/${appId}`);
