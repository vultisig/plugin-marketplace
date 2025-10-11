import { Anchor, Tooltip } from "antd";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { PaymentModal } from "@/components/PaymentModal";
import { PolicyList } from "@/components/PolicyList";
import { PolicyModal } from "@/components/PolicyModal";
import { Pricing } from "@/components/Pricing";
import { ReviewList } from "@/components/ReviewList";
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
import { Collapse } from "@/toolkits/Collapse";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants/core";
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
  const { connect, isConnected, messageAPI, modalAPI } = useApp();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const colors = useTheme();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(() => {
    isAppInstalled(id).then((isInstalled) => {
      if (isInstalled) {
        setState((prevState) => ({ ...prevState, isInstalled }));
      } else {
        timeoutRef.current = setTimeout(checkStatus, 1000);
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

            messageAPI.open({
              type: "success",
              content: "Plugin uninstalled successfully.",
            });
          })
          .catch(() => {
            setState((prevState) => ({ ...prevState, loading: false }));

            messageAPI.open({
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

  return plugin ? (
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
                      src="/media/payroll.png"
                      $style={{ height: "72px", width: "72px" }}
                    />
                    <VStack $style={{ gap: "8px", justifyContent: "center" }}>
                      <Stack
                        as="span"
                        $style={{ fontSize: "22px", lineHeight: "24px" }}
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
                        <Button
                          kind="primary"
                          loading={loading}
                          onClick={() =>
                            navigate(modalHash.payment, { state: true })
                          }
                        >
                          Install Fee Plugin
                        </Button>
                      ) : isInstalled ? (
                        <>
                          <Button
                            disabled={loading || !schema}
                            href={modalHash.policy}
                            kind="primary"
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
            <Stack
              as={Anchor}
              direction="horizontal"
              items={[
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
            <Overview />
            <Divider />
            <Features />
            <Divider />
            <FAQs />
            <Divider />
            <UsageInfo />
            <Divider />
            <ReviewList
              isInstalled={isInstalled}
              onInstall={handleInstall}
              plugin={plugin}
            />
            <Divider />
            <PolicyList plugin={plugin} />
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
      <PaymentModal />
      <PolicyModal app={plugin} />
    </>
  ) : (
    <Spin centered />
  );
};

const FAQs = () => {
  const text =
    "Maecenas in porttitor consequat aenean. In nulla cursus pulvinar at lacus ultricies et nulla. Non porta arcu vehicula rhoncus. Habitant integer lectus elit proin. Etiam morbi nunc pretium vestibulum sed convallis etiam. Pulvinar vitae porttitor elementum eget mattis sagittis facilisi magna. Et pulvinar pretium vitae odio non ultricies maecenas id. Non nibh scelerisque in facilisis tincidunt viverra fermentum sem. Quam varius pretium vitae neque. Senectus lectus ultricies nibh eget.";

  const data = [
    {
      answer: text,
      question: "How does it work?",
    },
    {
      answer: text,
      question: "How to install?",
    },
    {
      answer: text,
      question: "Is it safe? I don’t want to risk my funds.",
    },
    {
      answer: text,
      question: "Are apps audited?",
    },
  ];

  return (
    <VStack id="faqs" $style={{ gap: "24px" }}>
      <Stack as="span" $style={{ fontSize: "18px", lineHeight: "28px" }}>
        FAQs
      </Stack>
      <VStack $style={{ gap: "16px" }}>
        {data.map(({ answer, question }, index) => (
          <Fragment key={index}>
            {index > 0 && <Divider />}
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
  );
};

const Features = () => {
  const colors = useTheme();

  return (
    <VStack id="features" $style={{ gap: "24px" }}>
      <Stack as="span" $style={{ fontSize: "18px", lineHeight: "28px" }}>
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
            {index > 0 && <Divider />}
            <HStack $style={{ alignItems: "center", gap: "8px" }}>
              <Stack
                as={CircleCheckIcon}
                $style={{ color: colors.success.toHex(), fontSize: "24px" }}
              />
              <Stack as="span" $style={{ fontSize: "14px" }}>
                {item}
              </Stack>
            </HStack>
          </Fragment>
        ))}
      </VStack>
    </VStack>
  );
};

const Overview = () => {
  return (
    <Stack id="overview">
      Set and forget payroll for your team. Automate recurring team payments
      with confidence. This plugin makes it easy to set, schedule, and manage
      payroll so you can focus on building while your contributors get paid on
      time.
    </Stack>
  );
};

const UsageInfo = () => {
  const colors = useTheme();

  const data = [
    {
      label: "Price",
      value: "$29.99",
    },
    {
      label: "Fee Structure",
      value: "0.1% per trade",
    },
    {
      label: "Downloads",
      value: "1,294",
    },
    {
      label: "Support",
      value: "24/7",
    },
  ];

  return (
    <VStack id="informations" $style={{ gap: "24px" }}>
      <Stack as="span" $style={{ fontSize: "18px", lineHeight: "28px" }}>
        Usage Info
      </Stack>
      <VStack $style={{ gap: "16px" }}>
        {data.map(({ label, value }, index) => (
          <HStack
            key={index}
            $style={{ alignItems: "center", justifyContent: "space-between" }}
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
            <Stack $style={{ fontSize: "14px", lineHeight: "18px" }}>
              {value}
            </Stack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};
