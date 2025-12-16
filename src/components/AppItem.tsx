import { FC } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "styled-components";

import { useCore } from "@/hooks/useCore";
import { CircleArrowDownIcon } from "@/icons/CircleArrowDownIcon";
import { StarIcon } from "@/icons/StarIcon";
import { SubscriptionTickIcon } from "@/icons/SubscriptionTickIcon";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { pricingText, toNumberFormat } from "@/utils/functions";
import { routeTree } from "@/utils/routes";
import { App } from "@/utils/types";

export const AppItem: FC<App & { horizontal?: boolean }> = ({
  avgRating,
  description,
  horizontal,
  id,
  installations,
  logoUrl,
  pricing,
  ratesCount,
  title,
  thumbnailUrl,
}) => {
  const { baseValue, currency } = useCore();
  const colors = useTheme();

  return (
    <Stack
      as={Link}
      to={routeTree.app.link(id)}
      $style={{
        border: `solid 1px ${colors.borderNormal.toHex()}`,
        borderRadius: "24px",
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        gap: "24px",
        height: "100%",
        padding: "16px",
      }}
    >
      <Stack $style={{ overflow: "hidden", position: "relative" }}>
        <Stack
          as="img"
          alt={title}
          src={thumbnailUrl}
          $style={{
            borderRadius: "12px",
            ...(horizontal ? { height: "224px" } : { width: "100%" }),
          }}
        />
        {horizontal && (
          <Stack
            as="span"
            $style={{
              backgroundColor: colors.bgPrimary.toHex(),
              borderRadius: "16px",
              fontSize: "12px",
              left: "16px",
              lineHeight: "26px",
              padding: "0 8px",
              position: "absolute",
              textTransform: "uppercase",
              top: "16px",
            }}
          >
            New
          </Stack>
        )}
        <HStack
          as="span"
          $style={{
            alignItems: "center",
            backgroundColor: colors.neutral900.toRgba(0.5),
            borderRadius: "16px",
            color: colors.neutral100.toHex(),
            fontSize: "12px",
            gap: "4px",
            lineHeight: "26px",
            padding: "0 8px",
            position: "absolute",
            right: "16px",
            top: "16px",
          }}
        >
          <SubscriptionTickIcon color={colors.success.toHex()} fontSize={16} />
          Vultisig Verified
        </HStack>
      </Stack>
      <VStack
        $style={{
          alignItems: horizontal ? "flex-start" : "normal",
          flexGrow: "1",
          gap: "20px",
        }}
      >
        <HStack $style={{ gap: "12px" }}>
          <Stack
            as="img"
            alt={title}
            src={logoUrl}
            $style={{ borderRadius: "12px", height: "56px", width: "56px" }}
          />
          <VStack $style={{ gap: "8px", justifyContent: "center" }}>
            <Stack as="span" $style={{ fontSize: "17px", lineHeight: "20px" }}>
              {title}
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
                    fontSize: "12px",
                    lineHeight: "16px",
                  }}
                >
                  {toNumberFormat(installations)}
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
                    fontSize: "14px",
                  }}
                />
                <Stack
                  as="span"
                  $style={{
                    color: colors.textTertiary.toHex(),
                    fontSize: "12px",
                    lineHeight: "16px",
                  }}
                >
                  {ratesCount ? `${avgRating}/5 (${ratesCount})` : "No Rating yet"}
                </Stack>
              </HStack>
            </HStack>
          </VStack>
        </HStack>
        <VStack as="span" $style={{ flexGrow: 1, lineHeight: "20px" }}>
          {description}
        </VStack>
        <VStack $style={{ gap: "12px" }}>
          <VStack
            as="span"
            $style={{
              alignItems: horizontal ? "normal" : "center",
              color: colors.textSecondary.toHex(),
              flexGrow: "1",
            }}
          >
            {pricing.length ? (
              pricing.map(({ amount, frequency, type }, index) => (
                <Stack as="span" key={index}>
                  {pricingText({
                    amount,
                    baseValue,
                    currency,
                    frequency,
                    type,
                  })}
                </Stack>
              ))
            ) : (
              <Stack as="span">This app is free</Stack>
            )}
          </VStack>
          <HStack
            as="span"
            $style={{
              alignItems: "center",
              backgroundColor: colors.buttonPrimary.toHex(),
              borderRadius: "44px",
              color: colors.buttonTextLight.toHex(),
              gap: "8px",
              height: "44px",
              justifyContent: "center",
              padding: "0 24px",
            }}
          >
            See Details
          </HStack>
        </VStack>
      </VStack>
    </Stack>
  );
};
