import { Empty } from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Divider } from "@/components/Divider";
import { InputSearch } from "@/components/InputSearch";
import { Spin } from "@/components/Spin";
import { Stack } from "@/components/Stack";
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
  const { filters, setFilters } = useFilterParams<TransactionFilters>();

  const fetchTransactions = useCallback(
    (skip: number, filters: TransactionFilters) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getTransactions(skip, filters)
        .then(({ transactions }) => {
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
    []
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
    <Stack
      $style={{
        flexDirection: "column",
        gap: "48px",
        maxWidth: "1200px",
        padding: "16px",
        width: "100%",
      }}
    >
      <Stack
        $style={{
          backgroundImage: "url(/images/banner.jpg)",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          borderRadius: "16px",
          height: "336px",
        }}
      />

      <Stack $style={{ flexDirection: "column", flexGrow: "1", gap: "32px" }}>
        <Stack $style={{ flexDirection: "column", gap: "24px" }}>
          <Stack
            as="span"
            $style={{
              fontSize: "40px",
              fontWeight: "500",
              lineHeight: "42px",
            }}
          >
            Discover Apps
          </Stack>
          <Divider />
          <Stack $style={{ flexDirection: "row", gap: "12px" }}>
            <InputSearch
              value={filters.term}
              onChange={({ target }) =>
                setFilters({ ...filters, term: target.value })
              }
            />
          </Stack>
        </Stack>

        {loading ? (
          <Spin />
        ) : transactions.length ? (
          <Stack $style={{ flexDirection: "column", gap: "16px" }}>
            <Stack
              as="span"
              $style={{
                fontSize: "17px",
                fontWeight: "500",
                lineHeight: "20px",
              }}
            >
              Transaction History
            </Stack>
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
          </Stack>
        ) : (
          <Empty />
        )}
      </Stack>
    </Stack>
  );
};
