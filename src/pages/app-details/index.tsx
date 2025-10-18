import { Anchor, Collapse, Tooltip } from "antd";
import dayjs from "dayjs";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { AppPolicies } from "@/components/AppPolicies";
import { AppReviews } from "@/components/AppReviews";
import { PaymentModal } from "@/components/PaymentModal";
import { useApp } from "@/hooks/useApp";
import { useGoBack } from "@/hooks/useGoBack";
import { BadgeCheckIcon } from "@/icons/BadgeCheckIcon";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CircleArrowDownIcon } from "@/icons/CircleArrowDownIcon";
import { CircleCheckIcon } from "@/icons/CircleCheckIcon";
import { CircleInfoIcon } from "@/icons/CircleInfoIcon";
import { ShieldCheckIcon } from "@/icons/ShieldCheckIcon";
import { StarIcon } from "@/icons/StarIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants/core";
import { routeTree } from "@/utils/constants/routes";
import {
  pricingText,
  snakeCaseToTitle,
  toNumeralFormat,
} from "@/utils/functions";
import { startReshareSession } from "@/utils/services/extension";
import {
  getApp,
  getRecipeSpecification,
  isAppInstalled,
  uninstallApp,
} from "@/utils/services/marketplace";
import { App, CustomRecipeSchema } from "@/utils/types";

interface InitialState {
  app?: App;
  isFeeApp?: boolean;
  isFeeAppInstalled?: boolean;
  isFree?: boolean;
  isInstalled?: boolean;
  loading?: boolean;
  schema?: CustomRecipeSchema;
}

