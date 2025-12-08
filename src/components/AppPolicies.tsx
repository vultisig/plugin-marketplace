import { Table, TableProps } from "antd";
import { FC, Fragment, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { AppPolicyForm } from "@/components/AppPolicyForm";
import { RecurringSwapsPolicyForm } from "@/components/appPolicyForms/RecurringSwaps";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { useAntd } from "@/hooks/useAntd";
import { useGoBack } from "@/hooks/useGoBack";
import { TrashIcon } from "@/icons/TrashIcon";
import { Policy } from "@/proto/policy_pb";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { delPolicy, getPolicies } from "@/utils/api";
import { recurringSwapsAppId } from "@/utils/constants";
import {
  camelCaseToTitle,
  snakeCaseToTitle,
  toNumberFormat,
} from "@/utils/functions";
import { App, CustomAppPolicy, RecipeSchema } from "@/utils/types";

type StateProps = {
  loading: boolean;
  policies: CustomAppPolicy[];
  totalCount: number;
};

export const AppPolicies: FC<{ app: App; schema: RecipeSchema }> = ({
  app,
  schema,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<StateProps>({
    loading: true,
    policies: [],
    totalCount: 0,
  });
  const { loading, policies } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { id } = app;
  const goBack = useGoBack();

  const columns: TableProps<CustomAppPolicy>["columns"] = [
    Table.EXPAND_COLUMN,
    {
      dataIndex: "parsedRecipe",
      key: "name",
      render: ({ name }: Policy) => name,
      title: t("name"),
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "maxTxsPerWindow",
      render: ({ maxTxsPerWindow }: Policy) =>
        maxTxsPerWindow ? toNumberFormat(maxTxsPerWindow) : "-",
      title: t("maxTransactions"),
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "rateLimitWindow",
      render: ({ rateLimitWindow }: Policy) =>
        rateLimitWindow ? toNumberFormat(rateLimitWindow) : "-",
      title: t("rateLimit"),
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
      title: t("Action"),
      width: 80,
    },
  ];

  const fetchPolicies = useCallback(
    (skip: number) => {
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

  const handleClose = (reload?: boolean) => {
    if (reload) fetchPolicies(0);

    goBack();
  };

  const handleDelete = ({ id, signature }: CustomAppPolicy) => {
    if (signature) {
      modalAPI.confirm({
        title: t("confirmPolicyDeletion"),
        okText: t("yes"),
        okType: "danger",
        cancelText: t("no"),
        onOk() {
          setState((prevState) => ({ ...prevState, loading: true }));

          delPolicy(id, signature)
            .then(() => {
              messageAPI.success(t("successfulPolicyDeletion"));

              fetchPolicies(0);
            })
            .catch(() => {
              messageAPI.error(t("unsuccessfulPolicyDeletion"));

              setState((prevState) => ({ ...prevState, loading: false }));
            });
        },
      });
    } else {
      messageAPI.error(t("unsuccessfulPolicyDeletion"));
    }
  };

  useEffect(() => fetchPolicies(0), [id, fetchPolicies]);

  return (
    <>
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
                        $style={{ fontSize: "12px", lineHeight: "18px" }}
                      >
                        {t("description")}
                      </Stack>
                      <Stack
                        as="span"
                        $style={{ fontSize: "12px", lineHeight: "18px" }}
                      >
                        {description}
                      </Stack>
                    </VStack>
                    <Divider light />
                  </>
                )}
                {rules.map(
                  ({ description, parameterConstraints, target }, index) => (
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
                            $style: { gridTemplateColumns: "repeat(2, 1fr)" },
                          },
                        }}
                      >
                        {parameterConstraints.map(
                          ({ constraint, parameterName }) => (
                            <VStack key={parameterName}>
                              {constraint?.value.case ? (
                                <HStack
                                  $style={{ alignItems: "center", gap: "4px" }}
                                >
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "12px",
                                      lineHeight: "18px",
                                    }}
                                  >
                                    {snakeCaseToTitle(parameterName)}
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
                              {typeof constraint?.value.value === "string" &&
                              constraint.value.value.startsWith("0x") ? (
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
                                $style={{ alignItems: "center", gap: "4px" }}
                              >
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "12px",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {t("target")}
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
                                {t("target")}
                              </Stack>
                            )}
                            {typeof target.target.value === "string" &&
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
                            $style={{ fontSize: "12px", lineHeight: "18px" }}
                          >
                            {t("description")}
                          </Stack>
                          <Stack
                            as="span"
                            $style={{ fontSize: "12px", lineHeight: "18px" }}
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
      {app.id === recurringSwapsAppId ? (
        <RecurringSwapsPolicyForm
          app={app}
          onClose={handleClose}
          schema={schema}
        />
      ) : (
        <AppPolicyForm app={app} onClose={handleClose} schema={schema} />
      )}
    </>
  );
};
