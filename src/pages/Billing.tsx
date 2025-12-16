import { Table, TableProps } from "antd";
import dayjs from "dayjs";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useTheme } from "styled-components";

import { useAntd } from "@/hooks/useAntd";
import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getApp, isAppInstalled } from "@/utils/api";
import { feeAppId } from "@/utils/constants";
import { startReshareSession } from "@/utils/extension";
import { routeTree } from "@/utils/routes";
import { App } from "@/utils/types";

type StateProps = { app?: App; isInstalled?: boolean; loading?: boolean };

export const BillingPage = () => {
  const [state, setState] = useState<StateProps>({});
  const { app, isInstalled, loading } = state;
  const { messageAPI } = useAntd();
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

  const fetchApp = useCallback(async () => {
    try {
      const app = await getApp(feeAppId);
      const isInstalled = await isAppInstalled(feeAppId);

      setState((prevState) => ({ ...prevState, app, isInstalled }));
    } catch {
      goBack(routeTree.root.path);
    }
  }, [goBack]);

  const handleInstall = async () => {
    if (loading) return;

    setState((prevState) => ({ ...prevState, loading: true }));

    const isInstalled = await startReshareSession(feeAppId);

    setState((prevState) => ({ ...prevState, isInstalled, loading: false }));

    if (isInstalled) {
      messageAPI.open({
        type: "success",
        content: "App successfully installed",
      });
    } else {
      messageAPI.open({
        type: "error",
        content: "App installation failed",
      });
    }
  };

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);
  if (!app) return <Spin centered />;

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
                alt={app.title}
                src={app.logoUrl}
                $style={{ borderRadius: "12px", height: "48px", width: "48px" }}
              />
              <Stack as="span" $style={{ fontSize: "18px" }}>
                {app.title}
              </Stack>
            </HStack>
            {isInstalled === undefined ? (
              <Button disabled loading>
                Checking
              </Button>
            ) : (
              !isInstalled && (
                <Button loading={loading} onClick={handleInstall}>
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
              { lable: "Created by", value: "Vultisig" },
              { lable: "Version", value: "2.1.0" },
              {
                lable: "Installed on",
                value: dayjs(app.updatedAt).format("YYYY-MM-DD"),
              },
            ].map(({ lable, value }, index) => (
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
                    {lable}
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
  );
};