export const AppDetailsPage = () => {
  const [state, setState] = useState<InitialState>({});
  const {
    app,
    isFeeApp,
    isFeeAppInstalled,
    isFree,
    isInstalled,
    loading,
    schema,
  } = state;
  const { connect, isConnected, messageAPI, modalAPI } = useApp();
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const colors = useTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const faqs = [
    {
      answer:
        "Maecenas in porttitor consequat aenean. In nulla cursus pulvinar at lacus ultricies et nulla. Non porta arcu vehicula rhoncus. Habitant integer lectus elit proin. Etiam morbi nunc pretium vestibulum sed convallis etiam. Pulvinar vitae porttitor elementum eget mattis sagittis facilisi magna. Et pulvinar pretium vitae odio non ultricies maecenas id. Non nibh scelerisque in facilisis tincidunt viverra fermentum sem. Quam varius pretium vitae neque. Senectus lectus ultricies nibh eget.",
      question: "How does it work?",
    },
    {
      answer:
        "Maecenas in porttitor consequat aenean. In nulla cursus pulvinar at lacus ultricies et nulla. Non porta arcu vehicula rhoncus. Habitant integer lectus elit proin. Etiam morbi nunc pretium vestibulum sed convallis etiam. Pulvinar vitae porttitor elementum eget mattis sagittis facilisi magna. Et pulvinar pretium vitae odio non ultricies maecenas id. Non nibh scelerisque in facilisis tincidunt viverra fermentum sem. Quam varius pretium vitae neque. Senectus lectus ultricies nibh eget.",
      question: "How to install?",
    },
    {
      answer:
        "Maecenas in porttitor consequat aenean. In nulla cursus pulvinar at lacus ultricies et nulla. Non porta arcu vehicula rhoncus. Habitant integer lectus elit proin. Etiam morbi nunc pretium vestibulum sed convallis etiam. Pulvinar vitae porttitor elementum eget mattis sagittis facilisi magna. Et pulvinar pretium vitae odio non ultricies maecenas id. Non nibh scelerisque in facilisis tincidunt viverra fermentum sem. Quam varius pretium vitae neque. Senectus lectus ultricies nibh eget.",
      question: "Is it safe? I don’t want to risk my funds.",
    },
    {
      answer:
        "Maecenas in porttitor consequat aenean. In nulla cursus pulvinar at lacus ultricies et nulla. Non porta arcu vehicula rhoncus. Habitant integer lectus elit proin. Etiam morbi nunc pretium vestibulum sed convallis etiam. Pulvinar vitae porttitor elementum eget mattis sagittis facilisi magna. Et pulvinar pretium vitae odio non ultricies maecenas id. Non nibh scelerisque in facilisis tincidunt viverra fermentum sem. Quam varius pretium vitae neque. Senectus lectus ultricies nibh eget.",
      question: "Are apps audited?",
    },
  ];

  const informations = [
    {
      label: "Fee Structure",
      value: (
        <>
          {app?.pricing.length
            ? app.pricing.map((price, index) => (
                <Stack as="span" key={index}>
                  {pricingText(price)}
                </Stack>
              ))
            : "This plugin is free"}
        </>
      ),
    },
    { label: "Downloads", value: "1,294" },
    { label: "Support", value: "24/7" },
  ];

  const checkStatus = useCallback(() => {
    if (!app) return;

    if (isFree || isFeeAppInstalled) {
      isAppInstalled(app.id).then((isInstalled) => {
        setState((prevState) => ({ ...prevState, isInstalled }));

        if (isInstalled) {
          if (!isFeeApp) {
            getRecipeSpecification(app.id).then((schema) => {
              setState((prevState) => ({ ...prevState, schema }));
            });
          }
        } else {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(checkStatus, 1000);
        }
      });
    } else {
      isAppInstalled(import.meta.env.VITE_FEE_PLUGIN_ID).then(
        (isFeeAppInstalled) => {
          setState((prevState) => ({
            ...prevState,
            isFeeAppInstalled,
            isInstalled: false,
          }));

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(checkStatus, 1000);
        }
      );
    }
  }, [app, isFeeApp, isFeeAppInstalled, isFree]);

  const handleInstall = () => {
    startReshareSession(id);
  };

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

            messageAPI.open({
              type: "success",
              content: "Plugin uninstalled successfully.",
            });
          })
          .catch(() => {
            setState((prevState) => ({ ...prevState, loading: false }));

            messageAPI.open({
              type: "error",
              content: "Failed to uninstall app.",
            });
          });
      },
      onCancel() {},
    });
  };

  useEffect(() => {
    if (isConnected) {
      checkStatus();
    } else {
      setState((prevState) => ({
        ...prevState,
        isInstalled: undefined,
        isFeeAppInstalled: undefined,
      }));
    }
  }, [checkStatus, isConnected]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    getApp(id)
      .then((app) => {
        const isFeeApp = app.id === import.meta.env.VITE_FEE_PLUGIN_ID;
        const isFree = !app.pricing.length || isFeeApp;

        if (isFree) {
          setState((prevState) => ({
            ...prevState,
            app,
            isFeeApp,
            isFree,
            isFeeAppInstalled: true,
          }));
        } else {
          isAppInstalled(import.meta.env.VITE_FEE_PLUGIN_ID).then(
            (isFeeAppInstalled) => {
              setState((prevState) => ({
                ...prevState,
                app,
                isFeeApp,
                isFree,
                isFeeAppInstalled,
              }));
            }
          );
        }
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

  return app ? (
    <>
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
                  gap: "16px",
                  padding: "16px",
                }}
              >
                <VStack
                  $style={{
                    backgroundColor: colors.bgPrimary.toHex(),
                    border: `solid 1px ${colors.borderNormal.toHex()}`,
                    borderRadius: "24px",
                    gap: "16px",
                    padding: "24px",
                  }}
                >
                  <HStack
                    $style={{
                      alignItems: "center",
                      gap: "16px",
                      justifyContent: "space-between",
                    }}
                  >
                    <HStack $style={{ alignItems: "center", gap: "16px" }}>
                      <Stack
                        as="img"
                        alt={app.title}
                        src="/media/payroll.png"
                        $style={{ height: "72px", width: "72px" }}
                      />
                      <VStack $style={{ gap: "8px", justifyContent: "center" }}>
                        <Stack
                          as="span"
                          $style={{ fontSize: "22px", lineHeight: "24px" }}
                        >
                          {app.title}
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
                                lineHeight: "20px",
                              }}
                            >
                              {app.rating.count
                                ? `${app.rating.rate}/5 (${app.rating.count})`
                                : "No Rating yet"}
                            </Stack>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>
                    <VStack $style={{ gap: "8px" }}>
                      {isConnected ? (
                        isInstalled === undefined ||
                        isFeeAppInstalled === undefined ? (
                          <Button disabled loading>
                            Checking
                          </Button>
                        ) : !isFree && !isFeeAppInstalled ? (
                          <Button
                            loading={loading}
                            onClick={() =>
                              navigate(modalHash.payment, { state: true })
                            }
                          >
                            Install
                          </Button>
                        ) : isInstalled ? (
                          <>
                            {!isFeeApp && (
                              <Button
                                disabled={loading || !schema}
                                href={modalHash.policy}
                              >
                                Add policy
                              </Button>
                            )}
                            <Button
                              loading={loading}
                              onClick={handleUninstall}
                              kind="danger"
                            >
                              Uninstall
                            </Button>
                          </>
                        ) : (
                          <Button loading={loading} onClick={handleInstall}>
                            Install
                          </Button>
                        )
                      ) : (
                        <Button onClick={connect}>Connect</Button>
                      )}
                    </VStack>
                  </HStack>
                  <VStack
                    as="span"
                    $style={{
                      alignItems: "center",
                      color: colors.textSecondary.toHex(),
                      flexGrow: "1",
                    }}
                  >
                    {app.pricing.length ? (
                      app.pricing.map((price, index) => (
                        <Stack as="span" key={index}>
                          {pricingText(price)}
                        </Stack>
                      ))
                    ) : (
                      <Stack as="span">This plugin is free</Stack>
                    )}
                  </VStack>
                </VStack>
                <HStack $style={{ justifyContent: "center", gap: "56px" }}>
                  {[
                    {
                      href: `${routeTree.apps.path}?categoryId=${app.categoryId}`,
                      lable: "Category",
                      value: snakeCaseToTitle(app.categoryId),
                    },
                    { lable: "Created By", value: "Vultisig" },
                    { lable: "Version", value: "2.1.0" },
                    {
                      lable: "Last Update",
                      value: dayjs(app.updatedAt).format("YYYY-MM-DD"),
                    },
                  ].map(({ href, lable, value }, index) => (
                    <Fragment key={index}>
                      {index > 0 && <Divider vertical />}
                      <VStack $style={{ alignItems: "center", gap: "12px" }}>
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
                          as={href ? Link : "span"}
                          $style={{
                            backgroundColor: colors.accentFour.toRgba(0.1),
                            borderRadius: "4px",
                            color: colors.accentFour.toHex(),
                            fontSize: "12px",
                            lineHeight: "20px",
                            padding: "0 8px",
                            ...(href ? { cursor: "pointer" } : {}),
                          }}
                          {...(href
                            ? {
                                to: href,
                                $hover: {
                                  backgroundColor:
                                    colors.accentFour.toRgba(0.2),
                                },
                              }
                            : {})}
                        >
                          {value}
                        </Stack>
                      </VStack>
                    </Fragment>
                  ))}
                </HStack>
              </VStack>
            </VStack>
            <Stack
              as={Anchor}
              direction="horizontal"
              items={[
                ...(isInstalled && !isFeeApp
                  ? [{ key: "#policies", label: "Policies" }]
                  : []),
                { key: "#overview", label: "Overview" },
                { key: "#features", label: "Features" },
                { key: "#faqs", label: "FAQs" },
                { key: "#informations", label: "Usage Info" },
                { key: "#reviews", label: "Reviews & Ratings" },
              ].map(({ key, label }) => ({
                key,
                href: key,
                title: (
                  <HStack
                    as="span"
                    $style={{
                      display: "block",
                      fontSize: "14px",
                      lineHeight: "52px",
                      padding: "0 16px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </HStack>
                ),
              }))}
              offsetTop={76}
              targetOffset={158}
              $style={{ backgroundColor: colors.bgPrimary.toHex() }}
            />
            {isInstalled && !isFeeApp && (
              <>
                <AppPolicies {...app} />
                <Divider light />
              </>
            )}
            <Stack id="overview">{app.description}</Stack>
            <Divider light />
            <VStack id="features" $style={{ gap: "24px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "18px", lineHeight: "28px" }}
              >
                Features
              </Stack>
              <VStack $style={{ gap: "8px" }}>
                {[
                  "Automated payroll processing",
                  "Direct deposit integration",
                  "Automated payroll processing",
                  "Employee self-service portal",
                  "Direct deposit integration",
                ].map((item, index) => (
                  <Fragment key={index}>
                    {index > 0 && <Divider light />}
                    <HStack $style={{ alignItems: "center", gap: "8px" }}>
                      <Stack
                        as={CircleCheckIcon}
                        $style={{
                          color: colors.success.toHex(),
                          fontSize: "24px",
                        }}
                      />
                      <Stack as="span" $style={{ fontSize: "14px" }}>
                        {item}
                      </Stack>
                    </HStack>
                  </Fragment>
                ))}
              </VStack>
            </VStack>
            <Divider light />
            <VStack id="faqs" $style={{ gap: "24px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "18px", lineHeight: "28px" }}
              >
                FAQs
              </Stack>
              <VStack $style={{ gap: "16px" }}>
                {faqs.map(({ answer, question }, index) => (
                  <Fragment key={index}>
                    {index > 0 && <Divider light />}
                    <Collapse
                      bordered={false}
                      items={[{ key: "1", label: question, children: answer }]}
                      expandIconPosition="end"
                      ghost
                    />
                  </Fragment>
                ))}
              </VStack>
            </VStack>
            <Divider light />
            <VStack id="informations" $style={{ gap: "24px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "18px", lineHeight: "28px" }}
              >
                Usage Info
              </Stack>
              <VStack $style={{ gap: "16px" }}>
                {informations.map(({ label, value }, index) => (
                  <HStack
                    key={index}
                    $style={{ justifyContent: "space-between" }}
                  >
                    <Stack
                      $style={{
                        color: colors.textTertiary.toHex(),
                        fontSize: "13px",
                        lineHeight: "18px",
                      }}
                    >
                      {label}
                    </Stack>
                    <VStack
                      $style={{
                        alignItems: "flex-end",
                        fontSize: "14px",
                        lineHeight: "18px",
                      }}
                    >
                      {value}
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
            <Divider light />
            <AppReviews {...app} />
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
              $media={{
                xl: { $style: { position: "sticky", top: "96px" } },
              }}
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
                  $style={{ fontSize: "16px", lineHeight: "24px" }}
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
                  $style={{ fontSize: "16px", lineHeight: "24px" }}
                >
                  Audit
                </Stack>
                {["Fully audited, check the certificate"].map((item, index) => (
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
                        lineHeight: "16px",
                      }}
                    >
                      {item}
                    </Stack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </VStack>
        </VStack>
      </VStack>
      {!isFeeApp && !isFeeAppInstalled && <PaymentModal />}
    </>
  ) : (
    <Spin centered />
  );
};
