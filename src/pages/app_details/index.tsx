import { message, Modal, Tooltip } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { PluginPolicyList } from "@/components/PluginPolicyList";
import { PluginReviewList } from "@/components/PluginReviewList";
import { Pricing } from "@/components/Pricing";
import { useApp } from "@/hooks/useApp";
import { useGoBack } from "@/hooks/useGoBack";
import { BadgeCheckIcon } from "@/icons/BadgeCheckIcon";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CircleArrowDownIcon } from "@/icons/CircleArrowDownIcon";
import { CircleInfoIcon } from "@/icons/CircleInfoIcon";
import { ShieldCheckIcon } from "@/icons/ShieldCheckIcon";
import { StarIcon } from "@/icons/StarIcon";
import { Button } from "@/toolkits/Button";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { routeTree } from "@/utils/constants/routes";
import { toNumeralFormat } from "@/utils/functions";
import { startReshareSession } from "@/utils/services/extension";
import {
  getApp,
  getRecipeSpecification,
  isAppInstalled,
  isPluginInstalled,
  uninstallApp,
} from "@/utils/services/marketplace";
import { App, CustomRecipeSchema } from "@/utils/types";

interface InitialState {
  isFeePluginInstalled?: boolean;
  isFree?: boolean;
  isInstalled?: boolean;
  loading?: boolean;
  plugin?: App;
  schema?: CustomRecipeSchema;
}

