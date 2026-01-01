import { Table, TableProps } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTheme } from "styled-components";

import { AutomationFormAmount } from "@/automations/components/Amount";
import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getMyApps, getTransactions } from "@/utils/api";
import { routeTree } from "@/utils/routes";
import { App, Transaction } from "@/utils/types";

type StateProps = {
  apps: App[];
  loading: boolean;
  transactions: Transaction[];
};

export const TransactionsPage = () => {
  const [state, setState] = useState<StateProps>({
    apps: [],
    loading: true,
    transactions: [],
  });
  const { apps, loading, transactions } = state;
  const goBack = useGoBack();
  const colors = useTheme();

  const columns: TableProps<Transaction>["columns"] = [
    {
      dataIndex: "createdAt",
      key: "createdAt",
      title: "Created At",
      render: (value) => dayjs(value).format("MMMM DD YYYY"),
    },
    {
      dataIndex: "pluginId",
      key: "pluginId",
      title: "App Name",
      render: (value, { appName }) => {
        const app = apps.find(({ id }) => id === value);

        if (!app) return appName;

        return (
          <HStack $style={{ alignItems: "center", gap: "8px" }}>
            <Stack
              as="img"
              alt={app.title}
              src={app.logoUrl}
              $style={{ borderRadius: "8px", height: "36px", width: "36px" }}
            />
            <Stack as="span">{app.title}</Stack>
          </HStack>
        );
      },
    },

    {
      align: "center",
      dataIndex: "amount",
      key: "amount",
      title: "Amount",
      render: (_, { amount, chain = "Ethereum", tokenId }) => {
        if (!amount) return "-";

        return (
          <AutomationFormAmount
            amount={amount}
            chain={chain}
            tokenId={tokenId}
          />
        );
      },
    },
    {
      align: "center",
      dataIndex: "status",
      key: "status",
      title: "Status",
      render: (value: Transaction["status"]) => {
        const completed = value === "SIGNED";

        return (
          <HStack $style={{ justifyContent: "center" }}>
            <Stack
              as="span"
              $style={{
                backgroundColor:
                  colors[completed ? "success" : "warning"].toRgba(0.1),
                borderRadius: "4px",
                color: colors[completed ? "success" : "warning"].toHex(),
                fontSize: "12px",
                lineHeight: "20px",
                padding: "0 8px",
              }}
            >
              {completed ? "Completed" : "Pending"}
            </Stack>
          </HStack>
        );
      },
    },
  ];

  useEffect(() => {
    Promise.all([getMyApps({}), getTransactions({})]).then(
      ([{ apps }, { transactions }]) => {
        setState((prevState) => ({
          ...prevState,
          loading: false,
          apps,
          transactions,
        }));
      }
    );
  }, []);

  return (
    <VStack $style={{ alignItems: "center", flexGrow: "1", padding: "24px 0" }}>
      <VStack
        $style={{
          gap: "24px",
          maxWidth: "1200px",
          padding: "0 16px",
          width: "100%",
        }}
      >
        <HStack
          as="span"
          $style={{
            alignItems: "center",
            border: `solid 1px ${colors.borderNormal.toHex()}`,
            borderRadius: "18px",
            cursor: "pointer",
            fontSize: "12px",
            gap: "4px",
            height: "36px",
            padding: "0 12px",
            width: "fit-content",
          }}
          $hover={{ color: colors.textTertiary.toHex() }}
          onClick={() => goBack(routeTree.root.path)}
        >
          <ChevronLeftIcon fontSize={16} />
          Go Back
        </HStack>
        <Stack
          as="span"
          $style={{ fontSize: "22px", gap: "8px", lineHeight: "24px" }}
        >
          Transaction History
        </Stack>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </VStack>
    </VStack>
  );
};
