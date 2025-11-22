import { Anchor, Collapse, Tooltip } from "antd";
import dayjs from "dayjs";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { AppPolicies } from "@/components/AppPolicies";
import { AppReviews } from "@/components/AppReviews";
import { PaymentModal } from "@/components/PaymentModal";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CircleArrowDownIcon } from "@/icons/CircleArrowDownIcon";
import { CircleCheckIcon } from "@/icons/CircleCheckIcon";
import { CircleInfoIcon } from "@/icons/CircleInfoIcon";
import { ShieldCheckIcon } from "@/icons/ShieldCheckIcon";
import { StarIcon } from "@/icons/StarIcon";
import { SubscriptionTickIcon } from "@/icons/SubscriptionTickIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import {
  getApp,
  getRecipeSpecification,
  isAppInstalled,
  uninstallApp,
} from "@/utils/api";
import { feeAppId, modalHash } from "@/utils/constants";
import { startReshareSession } from "@/utils/extension";
import {
  pricingText,
  snakeCaseToTitle,
  toNumberFormat,
} from "@/utils/functions";
import { routeTree } from "@/utils/routes";
import { App, RecipeSchema } from "@/utils/types";

type StateProps = {
  app?: App;
  isFeeApp?: boolean;
  isFeeAppInstalled?: boolean;
  isFree?: boolean;
  isInstalled?: boolean;
  isInstalling?: boolean;
  loading?: boolean;
  schema?: RecipeSchema;
};

