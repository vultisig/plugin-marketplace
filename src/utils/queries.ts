import { useQuery } from "@tanstack/react-query";

import { getTokenMetadata } from "@/utils/api";
import { Token } from "@/utils/types";

export const useTokenMetadata = ({
  chain,
  id,
}: Pick<Token, "chain" | "id">) => {
  return useQuery({
    enabled: false,
    queryKey: ["token", chain, id],
    queryFn: () => getTokenMetadata({ chain, id }),
  });
};
