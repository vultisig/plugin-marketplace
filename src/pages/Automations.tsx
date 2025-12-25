import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "styled-components";

import { AutomationForm } from "@/automations/Default";
import { RecurringSendsForm } from "@/automations/RecurringSends";
import { RecurringSwapsForm } from "@/automations/RecurringSwaps";
import { useAntd } from "@/hooks/useAntd";
import { useGoBack } from "@/hooks/useGoBack";
import { useQueries } from "@/hooks/useQueries";
import { ChevronLeftIcon } from "@/icons/ChevronLeftIcon";
import { CirclePlusIcon } from "@/icons/CirclePlusIcon";
import { TrashIcon } from "@/icons/TrashIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import {
  delPolicy,
  getAutomations,
  getRecipeSpecification,
  uninstallApp,
} from "@/utils/api";
import {
  modalHash,
  recurringSendsAppId,
  recurringSwapsAppId,
} from "@/utils/constants";
import { routeTree } from "@/utils/routes";
import { App, AppAutomation, RecipeSchema } from "@/utils/types";

type StateProps = {
  app?: App;
  loading: boolean;
  automations: AppAutomation[];
  schema?: RecipeSchema;
  totalCount: number;
};

export const AutomationsPage = () => {
  const [state, setState] = useState<StateProps>({
    loading: true,
    automations: [],
    totalCount: 0,
  });
  const { app, automations, loading, schema, totalCount } = state;
  const { messageAPI, modalAPI } = useAntd();
  const { id = "" } = useParams();
  const { getAppData } = useQueries();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const colors = useTheme();

  const fetchAutomations = useCallback(
    (skip = 0) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getAutomations(id, { skip })
        .then(({ automations, totalCount }) => {
          setState((prevState) => ({
            ...prevState,
            automations,
            loading: false,
            totalCount,
          }));
        })
        .catch(() => {
          setState((prevState) => ({ ...prevState, loading: false }));
        });
    },
    [id]
  );

  const handleDelete = (id: string, signature: string) => {
    if (signature) {
      modalAPI.confirm({
        title: "Are you sure you want to delete this Automation?",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk() {
          setState((prevState) => ({ ...prevState, loading: true }));

          delPolicy(id, signature)
            .then(() => {
              messageAPI.success("Automation successfully deleted");

              fetchAutomations();
            })
            .catch(() => {
              messageAPI.error("Automation deletion failed");

              setState((prevState) => ({ ...prevState, loading: false }));
            });
        },
      });
    } else {
      messageAPI.error("Automation deletion failed");
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
    Promise.all([getAppData(id), getRecipeSpecification(id)])
      .then(([app, schema]) => {
        setState((prevState) => ({ ...prevState, app, schema }));

        fetchAutomations();
      })
      .catch(() => goBack(routeTree.root.path));
  }, [fetchAutomations]);

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

          {id === recurringSwapsAppId ? (
            <RecurringSwapsForm
              app={app}
              automations={automations}
              loading={loading}
              onCreate={() => fetchAutomations()}
              onDelete={handleDelete}
              schema={schema}
              totalCount={totalCount}
            />
          ) : id === recurringSendsAppId ? (
            <RecurringSendsForm
              app={app}
              automations={automations}
              loading={loading}
              onCreate={() => fetchAutomations()}
              onDelete={handleDelete}
              schema={schema}
              totalCount={totalCount}
            />
          ) : (
            <AutomationForm
              app={app}
              automations={automations}
              loading={loading}
              onCreate={() => fetchAutomations()}
              onDelete={handleDelete}
              schema={schema}
              totalCount={totalCount}
            />
          )}
        </VStack>
      </VStack>
    </>
  );
};
