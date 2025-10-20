import { Empty, Select } from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "styled-components";

import { AppItem } from "@/components/AppItem";
import { useFilterParams } from "@/hooks/useFilterParams";
import { Divider } from "@/toolkits/Divider";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { getApps, getCategories } from "@/utils/marketplace";
import { App, AppFilters, Category } from "@/utils/types";

type InitialState = {
  categories: Category[];
  loading: boolean;
  apps: App[];
};

export const AppsPage = () => {
  const initialState: InitialState = {
    categories: [],
    loading: true,
    apps: [],
  };
  const [state, setState] = useState(initialState);
  const { categories, loading, apps } = state;
  const { filters, setFilters } = useFilterParams<AppFilters>();
  const colors = useTheme();
  const [newPlugin] = apps;

  const fetchPlugins = useCallback((skip: number, filters: AppFilters) => {
    setState((prevState) => ({ ...prevState, loading: true }));

    getApps({ ...filters, skip })
      .then(({ apps }) => {
        setState((prevState) => ({ ...prevState, loading: false, apps }));
      })
      .catch(() => {
        setState((prevState) => ({ ...prevState, loading: false }));
      });
  }, []);

  const debouncedFetchPlugins = useMemo(
    () => debounce(fetchPlugins, 500),
    [fetchPlugins]
  );

  useEffect(
    () => debouncedFetchPlugins(0, filters),
    [debouncedFetchPlugins, filters]
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
              Discover Apps
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
                  Sort By
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
              {newPlugin ? (
                <>
                  <VStack $style={{ flexDirection: "column", gap: "16px" }}>
                    <Stack
                      as="span"
                      $style={{ fontSize: "17px", lineHeight: "20px" }}
                    >
                      New
                    </Stack>
                    <AppItem {...newPlugin} horizontal />
                  </VStack>
                  <Divider light />
                </>
              ) : (
                <></>
              )}
              <VStack $style={{ flexDirection: "column", gap: "16px" }}>
                <Stack
                  as="span"
                  $style={{ fontSize: "17px", lineHeight: "20px" }}
                >
                  All Apps
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
