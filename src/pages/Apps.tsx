import { Empty, Select } from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { AppItem } from "@/components/AppItem";
import { useFilterParams } from "@/hooks/useFilterParams";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getApps, getCategories } from "@/utils/api";
import { App, AppFilters, Category } from "@/utils/types";

type InitialState = {
  categories: Category[];
  loading: boolean;
  apps: App[];
};

export const AppsPage = () => {
  const { t } = useTranslation();
  const initialState: InitialState = {
    categories: [],
    loading: true,
    apps: [],
  };
  const [state, setState] = useState(initialState);
  const { categories, loading, apps } = state;
  const { filters, setFilters } = useFilterParams<AppFilters>();
  const colors = useTheme();
  const [newApp] = apps;

  const fetchApps = useCallback((skip: number, filters: AppFilters) => {
    setState((prevState) => ({ ...prevState, loading: true }));

    getApps({ ...filters, skip })
      .then(({ apps }) => {
        setState((prevState) => ({ ...prevState, loading: false, apps }));
      })
      .catch(() => {
        setState((prevState) => ({ ...prevState, loading: false }));
      });
  }, []);

  const debouncedFetchApps = useMemo(
    () => debounce(fetchApps, 500),
    [fetchApps]
  );

  useEffect(
    () => debouncedFetchApps(0, filters),
    [debouncedFetchApps, filters]
  );

  useEffect(() => {
    getCategories()
      .then((categories) => {
        setState((prevState) => ({ ...prevState, categories }));
      })
      .catch(() => {});
  }, []);

  return (
    <VStack $style={{ alignItems: "center", flexGrow: "1" }}>
      <VStack
        $style={{
          gap: "48px",
          maxWidth: "1200px",
          padding: "16px",
          width: "100%",
        }}
      >
        <Stack
          $style={{
            backgroundImage: "url(/images/banner.jpg)",
            backgroundPosition: "center center",
            backgroundSize: "cover",
            borderRadius: "16px",
            height: "336px",
          }}
        />

        <VStack $style={{ flexGrow: "1", gap: "32px" }}>
          <VStack $style={{ gap: "24px" }}>
            <Stack as="span" $style={{ fontSize: "40px", lineHeight: "42px" }}>
              {t("discoverApps")}
            </Stack>
            <Divider light />
            <HStack $style={{ gap: "12px" }}>
              <HStack $style={{ flexGrow: "1", gap: "12px" }}>
                {categories.map(({ id, name }) => (
                  <VStack
                    as="span"
                    key={id}
                    onClick={() => setFilters({ ...filters, categoryId: id })}
                    $hover={{
                      backgroundColor: colors.textSecondary.toHex(),
                      color: colors.buttonTextLight.toHex(),
                    }}
                    $style={{
                      alignItems: "center",
                      backgroundColor:
                        filters.categoryId === id
                          ? colors.textSecondary.toHex()
                          : colors.bgSecondary.toHex(),
                      border: `solid 1px ${colors.borderNormal.toHex()}`,
                      borderRadius: "8px",
                      color:
                        filters.categoryId === id
                          ? colors.buttonTextLight.toHex()
                          : colors.textPrimary.toHex(),
                      cursor: "pointer",
                      fontSize: "12px",
                      gap: "8px",
                      justifyContent: "center",
                      height: "40px",
                      padding: "0 24px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </VStack>
                ))}
              </HStack>
              <HStack
                $style={{
                  alignItems: "center",
                  gap: "12px",
                  width: "200px",
                }}
              >
                <Stack as="span" $style={{ whiteSpace: "nowrap" }}>
                  {t("sortBy")}
                </Stack>
                <Select
                  options={[
                    { value: "-created_at", label: "Newest" },
                    { value: "created_at", label: "Oldest" },
                  ]}
                  value={filters.sort}
                  onChange={(sort) => setFilters({ ...filters, sort })}
                  allowClear
                />
              </HStack>
            </HStack>
          </VStack>

          {loading ? (
            <Spin centered />
          ) : apps.length ? (
            <>
              {!!newApp && (
                <VStack $style={{ flexDirection: "column", gap: "16px" }}>
                  <Stack
                    as="span"
                    $style={{ fontSize: "17px", lineHeight: "20px" }}
                  >
                    {t("new")}
                  </Stack>
                  <AppItem {...newApp} horizontal />
                </VStack>
              )}
              <VStack $style={{ flexDirection: "column", gap: "16px" }}>
                <Stack
                  as="span"
                  $style={{ fontSize: "17px", lineHeight: "20px" }}
                >
                  {t("apps")}
                </Stack>
                <Stack
                  $style={{
                    display: "grid",
                    gap: "32px",
                    gridTemplateColumns: "repeat(2, 1fr)",
                  }}
                  $media={{
                    xl: { $style: { gridTemplateColumns: "repeat(3, 1fr)" } },
                  }}
                >
                  {apps.map((app) => (
                    <AppItem key={app.id} {...app} />
                  ))}
                </Stack>
              </VStack>
            </>
          ) : (
            <Empty />
          )}
        </VStack>
      </VStack>
    </VStack>
  );
};
