import { Table, TableProps } from "antd";
import { useTheme } from "styled-components";

import { SEO } from "@/components/SEO";
import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { routeTree } from "@/utils/routes";

export const TransactionsPage = () => {
  const goBack = useGoBack();
  const colors = useTheme();

  const columns: TableProps["columns"] = [
    {
      dataIndex: "date",
      key: "date",
      title: "Date",
    },
    {
      align: "center",
      dataIndex: "appName",
      key: "appName",
      title: "App Name",
    },
    {
      align: "center",
      dataIndex: "type",
      key: "type",
      title: "Type",
    },
    {
      align: "center",
      dataIndex: "amount",
      key: "amount",
      title: "Amount",
    },
    {
      align: "center",
      dataIndex: "status",
      key: "status",
      title: "Status",
    },
  ];

  return (
    <>
      <SEO
        title="Transaction History"
        description="View your transaction history for all Vultisig app activities, including automated swaps, sends, and other app operations."
        url={routeTree.transactions.path}
        noindex={true}
      />

      <VStack
        $style={{ alignItems: "center", flexGrow: "1", padding: "24px 0" }}
      >
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
            dataSource={[]}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </VStack>
      </VStack>
    </>
  );
};
