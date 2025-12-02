import { Table, TableProps } from "antd";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { routeTree } from "@/utils/routes";

export const BillingPage = () => {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const colors = useTheme();

  const columns: TableProps["columns"] = [
    {
      dataIndex: "date",
      key: "date",
      title: t("date"),
    },
    {
      align: "center",
      dataIndex: "type",
      key: "type",
      title: t("type"),
    },
    {
      align: "center",
      dataIndex: "amount",
      key: "amount",
      title: t("amount"),
    },
    {
      align: "center",
      dataIndex: "status",
      key: "status",
      title: t("status"),
    },
  ];

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
          {t("goBack")}
        </HStack>
        <Stack
          as="span"
          $style={{ fontSize: "22px", gap: "8px", lineHeight: "24px" }}
        >
          {t("billing")}
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
  );
};
