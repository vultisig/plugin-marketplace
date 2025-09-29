import { message, Modal, Table, TableProps } from "antd";
import { FC, Fragment, useCallback, useEffect, useState } from "react";

import { MiddleTruncate } from "@/components/MiddleTruncate";
import { TrashIcon } from "@/icons/TrashIcon";
import { Policy } from "@/proto/policy_pb";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { toCapitalizeFirst, toNumeralFormat } from "@/utils/functions";
import { delPolicy, getPolicies } from "@/utils/services/marketplace";
import { App, CustomAppPolicy } from "@/utils/types";

interface PluginPolicyListProps {
  plugin: App;
}

interface InitialState {
  loading: boolean;
  policies: CustomAppPolicy[];
  totalCount: number;
}

export const PluginPolicyList: FC<PluginPolicyListProps> = ({ plugin }) => {
  const initialState: InitialState = {
    loading: true,
    policies: [],
    totalCount: 0,
  };
  const [state, setState] = useState(initialState);
  const { loading, policies } = state;
  const [messageApi, messageHolder] = message.useMessage();
  const [modalAPI, modalHolder] = Modal.useModal();
  const { id } = plugin;

  const columns: TableProps<CustomAppPolicy>["columns"] = [
    {
      align: "center",
      key: "row",
      render: (_, __, index) => index + 1,
      title: "Row",
      width: 20,
    },
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
        maxTxsPerWindow ? toNumeralFormat(maxTxsPerWindow) : "-",
      title: "Max Txs",
    },
    {
      align: "center",
      dataIndex: "parsedRecipe",
      key: "rateLimitWindow",
      render: ({ rateLimitWindow }: Policy) =>
        rateLimitWindow ? toNumeralFormat(rateLimitWindow) : "-",
      title: "Rate Limit",
    },
    {
      align: "center",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<TrashIcon />}
          kind="link"
          onClick={() => handleDelete(record)}
          status="danger"
        />
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
        title: "Are you sure delete this policy?",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk() {
          setState((prevState) => ({ ...prevState, loading: true }));

          delPolicy(id, signature)
            .then(() => {
              messageApi.success("Policy deleted successfully.");

              fetchPolicies(0);
            })
            .catch(() => {
              setState((prevState) => ({ ...prevState, loading: false }));
            });
        },
        onCancel() {},
      });
    } else {
      messageApi.error("Unable to delete policy: signature is missing.");
    }
  };

  useEffect(() => fetchPolicies(0), [id, fetchPolicies]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={policies}
        expandable={{
          expandedRowRender: ({ parsedRecipe: { rules } }) => {
            return (
              <VStack $style={{ gap: "8px" }}>
                {rules.map(({ id, parameterConstraints, target }, index) => (
                  <Fragment key={id}>
                    {index > 0 && <Divider />}
                    <Stack
                      key={id}
                      $style={{
                        display: "grid",
                        gap: "8px",
                        gridTemplateColumns: "repeat(2, 1fr)",
                      }}
                      $media={{
                        lg: {
                          $style: { gridTemplateColumns: "repeat(3, 1fr)" },
                        },
                        xl: {
                          $style: { gridTemplateColumns: "repeat(2, 1fr)" },
                        },
                      }}
                    >
                      {parameterConstraints.map(
                        ({ constraint, parameterName }) => {
                          const value = String(constraint?.value.value || "");

                          return (
                            <VStack key={parameterName}>
                              {constraint?.value.case ? (
                                <HStack
                                  $style={{ alignItems: "center", gap: "4px" }}
                                >
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "12px",
                                      fontWeight: "500",
                                      lineHeight: "18px",
                                    }}
                                  >
                                    {toCapitalizeFirst(parameterName)}
                                  </Stack>
                                  <Stack
                                    as="span"
                                    $style={{
                                      fontSize: "10px",
                                      fontWeight: "500",
                                      lineHeight: "18px",
                                    }}
                                  >{`(${constraint.value.case})`}</Stack>
                                </HStack>
                              ) : (
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {toCapitalizeFirst(parameterName)}
                                </Stack>
                              )}
                              {value.startsWith("0x") ? (
                                <MiddleTruncate>{value}</MiddleTruncate>
                              ) : (
                                <Stack
                                  as="span"
                                  $style={{
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    lineHeight: "18px",
                                  }}
                                >
                                  {value}
                                </Stack>
                              )}
                            </VStack>
                          );
                        }
                      )}

                      {target ? (
                        <VStack>
                          <HStack $style={{ gap: "4px" }}>
                            <Stack
                              as="span"
                              $style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                lineHeight: "18px",
                              }}
                            >
                              Target
                            </Stack>
                            <Stack
                              as="span"
                              $style={{
                                fontSize: "10px",
                                fontWeight: "500",
                                lineHeight: "18px",
                              }}
                            >{`(${target.target.case})`}</Stack>
                          </HStack>
                          <Stack
                            as="span"
                            $style={{
                              fontSize: "12px",
                              fontWeight: "500",
                              lineHeight: "18px",
                            }}
                          >
                            {target.target.value || "-"}
                          </Stack>
                        </VStack>
                      ) : (
                        <></>
                      )}
                    </Stack>
                  </Fragment>
                ))}
              </VStack>
            );
          },
        }}
        loading={loading}
        rowKey="id"
        size="small"
      />

      {messageHolder}
      {modalHolder}
    </>
  );
};
