import { Layout, Result } from "antd";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { useGoBack } from "@/hooks/useGoBack";
import { Button } from "@/toolkits/Button";
import { HStack, VStack } from "@/toolkits/Stack";
import { routeTree } from "@/utils/routes";

export const NotFoundPage = () => {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const colors = useTheme();

  return (
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
        subTitle={t("pageNotFound")}
        extra={
          <HStack $style={{ justifyContent: "center" }}>
            <Button onClick={() => goBack(routeTree.root.path)}>
              {t("backHome")}
            </Button>
          </HStack>
        }
      />
    </VStack>
  );
};
