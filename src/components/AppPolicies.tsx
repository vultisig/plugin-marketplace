import { Table, TableProps } from "antd";
import { FC, Fragment, useCallback, useEffect, useState } from "react";

import { DefaultPolicyForm } from "@/components/appPolicyForms/Default";
import { RecurringSwapsPolicyForm } from "@/components/appPolicyForms/RecurringSwaps";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { useAntd } from "@/hooks/useAntd";
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
  const [state, setState] = useState<StateProps>({
    loading: true,
    policies: [],
    totalCount: 0,
  });
  const { loading, policies } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { id } = app;

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
                        Description
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
                            Description
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
          onFinish={() => fetchPolicies(0)}
          schema={schema}
        />
      ) : (
        <DefaultPolicyForm
          app={app}
          onFinish={() => fetchPolicies(0)}
          schema={schema}
        />
      )}
    </>
  );
};
