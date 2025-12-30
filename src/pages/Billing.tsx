import { Table, TableProps } from "antd";
import dayjs from "dayjs";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "styled-components";

import { SEO } from "@/components/SEO";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants";
import { routeTree } from "@/utils/routes";

export const BillingPage = () => {
  const { feeApp, feeAppStatus } = useCore();
  const goBack = useGoBack();
  const navigate = useNavigate();
  const colors = useTheme();

  const columns: TableProps["columns"] = [
    {
      dataIndex: "date",
      key: "date",
      title: "Date",
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

  if (!feeApp || !feeAppStatus) return <Spin centered />;

  return (
    <>
      <SEO
        title="Billing - Payment & Subscription Management"
        description="Manage your Vultisig app subscriptions, view payment history, and handle billing for your installed applications."
        url={routeTree.billing.path}
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
            Go back
          </HStack>
          <HStack
            $style={{
              alignItems: "center",
              backgroundColor: colors.bgTertiary.toHex(),
              borderRadius: "32px",
              gap: "16px",
              padding: "16px",
            }}
          >
            <HStack
              $style={{
                alignItems: "center",
                backgroundColor: colors.bgPrimary.toHex(),
                border: `solid 1px ${colors.borderNormal.toHex()}`,
                borderRadius: "24px",
                flexGrow: "1",
                gap: "16px",
                justifyContent: "space-between",
                padding: "24px",
              }}
            >
              <HStack $style={{ alignItems: "center", gap: "16px" }}>
                <Stack
                  as="img"
                  alt={feeApp.title}
                  src={feeApp.logoUrl}
                  $style={{
                    borderRadius: "12px",
                    height: "48px",
                    width: "48px",
                  }}
                />
                <Stack as="span" $style={{ fontSize: "18px" }}>
                  {feeApp.title}
                </Stack>
              </HStack>
              {feeAppStatus.isInstalled === undefined ? (
                <Button disabled loading>
                  Checking
                </Button>
              ) : (
                !feeAppStatus.isInstalled && (
                  <Button onClick={() => navigate(modalHash.payment)}>
                    Get
                    <Stack
                      as="span"
                      $style={{
                        backgroundColor: colors.textPrimary.toHex(),
                        borderRadius: "50%",
                        height: "2px",
                        width: "2px",
                      }}
                    />
                    Free
                  </Button>
                )
              )}
            </HStack>
            <HStack $style={{ justifyContent: "center" }}>
              {[
                { label: "Created by", value: "Vultisig" },
                { label: "Version", value: "2.1.0" },
                {
                  label: "Installed on",
                  value: dayjs(feeApp.updatedAt).format("YYYY-MM-DD"),
                },
              ].map(({ label, value }, index) => (
                <Fragment key={index}>
                  {index > 0 && <Divider vertical />}
                  <VStack
                    $style={{
                      alignItems: "center",
                      gap: "12px",
                      padding: "0 40px",
                    }}
                  >
                    <Stack
                      as="span"
                      $style={{
                        color: colors.textTertiary.toHex(),
                        fontSize: "13px",
                      }}
                    >
                      {label}
                    </Stack>
                    <Stack
                      as="span"
                      $style={{
                        backgroundColor: colors.accentFour.toRgba(0.1),
                        borderRadius: "4px",
                        color: colors.accentFour.toHex(),
                        fontSize: "12px",
                        lineHeight: "20px",
                        padding: "0 8px",
                      }}
                    >
                      {value}
                    </Stack>
                  </VStack>
                </Fragment>
              ))}
            </HStack>
          </HStack>
          <Divider light />
          <Stack
            as="span"
            $style={{ fontSize: "22px", gap: "8px", lineHeight: "24px" }}
          >
            Billing
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
