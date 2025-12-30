import { FC, useEffect, useState } from "react";

import { TokenImage } from "@/components/TokenImage";
import { useQueries } from "@/hooks/useQueries";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack } from "@/toolkits/Stack";
import { Chain, nativeTokens } from "@/utils/chain";
import { Token } from "@/utils/types";

export const AutomationFormToken: FC<{ chain: Chain; id: string }> = ({
  chain,
  id,
}) => {
  const [token, setToken] = useState<Token | undefined>(undefined);
  const { getTokenData } = useQueries();

  useEffect(() => {
    let cancelled = false;

    if (id) {
      getTokenData(chain, id)
        .catch(() => undefined)
        .then((token) => {
          if (!cancelled) setToken(token);
        });
    } else {
      setToken(nativeTokens[chain]);
    }

    return () => {
      cancelled = true;
    };
  }, [chain, id]);

  if (!token) return <Spin size="small" />;

  return (
    <HStack
      $style={{ alignItems: "center", gap: "8px", justifyContent: "center" }}
    >
      <Stack $style={{ position: "relative" }}>
        <TokenImage
          alt={token.ticker}
          borderRadius="50%"
          height="20px"
          src={token.logo}
          width="20px"
        />
        {(!!id || chain !== token.chain) && (
          <Stack
            $style={{ bottom: "-2px", position: "absolute", right: "-2px" }}
          >
            <TokenImage
              alt={chain}
              borderRadius="50%"
              height="12px"
              src={`/tokens/${chain.toLowerCase()}.svg`}
              width="12px"
            />
          </Stack>
        )}
      </Stack>
      <Stack as="span" $style={{ lineHeight: "20px" }}>
        {token.ticker}
      </Stack>
    </HStack>
  );
};
