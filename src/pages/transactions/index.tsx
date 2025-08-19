import { Empty, Table, TableProps } from "antd";
import dayjs from "dayjs";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

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

  const columns: TableProps<Transaction>["columns"] = [
    {
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => dayjs(value).format("MMM D, YYYY"),
      title: "Date",
      width: 120,
    },
    {
      dataIndex: "pluginId",
      key: "pluginId",
      render: (value) => (
        <HStack $style={{ alignItems: "center", gap: "12px" }}>
          <Stack
            as="img"
            alt={value}
            src={`/plugins/payroll.png`}
            $style={{ height: "40px", width: "40px" }}
          />
          {value}
        </HStack>
      ),
      title: "App Name",
    },
    {
      align: "center",
      dataIndex: "status",
      key: "status",
      title: "Status",
    },
    {
      align: "center",
      dataIndex: "txHash",
      key: "txHash",
      title: "TxHash",
    },
  ];

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
        padding: "48px 16px",
        width: "100%",
      }}
    >
      <VStack $style={{ flexGrow: "1", gap: "24px" }}>
        <Stack
          as="span"
          $style={{ fontSize: "22px", fontWeight: "500", lineHeight: "24px" }}
        >
          Transaction History
        </Stack>
        <HStack $style={{ gap: "12px" }}>
          <InputSearch
            value={filters.term}
            onChange={({ target }) =>
              setFilters({ ...filters, term: target.value })
            }
          />
        </HStack>
        {loading ? (
          <Spin />
        ) : transactions.length ? (
          <Table
            columns={columns}
            dataSource={transactions}
            loading={loading}
            rowKey="id"
            size="small"
          />
        ) : (
          <Empty />
        )}
      </VStack>
    </VStack>
  );
};