export const AppDetailsPage = () => {
  const initialState: InitialState = {};
  const [state, setState] = useState(initialState);
  const { isFeePluginInstalled, isFree, isInstalled, loading, plugin, schema } =
    state;
  const { id = "" } = useParams<{ id: string }>();
  const { connect, isConnected } = useApp();
  const [messageApi, messageHolder] = message.useMessage();
  const [modalAPI, modalHolder] = Modal.useModal();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const colors = useTheme();
  const timeoutRef = useRef<number | null>(null);

  const aboutFeePlugin = () => {
    modalAPI.confirm({
      title: "About Fee Plugin",
      content: (
        <VStack $style={{ gap: "8px" }}>
          <Stack as="span">
            Some plugins on our marketplace are not free to use.
          </Stack>
          <Stack as="span">
            They may include either a one-time installation fee or a recurring
            subscription fee. These fees are always shown clearly when you sign
            up and install a plugin.
          </Stack>
          <Stack as="span">
            The fee plugin runs securely in your wallet and enables us to
            collect fees directly, making payments seamless and automatic.
          </Stack>
        </VStack>
      ),
      cancelText: "Cancel",
      okText: "Install Fee Plugin",
      icon: <></>,
      onOk: () => {
        navigate(
          routeTree.appDetails.link(import.meta.env.VITE_FEE_PLUGIN_ID),
          { state: true }
        );
      },
    });
  };

  const checkStatus = useCallback(() => {
    isAppInstalled(id).then((isInstalled) => {
      if (isInstalled) {
        setState((prevState) => ({ ...prevState, isInstalled }));
      } else {
        timeoutRef.current = window.setTimeout(checkStatus, 1000);
      }
    });
  }, [id]);

  const handleUninstall = () => {
    modalAPI.confirm({
      title: "Are you sure uninstall this plugin?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        setState((prevState) => ({ ...prevState, loading: true }));

        uninstallApp(id)
          .then(() => {
            setState((prevState) => ({
              ...prevState,
              isInstalled: false,
              loading: false,
            }));

            messageApi.open({
              type: "success",
              content: "Plugin uninstalled successfully.",
            });
          })
          .catch(() => {
            setState((prevState) => ({ ...prevState, loading: false }));

            messageApi.open({
              type: "error",
              content: "Failed to uninstall plugin.",
            });
          });
      },
      onCancel() {},
    });
  };

  const handleInstall = () => {
    startReshareSession(id);
  };

  useEffect(() => {
    if (isInstalled === false) checkStatus();
  }, [checkStatus, isInstalled]);

  useEffect(() => {
    if (isInstalled) {
      getRecipeSpecification(id)
        .then((schema) => {
          setState((prevState) => ({ ...prevState, schema }));
        })
        .catch(() => {});
    }
  }, [id, isInstalled]);

  useEffect(() => {
    if (plugin) {
      const isFree = !plugin.pricing.length;

      if (isFree) {
        setState((prevState) => ({
          ...prevState,
          isFree,
          isFeePluginInstalled: false,
        }));
      } else {
        isPluginInstalled(import.meta.env.VITE_FEE_PLUGIN_ID).then(
          (isFeePluginInstalled) => {
            setState((prevState) => ({
              ...prevState,
              isFeePluginInstalled,
              isFree,
            }));
          }
        );
      }
    }
  }, [id, isConnected, plugin]);

  useEffect(() => {
    if (isConnected) {
      isAppInstalled(id).then((isInstalled) => {
        setState((prevState) => ({ ...prevState, isInstalled }));
      });
    } else {
      setState((prevState) => ({ ...prevState, isInstalled: undefined }));
    }
  }, [id, isConnected]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    getApp(id)
      .then((plugin) => {
        setState((prevState) => ({ ...prevState, plugin }));
      })
      .catch(() => {
        goBack(routeTree.apps.path);
      });

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [id, goBack]);

  return (
    <>
      {plugin ? (
        <VStack $style={{ alignItems: "center", flexGrow: "1" }}>
          <VStack
            $style={{
              gap: "32px",
              maxWidth: "1200px",
              padding: "0 16px",
              width: "100%",
            }}
            $media={{ xl: { $style: { flexDirection: "row" } } }}
          >
            <VStack
              $style={{ gap: "32px", paddingTop: "24px" }}
              $media={{
                xl: { $style: { flexGrow: "1", paddingBottom: "24px" } },
              }}
            >
              <VStack $style={{ gap: "24px" }}>
                <HStack
                  as="span"
                  $style={{
                    alignItems: "center",
                    border: `solid 1px ${colors.borderNormal.toHex()}`,
                    borderRadius: "18px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    gap: "4px",
                    height: "36px",
                    padding: "0 12px",
                    width: "fit-content",
                  }}
                  $hover={{ color: colors.textTertiary.toHex() }}
                  onClick={() => goBack(routeTree.apps.path)}
                >
                  <ChevronLeftIcon fontSize={16} />
                  Go back
                </HStack>
                <VStack
                  $style={{
                    backgroundColor: colors.bgTertiary.toHex(),
                    borderRadius: "32px",
                    padding: "16px",
                  }}
                >
                  <HStack
                    $style={{
                      backgroundColor: colors.bgPrimary.toHex(),
                      border: `solid 1px ${colors.borderNormal.toHex()}`,
                      borderRadius: "24px",
                      justifyContent: "space-between",
                      padding: "24px",
                    }}
                  >
                    <HStack $style={{ alignItems: "center", gap: "16px" }}>
                      <Stack
                        as="img"
                        alt={plugin.title}
                        src={`/plugins/payroll.png`}
                        $style={{ height: "72px", width: "72px" }}
                      />
                      <VStack $style={{ gap: "8px", justifyContent: "center" }}>
                        <Stack
                          as="span"
                          $style={{
                            fontSize: "22px",
                            fontWeight: "500",
                            lineHeight: "24px",
                          }}
                        >
                          {plugin.title}
                        </Stack>
                        <HStack $style={{ alignItems: "center", gap: "8px" }}>
                          <HStack $style={{ alignItems: "center", gap: "2px" }}>
                            <Stack
                              as={CircleArrowDownIcon}
                              $style={{
                                color: colors.textTertiary.toHex(),
                                fontSize: "16px",
                              }}
                            />
                            <Stack
                              as="span"
                              $style={{
                                color: colors.textTertiary.toHex(),
                                fontWeight: "500",
                                lineHeight: "20px",
                              }}
                            >
                              {toNumeralFormat(1258)}
                            </Stack>
                          </HStack>
                          <Stack
                            $style={{
                              backgroundColor: colors.borderLight.toHex(),
                              height: "3px",
                              width: "3px",
                            }}
                          />
                          <HStack $style={{ alignItems: "center", gap: "2px" }}>
                            <Stack
                              as={StarIcon}
                              $style={{
                                color: colors.warning.toHex(),
                                fill: colors.warning.toHex(),
                                fontSize: "16px",
                              }}
                            />
                            <Stack
                              as="span"
                              $style={{
                                color: colors.textTertiary.toHex(),
                                fontWeight: "500",
                                lineHeight: "20px",
                              }}
                            >
                              {plugin.rating.count
                                ? `${plugin.rating.rate}/5 (${plugin.rating.count})`
                                : "No Rating yet"}
                            </Stack>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>
                    <VStack $style={{ gap: "16px" }}>
                      {isConnected ? (
                        isInstalled === undefined ||
                        isFeePluginInstalled === undefined ? (
                          <Button kind="primary" disabled loading>
                            Checking
                          </Button>
                        ) : !isFree && !isFeePluginInstalled ? (
                          <Tooltip
                            title={
                              <>
                                <Stack as="span">
                                  This plugin is not free. Before you can use
                                  it, you’ll need to install the fee plugin
                                </Stack>{" "}
                                <Stack
                                  as="span"
                                  onClick={aboutFeePlugin}
                                  $style={{
                                    color: colors.info.toHex(),
                                    cursor: "pointer",
                                  }}
                                >
                                  Learn more
                                </Stack>
                              </>
                            }
                          >
                            <Button
                              kind="primary"
                              loading={loading}
                              onClick={() =>
                                navigate(
                                  routeTree.appDetails.link(
                                    import.meta.env.VITE_FEE_PLUGIN_ID
                                  ),
                                  { state: true }
                                )
                              }
                            >
                              Install Fee Plugin
                            </Button>
                          </Tooltip>
                        ) : isInstalled ? (
                          <>
                            <Button
                              disabled={loading || !schema}
                              kind="primary"
                              onClick={() =>
                                navigate(routeTree.appPolicy.link(id), {
                                  state: true,
                                })
                              }
                            >
                              Add policy
                            </Button>
                            <Button
                              loading={loading}
                              onClick={handleUninstall}
                              status="danger"
                            >
                              Uninstall
                            </Button>
                          </>
                        ) : (
                          <Button
                            kind="primary"
                            loading={loading}
                            onClick={handleInstall}
                          >
                            Install
                          </Button>
                        )
                      ) : (
                        <Button kind="primary" onClick={connect}>
                          Connect
                        </Button>
                      )}
                      <Pricing pricing={plugin.pricing} center />
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>

              <HStack
                $style={{
                  backgroundColor: colors.bgPrimary.toHex(),
                  borderBottom: `solid 1px ${colors.borderLight.toHex()}`,
                  position: "sticky",
                  top: "72px",
                  zIndex: "2",
                }}
              >
                {[
                  { key: "1", label: "Overview" },
                  { key: "2", label: "Reviews and Ratings" },
                ].map(({ key, label }) => (
                  <HStack
                    as="span"
                    key={key}
                    $style={{
                      alignItems: "center",
                      borderBottom: `solid 2px ${
                        key === "1" ? colors.accentFour.toHex() : "transparent"
                      }`,
                      color: colors.textPrimary.toHex(),
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      height: "52px",
                      padding: "0 16px",
                      whiteSpace: "nowrap",
                    }}
                    $hover={{
                      color: colors.accentFour.toHex(),
                    }}
                  >
                    {label}
                  </HStack>
                ))}
              </HStack>
              <Stack as="span">
                Set and forget payroll for your team. Automate recurring team
                payments with confidence. This plugin makes it easy to set,
                schedule, and manage payroll so you can focus on building while
                your contributors get paid on time.
              </Stack>
              <PluginPolicyList plugin={plugin} />
              <PluginReviewList
                isInstalled={isInstalled}
                onInstall={handleInstall}
                plugin={plugin}
              />
            </VStack>
            <Stack
              as="span"
              $style={{
                backgroundColor: colors.borderLight.toHex(),
                height: "1px",
              }}
              $media={{ xl: { $style: { height: "auto", width: "1px" } } }}
            />
            <VStack
              $style={{ paddingBottom: "24px" }}
              $media={{
                xl: {
                  $style: {
                    flex: "none",
                    paddingTop: "84px",
                    width: "322px",
                  },
                },
              }}
            >
              <VStack
                $style={{ gap: "20px" }}
                $media={{ xl: { $style: { position: "sticky", top: "96px" } } }}
              >
                <VStack
                  $style={{
                    border: `solid 1px ${colors.borderNormal.toHex()}`,
                    borderRadius: "24px",
                    gap: "12px",
                    padding: "32px",
                  }}
                >
                  <Stack
                    as="span"
                    $style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      lineHeight: "24px",
                    }}
                  >
                    App Permissions
                  </Stack>
                  {[
                    "Access to transaction signing",
                    "Fee deduction authorization",
                    "Vault balance visibility",
                  ].map((item, index) => (
                    <HStack key={index} $style={{ gap: "8px" }}>
                      <Stack
                        as={ShieldCheckIcon}
                        $style={{
                          color: colors.warning.toHex(),
                          flex: "none",
                          fontSize: "16px",
                        }}
                      />
                      <Stack
                        as="span"
                        $style={{
                          color: colors.textSecondary.toHex(),
                          fontWeight: "500",
                          lineHeight: "16px",
                        }}
                      >
                        {item}
                      </Stack>
                      <Tooltip title="Required to securely approve and route plugin payment transactions through your vault.">
                        <CircleInfoIcon />
                      </Tooltip>
                    </HStack>
                  ))}
                </VStack>
                <VStack
                  $style={{
                    border: `solid 1px ${colors.borderNormal.toHex()}`,
                    borderRadius: "24px",
                    gap: "12px",
                    padding: "32px",
                  }}
                >
                  <Stack
                    as="span"
                    $style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      lineHeight: "24px",
                    }}
                  >
                    Audit
                  </Stack>
                  {["Fully audited, check the certificate"].map(
                    (item, index) => (
                      <HStack key={index} $style={{ gap: "8px" }}>
                        <Stack
                          as={BadgeCheckIcon}
                          $style={{
                            color: colors.success.toHex(),
                            flex: "none",
                            fontSize: "16px",
                          }}
                        />
                        <Stack
                          as="span"
                          $style={{
                            color: colors.textSecondary.toHex(),
                            fontWeight: "500",
                            lineHeight: "16px",
                          }}
                        >
                          {item}
                        </Stack>
                      </HStack>
                    )
                  )}
                </VStack>
              </VStack>
            </VStack>
          </VStack>
        </VStack>
      ) : (
        <Spin centered />
      )}

      {messageHolder}
      {modalHolder}
    </>
  );
};
