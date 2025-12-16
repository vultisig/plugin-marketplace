import dayjs from "dayjs";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "styled-components";

import { useCore } from "@/hooks/useCore";
import { CircleInfoIcon } from "@/icons/CircleInfoIcon";
import { HStack, Stack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants";

export const FreeTrialBanner = () => {
  const { feeApp, feeAppStatus } = useCore();
  const colors = useTheme();

  const trialRemaining = useMemo(() => {
    if (!feeAppStatus) return "";

    const d = dayjs.duration(feeAppStatus.trialRemaining);

    let message = "";

    if (d.asDays() >= 1) {
      message = `${Math.floor(d.asDays())} days left`;
    } else if (d.asHours() >= 1) {
      message = `${Math.floor(d.asHours())} hours left`;
    } else if (d.asMinutes() >= 1) {
      message = `${Math.floor(d.asMinutes())} minutes left`;
    } else if (d.asSeconds() >= 1) {
      message = `${Math.floor(d.asSeconds())} seconds left`;
    } else {
      message = "Expired";
    }

    return message;
  }, [feeAppStatus]);

  if (!feeApp || !feeAppStatus) return null;

  return (
    <HStack
      $style={{
        alignItems: "center",
        backgroundColor: colors.info.toRgba(0.2),
        borderColor: colors.info.toRgba(0.5),
        borderRadius: "12px",
        height: "52px",
        justifyContent: "space-between",
        padding: "0 16px",
      }}
    >
      <HStack $style={{ alignItems: "center", gap: "8px" }}>
        <CircleInfoIcon fontSize={18} />
        Free Trial Active
      </HStack>
      <HStack $style={{ alignItems: "center", fontWeight: "400", gap: "4px" }}>
        {`${trialRemaining} · Install the`}
        <Stack
          as={Link}
          to={modalHash.payment}
          $style={{ fontWeight: "500", textDecoration: "underline" }}
        >
          {`${feeApp.title} App`}
        </Stack>
        to continue after the trial
      </HStack>
    </HStack>
  );
};
