import { fromBinary, fromJson } from "@bufbuild/protobuf";
import { base64Decode } from "@bufbuild/protobuf/wire";
import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";

import {
  PolicySchema,
  PolicySuggestJson,
  PolicySuggestSchema,
} from "@/proto/policy_pb";
import { delToken, getToken, setToken } from "@/storage/token";
import { getVaultId } from "@/storage/vaultId";
import { PAGE_SIZE } from "@/utils/constants";
import { toCamelCase } from "@/utils/functions";
import { toSnakeCase } from "@/utils/functions";
import {
  App,
  AppFilters,
  AppPolicy,
  AuthTokenForm,
  Category,
  CustomAppPolicy,
  ListFilters,
  RecipeSchema,
  ReshareForm,
  Review,
  ReviewForm,
} from "@/utils/types";

import { Currency } from "./currency";

type JwtPayload = {
  exp: number;
  iat: number;
  public_key: string;
  token_id: string;
};

const refreshAuthToken = async (oldToken: string) => {
  return axios
    .post<{ token: string }>(
      `${import.meta.env.VITE_MARKETPLACE_URL}/auth/refresh`,
      { token: oldToken },
      {
        headers: {
          Authorization: `Bearer ${oldToken}`,
          "Content-Type": "application/json",
        },
      }
    )
    .then(({ data }) => data.token);
};

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const publicKey = getVaultId();
    const token = getToken(publicKey);

    if (!token) {
      return { ...config, headers: config.headers.setAuthorization(null) };
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const now = Math.floor(Date.now() / 1000);
      const issuedAt = decoded.iat ?? decoded.exp - 7 * 24 * 60 * 60;
      const totalLifetime = decoded.exp - issuedAt;
      const remainingLifetime = decoded.exp - now;

      if (totalLifetime <= 0 || remainingLifetime <= 0) {
        delToken(publicKey!);
        return config;
      }

      const percentRemaining = (remainingLifetime / totalLifetime) * 100;
      if (percentRemaining < 10) {
        const newToken = await refreshAuthToken(token);
        setToken(publicKey!, newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn(
        "Failed to decode or refresh token. Using current token.",
        err
      );
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const publicKey = getVaultId();

      if (publicKey) delToken(publicKey);
    }

    return Promise.reject(
      new Error(error.response?.data?.error?.message || error.message)
    );
  }
);

const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  api.delete<T>(url, config).then(({ data }) => toCamelCase(data));

const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  await api.get<T>(url, config).then(({ data }) => toCamelCase(data));

const post = async <T>(
  url: string,
  data?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> =>
  api.post<T>(url, data, config).then(({ data }) => toCamelCase(data));

// export const put = async <T>(
//   url: string,
//   data?: any,
//   config?: AxiosRequestConfig
// ): Promise<T> =>
//   api
//     .put<T>(url, data, config)
//     .then(({ data }) => toCamelCase(data));

const storeUrl = import.meta.env.VITE_MARKETPLACE_URL;
const vultisigUrl = import.meta.env.VITE_VULTISIG_SERVER;

export const addPolicy = async (data: AppPolicy) =>
  post<AppPolicy>(`${storeUrl}/plugin/policy`, toSnakeCase(data));

export const addReview = async (appId: string, data: ReviewForm) =>
  post<Review>(`${storeUrl}/plugins/${appId}/reviews`, toSnakeCase(data));

export const delPolicy = (id: string, signature: string) =>
  del(`${storeUrl}/plugin/policy/${id}`, { data: { signature } });

export const getAuthToken = async (data: AuthTokenForm) =>
  post<{ token: string }>(`${storeUrl}/auth`, toSnakeCase(data)).then(
    ({ token }) => token
  );

export const getApp = async (id: string) =>
  get<App>(`${storeUrl}/plugins/${id}`).then((plugin) => {
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
  get<{ plugins: App[]; totalCount: number }>(`${storeUrl}/plugins`, {
    params: toSnakeCase({ categoryId, skip, sort, take, term }),
  }).then(({ plugins, totalCount }) => {
    const modifiedPlugins: App[] =
      plugins?.map((plugin) => ({
        ...plugin,
        pricing: plugin.pricing || [],
      })) || [];

    return { apps: modifiedPlugins, totalCount };
  });

export const getBaseValue = async (currency: Currency) => {
  if (currency === "usd") return Promise.resolve(1);

  const modifiedCurrency = currency.toUpperCase();

  return get<{
    data: {
      [id: string]: { quote: { [currency: string]: { price: number } } };
    };
  }>(
    `${vultisigUrl}/cmc/v2/cryptocurrency/quotes/latest?id=825&skip_invalid=true&aux=is_active&convert=${currency}`
  )
    .then(({ data }) => {
      if (data && data[825]?.quote && data[825].quote[modifiedCurrency]) {
        return data[825].quote[modifiedCurrency].price || 0;
      } else {
        return 0;
      }
    })
    .catch(() => 0);
};

export const getCategories = () => get<Category[]>(`${storeUrl}/categories`);

export const getPolicies = (
  appId: string,
  { skip, take = PAGE_SIZE }: ListFilters
) =>
  get<{ policies: AppPolicy[]; totalCount: number }>(
    `${storeUrl}/plugin/policies/${appId}`,
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
  get<RecipeSchema>(`${storeUrl}/plugins/${appId}/recipe-specification`).catch(
    () => undefined
  );

export const getRecipeSuggestion = (
  appId: string,
  configuration: Record<string, any>
) =>
  post<PolicySuggestJson>(
    `${storeUrl}/plugins/${appId}/recipe-specification/suggest`,
    { configuration }
  )
    .then((suggest) => fromJson(PolicySuggestSchema, suggest))
    .catch(() => fromJson(PolicySuggestSchema, {}));

export const getReviews = (
  appId: string,
  { skip, take = PAGE_SIZE }: ListFilters
) =>
  get<{ reviews: Review[]; totalCount: number }>(
    `${storeUrl}/plugins/${appId}/reviews`,
    { params: toSnakeCase({ skip, take }) }
  ).then(({ reviews, totalCount }) => ({ reviews: reviews || [], totalCount }));

export const isAppInstalled = (id: string) =>
  get(`${storeUrl}/vault/exist/${id}/${getVaultId()}`)
    .then(() => true)
    .catch(() => false);

export const reshareVault = (data: ReshareForm) =>
  post(`${storeUrl}/vault/reshare`, toSnakeCase(data));

export const uninstallApp = (appId: string) =>
  del(`${storeUrl}/plugin/${appId}`);
