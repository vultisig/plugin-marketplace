import { Empty } from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Divider } from "@/components/Divider";
import { InputSearch } from "@/components/InputSearch";
import { Spin } from "@/components/Spin";
import { HStack, Stack, VStack } from "@/components/Stack";
import { useFilterParams } from "@/hooks/useFilterParams";
import { getTransactions } from "@/utils/services/marketplace";
import { Transaction, TransactionFilters } from "@/utils/types";

type InitialState = {
  loading: boolean;
  transactions: Transaction[];
};

export const TransactionsPage = () => {
  const initialState: InitialState = {
    loading: true,
    transactions: [],
  };
  const [state, setState] = useState(initialState);
  const { loading, transactions } = state;
  const { id = "ccf3cb30-abeb-474b-95ad-9361d0970943" } = useParams<{
    id: string;
  }>();
  const { filters, setFilters } = useFilterParams<TransactionFilters>();

  const fetchTransactions = useCallback(
    (skip: number, filters: TransactionFilters) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getTransactions(id, { ...filters, skip })
        .then(({ history: transactions }) => {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            transactions,
          }));
        })
        .catch(() => {
          setState((prevState) => ({ ...prevState, loading: false }));
        });
    },
    [id]
  );

  const debouncedFetchTransactions = useMemo(
    () => debounce(fetchTransactions, 500),
    [fetchTransactions]
  );

  useEffect(
    () => debouncedFetchTransactions(0, filters),
    [debouncedFetchTransactions, filters]
  );

  return (
    <VStack
      $style={{
        gap: "48px",
        maxWidth: "1200px",
        padding: "16px",
        width: "100%",
      }}
    >
      <VStack $style={{ flexGrow: "1", gap: "32px" }}>
        <VStack $style={{ gap: "24px" }}>
          <Stack
            as="span"
            $style={{
              fontSize: "40px",
              fontWeight: "500",
              lineHeight: "42px",
            }}
          >
            Transaction History
          </Stack>
          <Divider />
          <HStack $style={{ gap: "12px" }}>
            <InputSearch
              value={filters.term}
              onChange={({ target }) =>
                setFilters({ ...filters, term: target.value })
              }
            />
          </HStack>
        </VStack>

        {loading ? (
          <Spin />
        ) : transactions.length ? (
          <Stack
            $style={{
              display: "grid",
              gap: "32px",
              gridTemplateColumns: "repeat(2, 1fr)",
            }}
            $media={{
              xl: { $style: { gridTemplateColumns: "repeat(3, 1fr)" } },
            }}
          >
            {transactions.map((transaction) => (
              <Stack key={transaction.id}>{transaction.id}</Stack>
            ))}
          </Stack>
        ) : (
          <Empty />
        )}
      </VStack>
    </VStack>
  );
};