export const AppPage = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({});
  const {
    app,
    isFeeApp,
    isFeeAppInstalled,
    isFree,
    isInstalled,
    isInstalling,
    loading,
    schema,
  } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { baseValue, connect, currency, isConnected } = useCore();
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
      label: t("feeStructure"),
      value: (
        <>
          {app?.pricing.length
            ? app.pricing.map(({ amount, frequency, type }, index) => (
                <Stack as="span" key={index}>
                  {pricingText({
                    amount,
                    baseValue,
                    currency,
                    frequency,
                    type,
                  })}
                </Stack>
              ))
            : t("isFreeApp")}
        </>
      ),
    },
    { label: t("downloads"), value: "1,294" },
    { label: t("support"), value: "24/7" },
  ];

  const checkStatus = useCallback(async () => {
    if (!app) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isFree || isFeeAppInstalled) {
      const appStatus = await isAppInstalled(app.id);

      setState((prevState) => ({ ...prevState, isInstalled: appStatus }));

      if (appStatus) {
        if (!isFeeApp) {
          const policySchema = await getRecipeSpecification(app.id);

          if (isInstalling && policySchema)
            navigate(modalHash.policy, { state: true });

          setState((prevState) => ({
            ...prevState,
            isInstalling: false,
            schema: policySchema,
          }));
        }
      } else {
        timeoutRef.current = setTimeout(checkStatus, 1000);
      }
    } else {
      const feeAppStatus = await isAppInstalled(feeAppId);

      setState((prevState) => ({
        ...prevState,
        isFeeAppInstalled: feeAppStatus,
      }));

      timeoutRef.current = setTimeout(checkStatus, 1000);
    }
  }, [app, isFeeApp, isFeeAppInstalled, isFree, isInstalling]);

  const fetchApp = useCallback(async () => {
    const app = await getApp(id);

    if (!app) {
      goBack(routeTree.root.path);
      return;
    }

    const isFeeApp = app.id === feeAppId;
    const isFree = !app.pricing.length || isFeeApp;

    if (isFree) {
      setState((prevState) => ({
        ...prevState,
        app,
        isFeeApp,
        isFree,
        isFeeAppInstalled: true,
      }));
    } else if (isConnected) {
      isAppInstalled(feeAppId).then((isFeeAppInstalled) => {
        setState((prevState) => ({
          ...prevState,
          app,
          isFeeApp,
          isFree,
          isFeeAppInstalled,
        }));
      });
    } else {
      setState((prevState) => ({ ...prevState, app, isFeeApp, isFree }));
    }
  }, [feeAppId, goBack, id, isConnected]);

  const handleInstall = () => {
    setState((prevState) => ({ ...prevState, isInstalling: true }));

    startReshareSession(id).catch(() => {
      setState((prevState) => ({ ...prevState, isInstalling: false }));
    });
  };

  const handleUninstall = () => {
    modalAPI.confirm({
      title: t("confirmAppUninstallation"),
      okText: t("yes"),
      okType: "danger",
      cancelText: t("no"),
      onOk() {
        setState((prevState) => ({ ...prevState, loading: true }));

        uninstallApp(id)
          .then(() => {
            setState((prevState) => ({
              ...prevState,
              isInstalled: false,
              loading: false,
            }));

            checkStatus();

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
    if (isConnected) {
      checkStatus();
    } else {
      setState((prevState) => ({
        ...prevState,
        isFeeAppInstalled: isFeeApp || isFree ? true : undefined,
        isInstalled: undefined,
        isInstalling: false,
      }));
    }
  }, [checkStatus, isConnected]);

  useEffect(() => {
    fetchApp();

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

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
                onClick={() => goBack(routeTree.root.path)}
              >
                <ChevronLeftIcon fontSize={16} />
                {t("goBack")}
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
                        src={app.logoUrl || "/media/payroll.png"}
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
                              {toNumberFormat(app.installations)}
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
                              {app.ratesCount
                                ? `${app.avgRating}/5 (${app.ratesCount})`
                                : t("noRating")}
                            </Stack>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>
                    <VStack
                      $style={{
                        alignItems: "center",
                        color: colors.textTertiary.toHex(),
                        gap: "12px",
                      }}
                    >
                      {isConnected ? (
                        isInstalled === undefined ||
                        isFeeAppInstalled === undefined ? (
                          <Button disabled loading>
                            {t("checking")}
                          </Button>
                        ) : !isFree && !isFeeAppInstalled ? (
                          <Button
                            loading={loading}
                            onClick={() =>
                              navigate(modalHash.payment, { state: true })
                            }
                          >
                            {t("install")}
                          </Button>
                        ) : isInstalled ? (
                          <>
                            {!isFeeApp && (
                              <Button
                                disabled={loading || !schema}
                                href={modalHash.policy}
                              >
                                {t("addAutomation")}
                              </Button>
                            )}
                            <Button
                              loading={loading}
                              onClick={handleUninstall}
                              kind="danger"
                              ghost
                            >
                              {t("uninstall")}
                            </Button>
                          </>
                        ) : (
                          <Button loading={loading} onClick={handleInstall}>
                            {t("install")}
                          </Button>
                        )
                      ) : (
                        <Button onClick={connect}>{t("connect")}</Button>
                      )}
                    </VStack>
                  </HStack>
                  {!isFeeApp && (
                    <VStack
                      as="span"
                      $style={{
                        alignItems: "center",
                        color: colors.textSecondary.toHex(),
                        flexGrow: "1",
                      }}
                    >
                      {app.pricing.length ? (
                        app.pricing.map(
                          ({ amount, frequency, type }, index) => (
                            <Stack as="span" key={index}>
                              {pricingText({
                                amount,
                                baseValue,
                                currency,
                                frequency,
                                type,
                              })}
                            </Stack>
                          )
                        )
                      ) : (
                        <Stack as="span">{t("isFreeApp")}</Stack>
                      )}
                    </VStack>
                  )}
                </VStack>
                <HStack $style={{ justifyContent: "center", gap: "56px" }}>
                  {[
                    {
                      href: `${routeTree.root.path}?categoryId=${app.categoryId}`,
                      lable: t("category"),
                      value: snakeCaseToTitle(app.categoryId),
                    },
                    { lable: t("createdBy"), value: "Vultisig" },
                    { lable: t("version"), value: "2.1.0" },
                    {
                      lable: t("lastUpdate"),
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
                  ? [{ key: "#policies", label: t("policies") }]
                  : []),
                { key: "#overview", label: t("overview") },
                { key: "#features", label: t("features") },
                { key: "#faq", label: t("faq") },
                { key: "#informations", label: t("usageInfo") },
                { key: "#reviews", label: `${t("reviews")} & ${t("ratings")}` },
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
            {isInstalled && !isFeeApp && !!schema && (
              <>
                <AppPolicies app={app} schema={schema} />
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
                {t("features")}
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
            <VStack id="faq" $style={{ gap: "24px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "18px", lineHeight: "28px" }}
              >
                {t("faq")}
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
                {t("usageInfo")}
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
                  {t("appPermissions")}
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
                    <Tooltip title="Required to securely approve and route app payment transactions through your vault.">
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
                  {t("audit")}
                </Stack>
                {["Fully audited, check the certificate"].map((item, index) => (
                  <HStack key={index} $style={{ gap: "8px" }}>
                    <Stack
                      as={SubscriptionTickIcon}
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
