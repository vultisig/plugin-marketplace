import { fromBinary, fromJson, JsonObject } from "@bufbuild/protobuf";
import { base64Decode } from "@bufbuild/protobuf/wire";
import axios, { AxiosRequestConfig } from "axios";

import {
  PolicySchema,
  PolicySuggest,
  PolicySuggestJson,
  PolicySuggestSchema,
} from "@/proto/policy_pb";
import { delToken, getToken } from "@/storage/token";
import { getVaultId } from "@/storage/vaultId";
import { chains, EvmChain, evmChainInfo } from "@/utils/chain";
import {
  defaultPageSize,
  feeAppId,
  freeMode,
  recurringSwapsAppId,
  storeApiUrl,
  vultiApiUrl,
} from "@/utils/constants";
import { Currency } from "@/utils/currency";
import { normalizeApp, toCamelCase } from "@/utils/functions";
import { toSnakeCase } from "@/utils/functions";
import { faqs } from "@/utils/mockData";
import {
  APIResponse,
  App,
  AppFilters,
  AppPolicy,
  AuthToken,
  Category,
  CustomAppPolicy,
  JupiterToken,
  ListFilters,
  OneInchToken,
  RecipeSchema,
  ReshareForm,
  Review,
  ReviewForm,
  Token,
} from "@/utils/types";

const api = axios.create({ headers: { "Content-Type": "application/json" } });

api.interceptors.request.use(
  (config) => {
    if (config.url?.startsWith(storeApiUrl)) {
      const publicKey = getVaultId();
      const token = getToken(publicKey);

      return {
        ...config,
        headers: config.headers.setAuthorization(
          token ? `Bearer ${token}` : null
        ),
      };
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

const externalGet = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return await api.get<T>(url, config).then(({ data }) => toCamelCase(data));
};

const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return api
    .delete<APIResponse<T>>(url, config)
    .then(({ data }) => toCamelCase(data.data));
};

const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return await api
    .get<APIResponse<T>>(url, config)
    .then(({ data }) => toCamelCase(data.data));
};

