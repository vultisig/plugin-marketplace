import { fromBinary, fromJson, JsonObject } from "@bufbuild/protobuf";
import { base64Decode } from "@bufbuild/protobuf/wire";
import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";
import { Address, createPublicClient, erc20Abi, http } from "viem";

import {
  PolicySchema,
  PolicySuggestJson,
  PolicySuggestSchema,
} from "@/proto/policy_pb";
import { delToken, getToken, setToken } from "@/storage/token";
import { getVaultId } from "@/storage/vaultId";
import { EvmChain, evmChainIds, evmChainInfo } from "@/utils/chain";
import { defaultPageSize, storeApiUrl, vultiApiUrl } from "@/utils/constants";
import { Currency } from "@/utils/currency";
import { toCamelCase } from "@/utils/functions";
import { toSnakeCase } from "@/utils/functions";
import {
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

type JwtPayload = {
  exp: number;
  iat: number;
  public_key: string;
  token_id: string;
};

const refreshAuthToken = async (oldToken: string) => {
  return axios
    .post<{ token: string }>(
      `${import.meta.env.VITE_APP_STORE_URL}/auth/refresh`,
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

export const addPolicy = async (data: AppPolicy) => {
  return post<AppPolicy>(`${storeApiUrl}/plugin/policy`, toSnakeCase(data));
};

export const addReview = async (appId: string, data: ReviewForm) => {
  return post<Review>(
    `${storeApiUrl}/plugins/${appId}/reviews`,
    toSnakeCase(data)
  );
};

export const delPolicy = async (id: string, signature: string) => {
  return del(`${storeApiUrl}/plugin/policy/${id}`, { data: { signature } });
};

export const getAuthToken = async (data: AuthToken) => {
  return post<{ token: string }>(`${storeApiUrl}/auth`, toSnakeCase(data)).then(
    ({ token }) => token
  );
};

export const getApp = async (id: string) => {
  return get<App>(`${storeApiUrl}/plugins/${id}`).then((plugin) => {
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
};

export const getApps = async ({
  categoryId,
  skip,
  sort = "-created_at",
  take = defaultPageSize,
  term,
}: ListFilters & AppFilters) => {
  return get<{ plugins: App[]; totalCount: number }>(`${storeApiUrl}/plugins`, {
    params: toSnakeCase({ categoryId, skip, sort, take, term }),
  }).then(({ plugins, totalCount }) => {
    const modifiedPlugins: App[] =
      plugins?.map((plugin) => ({
        ...plugin,
        pricing: plugin.pricing || [],
      })) || [];

    return { apps: modifiedPlugins, totalCount };
  });
};

export const getBaseValue = async (currency: Currency) => {
  if (currency === "usd") return Promise.resolve(1);

  const modifiedCurrency = currency.toUpperCase();

  return get<{
    data: {
      [id: string]: { quote: { [currency: string]: { price: number } } };
    };
  }>(
    `${vultiApiUrl}/cmc/v2/cryptocurrency/quotes/latest?id=825&skip_invalid=true&aux=is_active&convert=${currency}`
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

export const getCategories = async () => {
  return get<Category[]>(`${storeApiUrl}/categories`);
};

export const getOneInchTokens = async (chain: EvmChain) => {
  const tokens: Token[] = [];
  const chainId = evmChainIds[chain as EvmChain];

  return get<{ tokens: Record<string, OneInchToken> }>(
    `${vultiApiUrl}/1inch/swap/v6.0/${chainId}/tokens`
  )
    .then(({ tokens: oneInchTokens }) => {
      Object.values(oneInchTokens).forEach((token) => {
        if (token.logoURI) {
          tokens.push({
            chain,
            decimals: token.decimals,
            id: token.address,
            logo: token.logoURI,
            name: token.name,
            ticker: token.symbol,
          });
        }
      });

      return tokens;
    })
    .catch(() => tokens);
};

export const getPolicies = async (
  appId: string,
  { skip, take = defaultPageSize }: ListFilters
) => {
  return get<{ policies: AppPolicy[]; totalCount: number }>(
    `${storeApiUrl}/plugin/policies/${appId}`,
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
};

export const getRecipeSpecification = async (appId: string) => {
  return get<RecipeSchema>(
    `${storeApiUrl}/plugins/${appId}/recipe-specification`
  ).catch(() => undefined);
};

export const getRecipeSuggestion = async (
  appId: string,
  configuration: JsonObject
) => {
  return post<PolicySuggestJson>(
    `${storeApiUrl}/plugins/${appId}/recipe-specification/suggest`,
    { configuration }
  )
    .then((suggest) => fromJson(PolicySuggestSchema, suggest))
    .catch(() => fromJson(PolicySuggestSchema, {}));
};

export const getReviews = async (
  appId: string,
  { skip, take = defaultPageSize }: ListFilters
) => {
  return get<{ reviews: Review[]; totalCount: number }>(
    `${storeApiUrl}/plugins/${appId}/reviews`,
    { params: toSnakeCase({ skip, take }) }
  ).then(({ reviews, totalCount }) => ({ reviews: reviews || [], totalCount }));
};

export const getJupiterToken = async (id: string) => {
  return get<JupiterToken[]>(`${vultiApiUrl}/jup/tokens/v2/search?query=${id}`)
    .then((jupiterTokens) => {
      const [jupiterToken] = jupiterTokens;

      const token: Token = {
        chain: "Solana",
        decimals: jupiterToken.decimals,
        id: jupiterToken.id,
        logo: jupiterToken.icon || "",
        name: jupiterToken.name,
        ticker: jupiterToken.symbol,
      };

      return token;
    })
    .catch(() => undefined);
};

export const getJupiterTokens = async () => {
  const tokens: Token[] = [];

  return get<JupiterToken[]>(`${vultiApiUrl}/jup/tokens/v2/tag?query=verified`)
    .then((jupiterTokens) => {
      jupiterTokens.forEach((token) => {
        if (token.icon) {
          tokens.push({
            chain: "Solana",
            decimals: token.decimals,
            id: token.id,
            logo: token.icon,
            name: token.name,
            ticker: token.symbol,
          });
        }
      });

      return tokens;
    })
    .catch(() => tokens);
};

export const getTokenMetadata = async ({
  chain,
  id,
}: Pick<Token, "chain" | "id">) => {
  if (evmChainInfo[chain as EvmChain]) {
    const client = createPublicClient({
      chain: evmChainInfo[chain as EvmChain],
      transport: http(),
    });

    const [decimals, name, ticker] = await Promise.all([
      client.readContract({
        address: id as Address,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: id as Address,
        abi: erc20Abi,
        functionName: "name",
      }),
      client.readContract({
        address: id as Address,
        abi: erc20Abi,
        functionName: "symbol",
      }),
    ]);

    const token: Token = {
      chain,
      decimals,
      id,
      logo: "",
      name,
      ticker,
    };

    return token;
  } else if (chain === "Solana") {
    return getJupiterToken(id);
  } else {
    return undefined;
  }
};

export const isAppInstalled = async (id: string) => {
  return get(`${storeApiUrl}/vault/exist/${id}/${getVaultId()}`)
    .then(() => true)
    .catch(() => false);
};

export const reshareVault = async (data: ReshareForm) => {
  return post(`${storeApiUrl}/vault/reshare`, toSnakeCase(data));
};

export const uninstallApp = async (appId: string) => {
  return del(`${storeApiUrl}/plugin/${appId}`);
};
