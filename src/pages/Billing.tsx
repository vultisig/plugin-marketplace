import { Empty, Table, TableProps } from "antd";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { useAntd } from "@/hooks/useAntd";
import { TrashIcon } from "@/icons/TrashIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getApp, getMyApps, uninstallApp } from "@/utils/api";
import { feeAppId } from "@/utils/constants";
import { snakeCaseToTitle } from "@/utils/functions";
import { App } from "@/utils/types";

type StateProps = {
  app?: App;
  apps: App[];
  loading: boolean;
};

export const BillingPage = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({ loading: true, apps: [] });
  const { app, apps, loading } = state;
  const { messageAPI, modalAPI } = useAntd();
  const colors = useTheme();

  const columns: TableProps<App>["columns"] = [
    {
      dataIndex: "title",
      key: "title",
      title: t("appName"),
    },
    {
      align: "center",
      dataIndex: "feeType",
      key: "feeType",
      title: t("feeType"),
    },
    {
      align: "center",
      dataIndex: "startDate",
      key: "startDate",
      title: t("startDate"),
    },
    {
      align: "center",
      dataIndex: "nextPayment",
      key: "nextPayment",
      title: t("nextPayment"),
    },
    {
      align: "center",
      dataIndex: "totalFees",
      key: "totalFees",
      title: t("totalFees"),
    },
    {
      align: "center",
      key: "action",
      render: () => (
        <HStack $style={{ justifyContent: "center" }}>
          <Button icon={<TrashIcon fontSize={16} />} kind="danger" ghost />
        </HStack>
      ),
      title: t("Action"),
      width: 80,
    },
  ];

  const handleUninstall = () => {
    if (!app) return;

    modalAPI.confirm({
      title: t("confirmAppUninstallation"),
      okText: t("yes"),
      okType: "danger",
      cancelText: t("no"),
      onOk() {
        setState((prevState) => ({ ...prevState, loading: true }));

        uninstallApp(app.id)
          .then(() => {
            setState((prevState) => ({ ...prevState, loading: false }));

            messageAPI.open({
              type: "success",
              content: t("successfulAppUninstallation"),
            });
          })
          .catch(() => {
            setState((prevState) => ({ ...prevState, loading: false }));

            messageAPI.open({
              type: "error",
              content: t("unsuccessfulAppUninstallation"),
            });
          });
      },
    });
  };

  useEffect(() => {
    Promise.all([getApp(feeAppId), getMyApps({})]).then(([app, { apps }]) => {
      setState((prevState) => ({ ...prevState, app, apps, loading: false }));
    });
  }, []);

  return app ? (
    <VStack $style={{ alignItems: "center", flexGrow: "1", padding: "48px 0" }}>
      <VStack
        $style={{
          gap: "24px",
          maxWidth: "1200px",
          padding: "0 16px",
          width: "100%",
        }}
      >
        <HStack
          $style={{
            alignItems: "center",
            backgroundColor: colors.bgTertiary.toHex(),
            borderRadius: "32px",
            padding: "8px",
          }}
        >
          <HStack
            $style={{
              backgroundColor: colors.bgPrimary.toHex(),
              borderColor: colors.borderNormal.toHex(),
              borderRadius: "24px",
              borderStyle: "solid",
              borderWidth: "1px",
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
                $style={{
                  borderRadius: "12px",
                  height: "48px",
                  width: "48px",
                }}
              />
              <Stack as="span" $style={{ fontSize: "17px" }}>
                {app.title}
              </Stack>
            </HStack>
            <Button onClick={handleUninstall}>{t("uninstall")}</Button>
          </HStack>
          <HStack $style={{ justifyContent: "center" }}>
            {[
              { lable: t("createdBy"), value: "Vultisig" },
              {
                lable: t("category"),
                value: snakeCaseToTitle(app.categoryId),
              },
              {
                lable: t("installedOn"),
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
          {t("billing")}
        </Stack>
        {loading ? (
          <Spin />
        ) : apps.length > 0 ? (
          <Table
            columns={columns}
            dataSource={apps}
            loading={loading}
            pagination={false}
            rowKey="id"
            size="small"
          />
        ) : (
          <Empty />
        )}
      </VStack>
    </VStack>
  ) : (
    <></>
  );
};
