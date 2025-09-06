import { Layout, Result } from "antd";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { Button } from "@/toolkits/Button";
import { HStack, VStack } from "@/toolkits/Stack";
import { routeTree } from "@/utils/constants/routes";

export const NotFoundPage = () => {
  const goBack = useGoBack();
  const colors = useTheme();

  return (
    <VStack $style={{ alignItems: "center", flexGrow: "1" }}>
      <VStack
        as={Layout}
        $style={{
          alignItems: "center",
          backgroundColor: colors.bgPrimary.toHex(),
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Result
          status="404"
          title="404"
          subTitle="Sorry, the page you visited does not exist."
          extra={
            <HStack $style={{ justifyContent: "center" }}>
              <Button
                kind="primary"
                onClick={() => goBack(routeTree.root.path)}
              >
                Back Home
              </Button>
            </HStack>
          }
        />
      </VStack>
    </VStack>
  );
};
