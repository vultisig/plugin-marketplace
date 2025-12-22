import { Table, TableProps, Tabs } from "antd";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { AutomationForm } from "@/automations/Default";
import { RecurringSendsForm } from "@/automations/RecurringSends";
import { RecurringSwapsForm } from "@/automations/RecurringSwaps";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { useAntd } from "@/hooks/useAntd";
import { useGoBack } from "@/hooks/useGoBack";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { TrashIcon } from "@/icons/TrashIcon";
import { Policy } from "@/proto/policy_pb";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import {
  delPolicy,
  getApp,
  getPolicies,
  getRecipeSpecification,
  isAppInstalled,
  uninstallApp,
} from "@/utils/api";
import {
  modalHash,
  recurringSendsAppId,
  recurringSwapsAppId,
} from "@/utils/constants";
import {
  camelCaseToTitle,
  snakeCaseToTitle,
  toNumberFormat,
} from "@/utils/functions";
import { routeTree } from "@/utils/routes";
import { App, CustomAppPolicy, RecipeSchema } from "@/utils/types";

type StateProps = {
  app?: App;
  loading?: boolean;
  policies: CustomAppPolicy[];
  schema?: RecipeSchema;
  totalCount: number;
};

export const AutomationsPage = () => {
  const [state, setState] = useState<StateProps>({
    policies: [],
    totalCount: 0,
  });
  const { app, loading, policies, schema } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const colors = useTheme();

  const columns: TableProps<CustomAppPolicy>["columns"] = [
    Table.EXPAND_COLUMN,
    {
      dataIndex: "parsedRecipe",
      key: "name",
      render: ({ name }: Policy) => name,
      title: "Name",
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "maxTxsPerWindow",
      render: ({ maxTxsPerWindow }: Policy) =>
        maxTxsPerWindow ? toNumberFormat(maxTxsPerWindow) : "-",
      title: "Max Transactions",
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "rateLimitWindow",
      render: ({ rateLimitWindow }: Policy) =>
        rateLimitWindow ? toNumberFormat(rateLimitWindow) : "-",
      title: "Rate Limit",
    },
    {
      align: "center",
      key: "action",
      render: (_, record) => (
        <HStack $style={{ justifyContent: "center" }}>
          <Button
            icon={<TrashIcon fontSize={16} />}
            kind="danger"
            onClick={() => handleDelete(record)}
            ghost
          />
        </HStack>
      ),
      title: "Action",
      width: 80,
    },
  ];

  const fetchPolicies = useCallback(
    (skip = 0) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getPolicies(id, { skip })
        .then(({ policies, totalCount }) => {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            policies,
            totalCount,
          }));
        })
        .catch(() => {
          setState((prevState) => ({ ...prevState, loading: false }));
        });
    },
    [id]
  );

  const handleDelete = ({ id, signature }: CustomAppPolicy) => {
    if (signature) {
      modalAPI.confirm({
        title: "Are you sure you want to delete this policy?",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk() {
          setState((prevState) => ({ ...prevState, loading: true }));

          delPolicy(id, signature)
            .then(() => {
              messageAPI.success("Policy successfully deleted");

              fetchPolicies(0);
            })
            .catch(() => {
              messageAPI.error("Policy deletion failed");

              setState((prevState) => ({ ...prevState, loading: false }));
            });
        },
      });
    } else {
      messageAPI.error("Policy deletion failed");
    }
  };

  const handleUninstall = () => {
    modalAPI.confirm({
      title: "Are you sure you want to uninstall this app?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        setState((prevState) => ({ ...prevState, loading: true }));

        uninstallApp(id)
          .then(() => {
            messageAPI.open({
              type: "success",
              content: "App successfully uninstalled",
            });

            navigate(routeTree.myApps.path, { replace: true });
          })
          .catch(() => {
            messageAPI.open({
              type: "error",
              content: "App uninstallation failed",
            });

            setState((prevState) => ({ ...prevState, loading: false }));
          });
      },
    });
  };

  useEffect(() => {
    isAppInstalled(id).then((isInstalled) => {
      if (!isInstalled) {
        goBack(routeTree.root.path);
        return;
      }

      Promise.all([getApp(id), getRecipeSpecification(id)])
        .then(([app, schema]) => {
          setState((prevState) => ({ ...prevState, app, schema }));

          fetchPolicies();
        })
        .catch(() => goBack(routeTree.root.path));
    });
  }, [id, fetchPolicies, goBack]);

  if (!app || !schema) return <Spin centered />;

  return (
    <>
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
            onClick={() => goBack()}
          >
            <ChevronLeftIcon fontSize={16} />
            Go back
          </HStack>
          <HStack $style={{ alignItems: "center", gap: "12px" }}>
            <Stack
              as="img"
              alt={app.title}
              src={app.logoUrl}
              $style={{ borderRadius: "12px", height: "32px", width: "32px" }}
            />
            <Stack as="span" $style={{ fontSize: "22px" }}>
              {app.title}
            </Stack>
          </HStack>
          <Divider light />
          <VStack $style={{ alignItems: "flex-start", gap: "16px" }}>
            <Stack
              as="span"
              $style={{ color: colors.textTertiary.toHex(), fontSize: "12px" }}
            >
              Quick actions
            </Stack>
            <HStack $style={{ alignItems: "center", gap: "16px" }}>
              <Button
                disabled={loading}
                href={modalHash.automation}
                icon={<CirclePlusIcon />}
                loading={loading}
                state={true}
              >
                Add Automation
              </Button>
              <Button
                disabled={loading}
                icon={<TrashIcon />}
                loading={loading}
                kind="danger"
                onClick={handleUninstall}
              >
                Uninstall App
              </Button>
            </HStack>
          </VStack>
          <Tabs
            items={[
              {
                children: (
                  <Table
                    columns={columns}
                    dataSource={policies}
                    expandable={{
                      expandedRowRender: (
                        { parsedRecipe: { description, rules } },
                        index
                      ) => {
                        return (
                          <VStack key={index} $style={{ gap: "8px" }}>
                            {description && (
                              <>
                                <VStack>
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "12px",
                                      lineHeight: "18px",
                                    }}
                                  >
                                    Description
                                  </Stack>
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "12px",
                                      lineHeight: "18px",
                                    }}
                                  >
                                    {description}
                                  </Stack>
                                </VStack>
                                <Divider light />
                              </>
                            )}
                            {rules.map(
                              (
                                { description, parameterConstraints, target },
                                index
                              ) => (
                                <Fragment key={index}>
                                  {index > 0 && <Divider light />}
                                  <Stack
                                    $style={{
                                      display: "grid",
                                      gap: "8px",
                                      gridTemplateColumns: "repeat(3, 1fr)",
                                    }}
                                    $media={{
                                      xl: {
                                        $style: {
                                          gridTemplateColumns: "repeat(2, 1fr)",
                                        },
                                      },
                                    }}
                                  >
                                    {parameterConstraints.map(
                                      ({ constraint, parameterName }) => (
                                        <VStack key={parameterName}>
                                          {constraint?.value.case ? (
                                            <HStack
                                              $style={{
                                                alignItems: "center",
                                                gap: "4px",
                                              }}
                                            >
                                              <Stack
                                                as="span"
                                                $style={{
                                                  fontSize: "12px",
                                                  lineHeight: "18px",
                                                }}
                                              >
                                                {snakeCaseToTitle(
                                                  parameterName
                                                )}
                                              </Stack>
                                              <Stack
                                                as="span"
                                                $style={{
                                                  fontSize: "10px",
                                                  lineHeight: "18px",
                                                }}
                                              >{`(${camelCaseToTitle(
                                                constraint.value.case
                                              )})`}</Stack>
                                            </HStack>
                                          ) : (
                                            <Stack
                                              as="span"
                                              $style={{
                                                fontSize: "12px",
                                                lineHeight: "18px",
                                              }}
                                            >
                                              {snakeCaseToTitle(parameterName)}
                                            </Stack>
                                          )}
                                          {typeof constraint?.value.value ===
                                            "string" &&
                                          constraint.value.value.startsWith(
                                            "0x"
                                          ) ? (
                                            <MiddleTruncate
                                              $style={{
                                                fontSize: "12px",
                                                lineHeight: "18px",
                                              }}
                                            >
                                              {constraint.value.value}
                                            </MiddleTruncate>
                                          ) : (
                                            <Stack
                                              as="span"
                                              $style={{
                                                fontSize: "12px",
                                                lineHeight: "18px",
                                              }}
                                            >
                                              {constraint?.value.value || "-"}
                                            </Stack>
                                          )}
                                        </VStack>
                                      )
                                    )}
                                    {target ? (
                                      <VStack>
                                        {target.target.case ? (
                                          <HStack
                                            $style={{
                                              alignItems: "center",
                                              gap: "4px",
                                            }}
                                          >
                                            <Stack
                                              as="span"
                                              $style={{
                                                fontSize: "12px",
                                                lineHeight: "18px",
                                              }}
                                            >
                                              Target
                                            </Stack>
                                            <Stack
                                              as="span"
                                              $style={{
                                                fontSize: "10px",
                                                lineHeight: "18px",
                                              }}
                                            >{`(${camelCaseToTitle(
                                              target.target.case
                                            )})`}</Stack>
                                          </HStack>
                                        ) : (
                                          <Stack
                                            as="span"
                                            $style={{
                                              fontSize: "12px",
                                              lineHeight: "18px",
                                            }}
                                          >
                                            Target
                                          </Stack>
                                        )}
                                        {typeof target.target.value ===
                                          "string" &&
                                        target.target.value.startsWith("0x") ? (
                                          <MiddleTruncate
                                            $style={{
                                              fontSize: "12px",
                                              lineHeight: "18px",
                                            }}
                                          >
                                            {target.target.value}
                                          </MiddleTruncate>
                                        ) : (
                                          <Stack
                                            as="span"
                                            $style={{
                                              fontSize: "12px",
                                              lineHeight: "18px",
                                            }}
                                          >
                                            {target.target.value || "-"}
                                          </Stack>
                                        )}
                                      </VStack>
                                    ) : (
                                      <></>
                                    )}
                                  </Stack>
                                  {description && (
                                    <VStack>
                                      <Stack
                                        as="span"
                                        $style={{
                                          fontSize: "12px",
                                          lineHeight: "18px",
                                        }}
                                      >
                                        Description
                                      </Stack>
                                      <Stack
                                        as="span"
                                        $style={{
                                          fontSize: "12px",
                                          lineHeight: "18px",
                                        }}
                                      >
                                        {description}
                                      </Stack>
                                    </VStack>
                                  )}
                                </Fragment>
                              )
                            )}
                          </VStack>
                        );
                      },
                    }}
                    loading={loading}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    id="policies"
                  />
                ),
                key: "upcoming",
                label: "Upcoming",
              },
              { disabled: true, key: "history", label: "History" },
            ]}
          />
        </VStack>
      </VStack>

      {id === recurringSwapsAppId ? (
        <RecurringSwapsForm
          app={app}
          onFinish={() => fetchPolicies(0)}
          schema={schema}
        />
      ) : id === recurringSendsAppId ? (
        <RecurringSendsForm
          app={app}
          onFinish={() => fetchPolicies(0)}
          schema={schema}
        />
      ) : (
        <AutomationForm
          app={app}
          onFinish={() => fetchPolicies(0)}
          schema={schema}
        />
      )}
    </>
  );
};
