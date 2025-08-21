import { ConfigProvider, Empty, Form, FormProps, Input, Rate } from "antd";
import dayjs from "dayjs";
import { FC, useCallback, useEffect, useState } from "react";
import { useTheme } from "styled-components";

import { Button } from "@/components/Button";
import { MiddleTruncate } from "@/components/MiddleTruncate";
import { Spin } from "@/components/Spin";
import { HStack, Stack, VStack } from "@/components/Stack";
import { useApp } from "@/hooks/useApp";
import { StarIcon } from "@/icons/StarIcon";
import {
  addPluginReview,
  getPluginReviews,
} from "@/utils/services/marketplace";
import { Plugin, Review, ReviewForm } from "@/utils/types";

type PluginReviewListProps = {
  isInstalled?: boolean;
  onInstall: () => void;
  plugin: Plugin;
};

type InitialState = {
  loading: boolean;
  reviews: Review[];
  submitting?: boolean;
  totalCount: number;
};

export const PluginReviewList: FC<PluginReviewListProps> = ({
  plugin,
  onInstall,
  isInstalled,
}) => {
  const initialState: InitialState = {
    loading: true,
    reviews: [],
    totalCount: 0,
  };
  const [state, setState] = useState(initialState);
  const { loading, reviews, submitting } = state;
  const { address, connect, isConnected } = useApp();
  const [form] = Form.useForm<ReviewForm>();
  const { id } = plugin;
  const colors = useTheme();

  const fetchReviews = useCallback(
    (skip: number) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getPluginReviews(id, skip)
        .then(({ reviews, totalCount }) => {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            reviews,
            totalCount,
          }));
        })
        .catch(() => {
          setState((prevState) => ({ ...prevState, loading: false }));
        });
    },
    [id]
  );

  const onFinishSuccess: FormProps<ReviewForm>["onFinish"] = (values) => {
    if (address) {
      setState((prevState) => ({ ...prevState, submitting: true }));

      addPluginReview(id, { ...values, address })
        .then(() => {
          setState((prevState) => ({ ...prevState, submitting: false }));

          form.resetFields();

          fetchReviews(0);
        })
        .catch(() => {
          setState((prevState) => ({ ...prevState, submitting: false }));
        });
    }
  };

  const onFinishFailed: FormProps<ReviewForm>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => fetchReviews(0), [id, fetchReviews]);

  return (
    <VStack $style={{ gap: "16px" }}>
      <Form
        autoComplete="off"
        form={form}
        layout="vertical"
        onFinish={onFinishSuccess}
        onFinishFailed={onFinishFailed}
      >
        <VStack
          $style={{
            border: `solid 1px ${colors.borderLight.toHex()}`,
            borderRadius: "12px",
            gap: "24px",
            height: "100%",
            padding: "16px",
          }}
        >
          <HStack
            $style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack
              as="span"
              $style={{
                fontSize: "18px",
                fontWeight: "500",
                lineHeight: "28px",
              }}
            >
              Leave a review
            </Stack>

            <ConfigProvider theme={{ components: { Rate: { starSize: 24 } } }}>
              <Form.Item<ReviewForm>
                name="rating"
                rules={[{ required: true }]}
                noStyle
              >
                <Rate character={<StarIcon />} count={5} />
              </Form.Item>
            </ConfigProvider>
          </HStack>
          <Form.Item<ReviewForm>
            name="comment"
            rules={[{ required: true }]}
            noStyle
          >
            <Input.TextArea
              rows={4}
              placeholder={
                isConnected
                  ? isInstalled
                    ? "Write a review"
                    : "Install the plugin to leave a review"
                  : "Connect your wallet to leave a review"
              }
            />
          </Form.Item>
          <Stack $style={{ justifyContent: "end" }}>
            {isConnected ? (
              isInstalled ? (
                <Button kind="primary" loading={submitting} type="submit">
                  Leave a review
                </Button>
              ) : (
                <Button kind="primary" onClick={onInstall}>
                  Install
                </Button>
              )
            ) : (
              <Button kind="primary" onClick={connect}>
                Connect
              </Button>
            )}
          </Stack>
        </VStack>
      </Form>
      <VStack
        $style={{
          border: `solid 1px ${colors.borderLight.toHex()}`,
          borderRadius: "12px",
          gap: "24px",
          height: "100%",
          padding: "16px",
        }}
      >
        <Stack
          as="span"
          $style={{ fontSize: "18px", fontWeight: "500", lineHeight: "28px" }}
        >
          Rating Overview
        </Stack>
        <VStack $style={{ alignItems: "center", gap: "8px" }}>
          <Stack
            as="span"
            $style={{
              fontSize: "28px",
              fontWeight: "500",
              lineHeight: "34px",
            }}
          >
            {plugin.rating.rate}
          </Stack>
          <VStack $style={{ alignItems: "center", gap: "4px" }}>
            <ConfigProvider theme={{ components: { Rate: { starSize: 16 } } }}>
              <Rate count={5} value={plugin.rating.rate} allowHalf disabled />
            </ConfigProvider>
            <Stack
              as="span"
              $style={{
                fontSize: "12px",
                fontWeight: "500",
                lineHeight: "16px",
              }}
            >
              {`${plugin.rating.count} Reviews`}
            </Stack>
          </VStack>
        </VStack>
        <VStack $style={{ gap: "12px" }}>
          {plugin.ratings
            .sort((a, b) => b.rating - a.rating)
            .map(({ count, rating }) => (
              <HStack
                key={rating}
                $style={{ alignItems: "center", gap: "8px" }}
              >
                <Stack
                  as="span"
                  $style={{ fontSize: "14px", lineHeight: "16px" }}
                >
                  {rating}
                </Stack>
                <Stack
                  as="span"
                  $before={{
                    backgroundColor: colors.warning.toHex(),
                    height: "100%",
                    position: "absolute",
                    width: `${(count * 100) / plugin.rating.count}%`,
                  }}
                  $style={{
                    backgroundColor: colors.bgTertiary.toHex(),
                    borderRadius: "2px",
                    height: "8px",
                    overflow: "hidden",
                    position: "relative",
                    width: "100%",
                  }}
                />
              </HStack>
            ))}
        </VStack>
      </VStack>
      {loading ? (
        <Spin />
      ) : reviews.length ? (
        <>
          {reviews.map(({ address, comment, createdAt, id, rating }) => (
            <VStack
              key={id}
              $style={{
                border: `solid 1px ${colors.borderLight.toHex()}`,
                borderRadius: "12px",
                gap: "12px",
                height: "100%",
                padding: "16px",
              }}
            >
              <HStack
                $style={{
                  alignItems: "center",
                  fontSize: "16px",
                  gap: "12px",
                  justifyContent: "space-between",
                  lineHeight: "24px",
                }}
              >
                <HStack $style={{ gap: "12px" }}>
                  <MiddleTruncate text={address} width="110px" />
                  <Stack
                    as="span"
                    $style={{ color: colors.textTertiary.toHex() }}
                  >
                    {dayjs(createdAt).format("MM/DD/YYYY")}
                  </Stack>
                </HStack>
                <Rate count={5} value={rating} disabled />
              </HStack>
              <Stack
                $style={{
                  color: colors.textSecondary.toHex(),
                  fontSize: "16px",
                  lineHeight: "24px",
                }}
              >
                {comment}
              </Stack>
            </VStack>
          ))}
        </>
      ) : (
        <Empty />
      )}
    </VStack>
  );
};
