import { Anchor, Collapse } from "antd";
import dayjs from "dayjs";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { RecurringSendsImages } from "@/components/appImages/RecurringSends";
import { RecurringSwapsImages } from "@/components/appImages/RecurringSwaps";
import { AppPolicies } from "@/components/AppPolicies";
import { AppReviews } from "@/components/AppReviews";
import { PaymentModal } from "@/components/PaymentModal";
import { useAntd } from "@/hooks/useAntd";
import { useCore } from "@/hooks/useCore";
import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CircleArrowDownIcon } from "@/icons/CircleArrowDownIcon";
import { CircleCheckIcon } from "@/icons/CircleCheckIcon";
import { ShieldCheckIcon } from "@/icons/ShieldCheckIcon";
import { StarIcon } from "@/icons/StarIcon";
import { SubscriptionTickIcon } from "@/icons/SubscriptionTickIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import {
  getRecipeSpecification,
  isAppInstalled,
  uninstallApp,
} from "@/utils/api";
import {
  feeAppId,
  modalHash,
  recurringSendsAppId,
  recurringSwapsAppId,
} from "@/utils/constants";
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
  isFeeAppInstalled?: boolean;
  isInstalled?: boolean;
  loading?: boolean;
  schema?: RecipeSchema;
};

export const AppPage = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({});
  const { app, isFeeAppInstalled, isInstalled, loading, schema } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { baseValue, connect, currency, isConnected } = useCore();
  const { id = "" } = useParams<{ id: string }>();
  const { getAppData } = useQueries();
  const goBack = useGoBack();
  const navigate = useNavigate();
  const colors = useTheme();
  const isFree = !app?.pricing.length;

  const informations = [
    {
      label: t("feeStructure"),
      value: (
        <>
          {isFree
            ? t("isFreeApp")
            : app.pricing.map(({ amount, frequency, type }, index) => (
                <Stack as="span" key={index}>
                  {pricingText({
                    amount,
                    baseValue,
                    currency,
                    frequency,
                    type,
                  })}
                </Stack>
              ))}
        </>
      ),
    },
    { label: t("downloads"), value: app?.installations || 0 },
    { label: t("support"), value: "24/7" },
  ];

  const permissions = useMemo(() => {
    if (!schema) return [];

    return [
      ...schema.supportedResources.reduce<string[]>((acc, { resourcePath }) => {
        if (!resourcePath || !resourcePath.functionId) return acc;

        const id = resourcePath.functionId;

        if (!acc.includes(id)) acc.push(id);

        return acc;
      }, []),
      ...(isFree ? [] : ["Fee deduction authorization"]),
      "Vault balance visibility",
    ];
  }, [isFree, schema]);

  const checkStatus = useCallback(async () => {
    if (!app) return;

    let isInstalled = false;
    let isFeeAppInstalled = !app.pricing.length;

    if (!isFeeAppInstalled) isFeeAppInstalled = await isAppInstalled(feeAppId);
    if (isFeeAppInstalled) isInstalled = await isAppInstalled(app.id);

    setState((prevState) => ({ ...prevState, isInstalled, isFeeAppInstalled }));
  }, [app]);

  const handleInstall = async (id: string) => {
    if (loading) return;

    setState((prevState) => ({ ...prevState, loading: true }));

    const isInstalled = await startReshareSession(id);

    setState((prevState) => ({ ...prevState, loading: false }));

    if (isInstalled) {
      if (id === feeAppId) {
        setState((prevState) => ({ ...prevState, isFeeAppInstalled: true }));

        navigate(routeTree.app.link(id), { replace: true });
      } else {
        setState((prevState) => ({ ...prevState, isInstalled: true }));

        navigate(modalHash.policy, { state: true });
      }

      messageAPI.open({
        type: "success",
        content: t("successfulAppInstallation"),
      });
    } else {
      messageAPI.open({
        type: "error",
        content: t("unsuccessfulAppInstallation"),
      });
    }
  };

  const handleUninstall = async () => {
    if (loading) return;

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
        isFeeAppInstalled: undefined,
        isInstalled: undefined,
      }));
    }
  }, [checkStatus, isConnected]);

  useEffect(() => {
    if (id === feeAppId) {
      goBack(routeTree.root.path);
      return;
    }

    getAppData(id)
      .then((app) => {
        getRecipeSpecification(app.id)
          .catch(() => undefined)
          .then((schema) => {
            setState((prevState) => ({ ...prevState, app, schema }));
          });
      })
      .catch(() => goBack(routeTree.root.path));
  }, [id]);

  if (!app) return <Spin centered />;

  return (
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
            $style={{ gap: "32px", overflow: "hidden", paddingTop: "24px" }}
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
                        src={app.logoUrl}
                        $style={{
                          borderRadius: "16px",
                          height: "72px",
                          width: "72px",
                        }}
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
                            {t("get")}
                            <Stack
                              as="span"
                              $style={{
                                backgroundColor: colors.textPrimary.toHex(),
                                borderRadius: "50%",
                                height: "2px",
                                width: "2px",
                              }}
                            />
                            {t("free")}
                          </Button>
                        ) : isInstalled ? (
                          <>
                            <Button
                              disabled={loading || !schema}
                              href={modalHash.policy}
                            >
                              {t("addAutomation")}
                            </Button>
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
                          <Button
                            loading={loading}
                            onClick={() => handleInstall(app.id)}
                          >
                            {t("get")}
                            <Stack
                              as="span"
                              $style={{
                                backgroundColor: colors.textPrimary.toHex(),
                                borderRadius: "50%",
                                height: "2px",
                                width: "2px",
                              }}
                            />
                            {t("free")}
                          </Button>
                        )
                      ) : (
                        <Button onClick={connect}>{t("connect")}</Button>
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
                    {isFree ? (
                      <Stack as="span">{t("isFreeApp")}</Stack>
                    ) : (
                      app.pricing.map(({ amount, frequency, type }, index) => (
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
                    )}
                  </VStack>
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
                ...(isInstalled
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
              offsetTop={117}
              targetOffset={158}
              $style={{ backgroundColor: colors.bgPrimary.toHex() }}
            />
            {isInstalled && !!schema && (
              <>
                <AppPolicies app={app} schema={schema} />
                <Divider light />
              </>
            )}
            <Stack id="overview">{app.description}</Stack>
            {app.id === recurringSendsAppId && <RecurringSendsImages />}
            {app.id === recurringSwapsAppId && <RecurringSwapsImages />}
            <Divider light />
            <VStack id="features" $style={{ gap: "24px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "18px", lineHeight: "28px" }}
              >
                {t("features")}
              </Stack>
              <VStack $style={{ gap: "8px" }}>
                {app.features.map((item, index) => (
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
            {app.faqs.length > 0 && (
              <>
                <VStack id="faq" $style={{ gap: "24px" }}>
                  <Stack
                    as="span"
                    $style={{ fontSize: "18px", lineHeight: "28px" }}
                  >
                    {t("faq")}
                  </Stack>
                  <VStack $style={{ gap: "16px" }}>
                    {app.faqs.map(({ answer, question }, index) => (
                      <Fragment key={index}>
                        {index > 0 && <Divider light />}
                        <Collapse
                          bordered={false}
                          items={[
                            {
                              key: "1",
                              label: question,
                              children: (
                                <Stack
                                  dangerouslySetInnerHTML={{ __html: answer }}
                                />
                              ),
                            },
                          ]}
                          expandIconPlacement="end"
                          ghost
                        />
                      </Fragment>
                    ))}
                  </VStack>
                </VStack>
                <Divider light />
              </>
            )}
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
                xl: { $style: { position: "sticky", top: "136px" } },
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
                {permissions.map((item, index) => (
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
                  </HStack>
                ))}
              </VStack>
              {app.audited && (
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
                  <HStack $style={{ gap: "8px" }}>
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
                      {t("appAudited")}
                    </Stack>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </VStack>
        </VStack>
      </VStack>
      {isFeeAppInstalled === false && (
        <PaymentModal
          loading={loading}
          onInstall={() => handleInstall(feeAppId)}
        />
      )}
    </>
  );
};