const post = async <T>(
  url: string,
  data?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> => {
  return api
    .post<APIResponse<T>>(url, data, config)
    .then(({ data }) => toCamelCase(data.data));
};

// const put = async <T>(
//   url: string,
//   data?: any,
//   config?: AxiosRequestConfig
// ): Promise<T> => {
//   return api
//     .put<APIResponse<T>>(url, data, config)
//     .then(({ data }) => toCamelCase(data.data));
// };

export const addPolicy = async (data: AppPolicy): Promise<void> => {
  return post<void>(`${storeApiUrl}/plugin/policy`, toSnakeCase(data));
};

export const addReview = async (
  appId: string,
  data: ReviewForm
): Promise<void> => {
  return post<void>(
    `${storeApiUrl}/plugins/${appId}/reviews`,
    toSnakeCase(data)
  );
};

export const delPolicy = async (
  id: string,
  signature: string
): Promise<void> => {
  return del<void>(`${storeApiUrl}/plugin/policy/${id}`, {
    data: { signature },
  });
};

export const getAuthToken = async (data: AuthToken): Promise<string> => {
  const { token } = await post<{ token: string }>(
    `${storeApiUrl}/auth`,
    toSnakeCase(data)
  );
  return token;
};

export const getApp = async (id: string): Promise<App> => {
  const app = await get<App>(`${storeApiUrl}/plugins/${id}`);

  const faq = faqs[id];

  if (faq) return normalizeApp({ ...app, faqs: faq });

  return normalizeApp(app);
};

export const getApps = async ({
  categoryId,
  skip,
  sort = "-created_at",
  take = defaultPageSize,
  term,
}: ListFilters & AppFilters): Promise<{ apps: App[]; totalCount: number }> => {
  try {
    const { plugins, totalCount } = await get<{
      plugins: App[];
      totalCount: number;
    }>(`${storeApiUrl}/plugins`, {
      params: toSnakeCase({ categoryId, skip, sort, take, term }),
    });

    if (!totalCount) return { apps: [], totalCount: 0 };

    return {
      apps: freeMode
        ? plugins.map(normalizeApp)
        : plugins.filter(({ id }) => id !== feeAppId).map(normalizeApp),
      totalCount,
    };
  } catch {
    return { apps: [], totalCount: 0 };
  }
};

export const getBaseValue = async (currency: Currency): Promise<number> => {
  if (currency === "usd") return 1;

  const modifiedCurrency = currency.toUpperCase();

  try {
    const { data } = await externalGet<{
      data: {
        [id: string]: { quote: { [currency: string]: { price: number } } };
      };
    }>(
      `${vultiApiUrl}/cmc/v2/cryptocurrency/quotes/latest?id=825&skip_invalid=true&aux=is_active&convert=${currency}`
    );

    const quote = data?.[825]?.quote?.[modifiedCurrency];

    return quote?.price ?? 0;
  } catch {
    return 0;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  return get<Category[]>(`${storeApiUrl}/categories`);
};

export const getMyApps = async ({
  skip,
  take = defaultPageSize,
}: ListFilters): Promise<{ apps: App[]; totalCount: number }> => {
  try {
    const { plugins, totalCount } = await get<{
      plugins: App[];
      totalCount: number;
    }>(`${storeApiUrl}/plugins/installed`, {
      params: toSnakeCase({ skip, take }),
    });

    return { apps: plugins, totalCount };
  } catch {
    return { apps: [], totalCount: 0 };
  }
};

export const getOneInchToken = async (
  chain: EvmChain,
  id: string
): Promise<Token> => {
  const tokens = await externalGet<OneInchToken[]>(
    `${vultiApiUrl}/1inch/token/v1.2/${evmChainInfo[chain].id}/search?query=${id}`
  );

  const token = tokens.find(
    (token) => token.address.toLowerCase() === id.toLowerCase()
  );

  if (!token) throw new Error();

  return {
    chain,
    decimals: token.decimals,
    id: token.address,
    logo: token.logoURI || "",
    name: token.name,
    ticker: token.symbol,
  };
};

export const getOneInchTokens = async (chain: EvmChain): Promise<Token[]> => {
  const { tokens } = await externalGet<{
    tokens: Record<string, OneInchToken>;
  }>(`${vultiApiUrl}/1inch/swap/v6.0/${evmChainInfo[chain].id}/tokens`);

  return Object.values(tokens).map((token) => ({
    chain,
    decimals: token.decimals,
    id: token.address,
    logo: token.logoURI || "",
    name: token.name,
    ticker: token.symbol,
  }));
};

export const getPolicies = async (
  appId: string,
  { skip, take = defaultPageSize }: ListFilters
): Promise<{ policies: CustomAppPolicy[]; totalCount: number }> => {
  try {
    const { policies, totalCount } = await get<{
      policies: AppPolicy[];
      totalCount: number;
    }>(`${storeApiUrl}/plugin/policies/${appId}`, {
      params: toSnakeCase({ skip, take }),
    });

    if (!totalCount) return { policies: [], totalCount: 0 };

    const modifiedPolicies: CustomAppPolicy[] = policies.map((policy) => {
      const decoded = base64Decode(policy.recipe);
      const parsedRecipe = fromBinary(PolicySchema, decoded);

      return { ...policy, parsedRecipe };
    });

    return { policies: modifiedPolicies, totalCount };
  } catch {
    return { policies: [], totalCount: 0 };
  }
};

export const getRecipeSpecification = async (
  appId: string
): Promise<RecipeSchema> => {
  const { configurationExample, ...rest } = await get<RecipeSchema>(
    `${storeApiUrl}/plugins/${appId}/recipe-specification`
  );

  if (appId !== recurringSwapsAppId) return rest as RecipeSchema;

  return { configurationExample, ...rest };
};

export const getRecipeSuggestion = async (
  appId: string,
  configuration: JsonObject
): Promise<PolicySuggest> => {
  try {
    const suggest = await post<PolicySuggestJson>(
      `${storeApiUrl}/plugins/${appId}/recipe-specification/suggest`,
      { configuration }
    );

    return fromJson(PolicySuggestSchema, suggest);
  } catch {
    return fromJson(PolicySuggestSchema, {});
  }
};

export const getReviews = async (
  appId: string,
  { skip, take = defaultPageSize }: ListFilters
): Promise<{ reviews: Review[]; totalCount: number }> => {
  try {
    const { reviews, totalCount } = await get<{
      reviews: Review[];
      totalCount: number;
    }>(`${storeApiUrl}/plugins/${appId}/reviews`, {
      params: toSnakeCase({ skip, take }),
    });

    if (!totalCount) return { reviews: [], totalCount: 0 };

    return { reviews, totalCount };
  } catch {
    return { reviews: [], totalCount: 0 };
  }
};

export const getJupiterToken = async (id: string): Promise<Token> => {
  const [jupiterToken] = await externalGet<JupiterToken[]>(
    `${vultiApiUrl}/jup/tokens/v2/search?query=${id}`
  );

  if (!jupiterToken) throw new Error();

  return {
    chain: chains.Solana,
    decimals: jupiterToken.decimals,
    id: jupiterToken.id,
    logo: jupiterToken.icon || "",
    name: jupiterToken.name,
    ticker: jupiterToken.symbol,
  };
};

export const getJupiterTokens = async (): Promise<Token[]> => {
  const jupiterTokens = await externalGet<JupiterToken[]>(
    `${vultiApiUrl}/jup/tokens/v2/tag?query=verified`
  );

  return jupiterTokens.map((token) => ({
    chain: chains.Solana,
    decimals: token.decimals,
    id: token.id,
    logo: token.icon || "",
    name: token.name,
    ticker: token.symbol,
  }));
};

export const isAppInstalled = async (id: string): Promise<boolean> => {
  try {
    await get(`${storeApiUrl}/vault/exist/${id}/${getVaultId()}`);
    return true;
  } catch {
    return false;
  }
};

export const reshareVault = async (data: ReshareForm): Promise<void> => {
  return post<void>(`${storeApiUrl}/vault/reshare`, toSnakeCase(data));
};

export const uninstallApp = async (appId: string): Promise<void> => {
  return del<void>(`${storeApiUrl}/plugin/${appId}`);
};
