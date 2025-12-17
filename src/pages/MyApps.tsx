import { Dropdown, Empty } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "styled-components";

import { useAntd } from "@/hooks/useAntd";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { DotGridVerticalIcon } from "@/icons/DotGridVerticalIcon";
import { TrashIcon } from "@/icons/TrashIcon";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getMyApps, uninstallApp } from "@/utils/api";
import { modalHash } from "@/utils/constants";
import { routeTree } from "@/utils/routes";
import { App } from "@/utils/types";

type StateProps = {
  loading: boolean;
  apps: App[];
};

export const MyAppsPage = () => {
  const [state, setState] = useState<StateProps>({ loading: true, apps: [] });
  const { loading, apps } = state;
  const { messageAPI, modalAPI } = useAntd();
  const colors = useTheme();

  const handleUninstall = (app: App) => {
    modalAPI.confirm({
      title: "Are you sure you want to uninstall this app?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        setState((prevState) => ({ ...prevState, loading: true }));

        uninstallApp(app.id)
          .then(() => {
            setState((prevState) => ({
              ...prevState,
              apps: prevState.apps.filter((a) => a.id !== app.id),
              loading: false,
            }));

            messageAPI.open({
              type: "success",
              content: "App successfully uninstalled",
            });
          })
          .catch(() => {
            setState((prevState) => ({ ...prevState, loading: false }));

            messageAPI.open({
              type: "error",
              content: "App uninstallation failed",
            });
          });
      },
    });
  };

  useEffect(() => {
    getMyApps({})
      .then(({ apps }) => {
        setState((prevState) => ({ ...prevState, loading: false, apps }));
      })
      .catch(() => {
        setState((prevState) => ({ ...prevState, loading: false }));
      });
  }, []);

  return (
    <VStack $style={{ alignItems: "center", flexGrow: "1", padding: "48px 0" }}>
      <VStack
        $style={{
          gap: "32px",
          maxWidth: "768px",
          padding: "0 16px",
          width: "100%",
        }}
      >
        <HStack
          as="span"
          $style={{ fontSize: "22px", gap: "8px", lineHeight: "24px" }}
        >
          <Stack as="span">Installed Apps</Stack>
          <Stack
            as="span"
            $style={{ color: colors.textTertiary.toHex() }}
          >{`(${apps.length})`}</Stack>
        </HStack>
        {loading ? (
          <Spin />
        ) : !apps.length ? (
          <Empty />
        ) : (
          <VStack $style={{ gap: "16px" }}>
            {apps.map((app) => (
              <HStack
                key={app.id}
                $style={{
                  alignItems: "center",
                  border: `1px solid ${colors.borderLight.toHex()}`,
                  borderRadius: "24px",
                  gap: "16px",
                  justifyContent: "space-between",
                  padding: "16px",
                }}
              >
                <HStack $style={{ alignItems: "center", gap: "16px" }}>
                  <Stack as={Link} to={routeTree.app.link(app.id)}>
                    <Stack
                      as="img"
                      alt={app.title}
                      src={app.logoUrl}
                      $style={{
                        borderRadius: "12px",
                        display: "block",
                        height: "56px",
                        width: "56px",
                      }}
                    />
                  </Stack>
                  <VStack
                    $style={{
                      alignItems: "flex-start",
                      gap: "4px",
                      justifyContent: "center",
                    }}
                  >
                    <Stack
                      as={Link}
                      to={routeTree.app.link(app.id)}
                      $style={{ fontSize: "17px", lineHeight: "20px" }}
                    >
                      {app.title}
                    </Stack>
                    <Stack
                      as="span"
                      $style={{
                        color: colors.textTertiary.toHex(),
                        lineHeight: "20px",
                      }}
                    >
                      {app.description}
                    </Stack>
                  </VStack>
                </HStack>
                <Dropdown
                  menu={{
                    items: [
                      {
                        icon: <CirclePlusIcon />,
                        key: "1",
                        label: (
                          <Link
                            to={`${routeTree.automations.link(app.id)}${
                              modalHash.policy
                            }`}
                          >
                            Add Automation
                          </Link>
                        ),
                      },
                      {
                        danger: true,
                        icon: <TrashIcon />,
                        key: "2",
                        label: "Uninstall",
                        onClick: () => {
                          handleUninstall(app);
                        },
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <VStack
                    $style={{
                      backgroundColor: colors.bgSecondary.toHex(),
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "16px",
                      padding: "12px",
                    }}
                  >
                    <DotGridVerticalIcon />
                  </VStack>
                </Dropdown>
              </HStack>
            ))}
          </VStack>
        )}
        <VStack $style={{ alignItems: "center" }}>
          <Stack
            as={Link}
            to={routeTree.root.path}
            $style={{
              borderColor: colors.accentFour.toHex(),
              borderStyle: "solid",
              borderWidth: "1px",
              borderRadius: "24px",
              lineHeight: "46px",
              padding: "0 24px",
            }}
            $hover={{ color: colors.accentFour.toHex() }}
          >
            Discover more apps
          </Stack>
        </VStack>
      </VStack>
    </VStack>
  );
};
