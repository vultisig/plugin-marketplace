import { Form, FormProps, Input, Modal } from "antd";
import dayjs from "dayjs";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "styled-components";

import { MiddleTruncate } from "@/components/MiddleTruncate";
import { useApp } from "@/hooks/useApp";
import { useGoBack } from "@/hooks/useGoBack";
import { StarIcon } from "@/icons/StarIcon";
import { Button } from "@/toolkits/Button";
import { Divider } from "@/toolkits/Divider";
import { Rate } from "@/toolkits/Rate";
import { Spin } from "@/toolkits/Spin";
import { HStack, Stack, VStack } from "@/toolkits/Stack";
import { modalHash } from "@/utils/constants/core";
import { addReview, getReviews } from "@/utils/services/marketplace";
import { App, Review, ReviewForm } from "@/utils/types";

type ReviewListProps = {
  isInstalled?: boolean;
  onInstall: () => void;
  plugin: App;
};

type InitialState = {
  loading: boolean;
  reviews: Review[];
  submitting?: boolean;
  totalCount: number;
  visible?: boolean;
};

export const ReviewList: FC<ReviewListProps> = ({
  plugin,
  onInstall,
  isInstalled,
}) => {
  const [state, setState] = useState<InitialState>({
    loading: true,
    reviews: [],
    totalCount: 0,
  });
  const { loading, reviews, submitting, visible } = state;
  const { address, connect, isConnected } = useApp();
  const { hash } = useLocation();
  const [form] = Form.useForm<ReviewForm>();
  const goBack = useGoBack();
  const colors = useTheme();

  const sortedRatings = useMemo(
    () => [...plugin.ratings].sort((a, b) => b.rating - a.rating),
    [plugin.ratings]
  );

  const fetchReviews = useCallback(
    (skip: number) => {
      setState((prevState) => ({ ...prevState, loading: true }));

      getReviews(plugin.id, { skip })
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
    [plugin.id]
  );

  const onFinishSuccess: FormProps<ReviewForm>["onFinish"] = (values) => {
    if (address) {
      setState((prevState) => ({ ...prevState, submitting: true }));

      addReview(plugin.id, { ...values, address })
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

  useEffect(() => fetchReviews(0), [plugin.id, fetchReviews]);

  useEffect(
    () =>
      setState((prevState) => ({
        ...prevState,
        visible: hash === modalHash.review,
      })),
    [hash]
  );

  return (
    <>
      <VStack id="reviews" $style={{ gap: "32px" }}>
        <VStack $style={{ gap: "12px" }}>
          <Stack as="span" $style={{ fontSize: "18px", lineHeight: "28px" }}>
            Reviews
          </Stack>
          <HStack
            $style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <HStack $style={{ alignItems: "center", gap: "12px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "60px", lineHeight: "72px" }}
              >
                {plugin.rating.rate}
              </Stack>
              <VStack $style={{ gap: "4px" }}>
                <Rate count={5} value={plugin.rating.rate} allowHalf disabled />
                <Stack
                  as="span"
                  $style={{ fontSize: "16px", lineHeight: "24px" }}
                >
                  {`${plugin.rating.count} Reviews`}
                </Stack>
              </VStack>
            </HStack>
            {isConnected ? (
              isInstalled ? (
                <Button href={modalHash.review} kind="primary">
                  Write a review
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
          </HStack>
          <HStack $style={{ gap: "24px" }}>
            <VStack $style={{ flex: "none", gap: "12px" }}>
              {sortedRatings.map(({ rating }) => (
                <HStack
                  key={rating}
                  $style={{
                    color: colors.warning.toHex(),
                    fontSize: "16px",
                    gap: "2px",
                    justifyContent: "end",
                  }}
                >
                  {Array.from({ length: rating }, (_, i) => (
                    <StarIcon key={i} fill="currentColor" />
                  ))}
                </HStack>
              ))}
            </VStack>
            <VStack $style={{ flexGrow: "1", gap: "12px" }}>
              {sortedRatings.map(({ count, rating }) => (
                <Stack
                  key={rating}
                  $before={{
                    backgroundColor: colors.warning.toHex(),
                    borderRadius: "4px",
                    height: "100%",
                    position: "absolute",
                    width: `${
                      plugin.rating.count
                        ? (count * 100) / plugin.rating.count
                        : 0
                    }%`,
                  }}
                  $style={{
                    backgroundColor: colors.bgTertiary.toHex(),
                    borderRadius: "4px",
                    height: "8px",
                    margin: "4px 0",
                    overflow: "hidden",
                    position: "relative",
                  }}
                />
              ))}
            </VStack>
            <VStack $style={{ flex: "none", gap: "12px" }}>
              {sortedRatings.map(({ count, rating }) => (
                <Stack
                  as="span"
                  key={rating}
                  $style={{ fontSize: "14px", lineHeight: "16px" }}
                >
                  {count}
                </Stack>
              ))}
            </VStack>
          </HStack>
        </VStack>
        <Divider />
        {loading ? (
          <Spin centered />
        ) : (
          reviews.length > 0 && (
            <>
              {reviews.map(({ address, comment, createdAt, id, rating }) => (
                <VStack
                  key={id}
                  $style={{
                    backgroundColor: colors.bgSecondary.toHex(),
                    borderRadius: "12px",
                    gap: "12px",
                    height: "100%",
                    padding: "16px",
                  }}
                >
                  <HStack
                    $style={{ gap: "12px", justifyContent: "space-between" }}
                  >
                    <HStack $style={{ alignItems: "center", gap: "8px" }}>
                      <MiddleTruncate
                        $style={{
                          color: colors.textTertiary.toHex(),
                          fontSize: "14px",
                          lineHeight: "20px",
                          width: "110px",
                        }}
                      >
                        {address}
                      </MiddleTruncate>
                      <Stack
                        as="span"
                        $style={{
                          color: colors.textTertiary.toHex(),
                          fontSize: "14px",
                          lineHeight: "20px",
                        }}
                      >
                        |
                      </Stack>
                      <Stack
                        as="span"
                        $style={{
                          color: colors.textTertiary.toHex(),
                          fontSize: "14px",
                          lineHeight: "20px",
                        }}
                      >
                        {dayjs(createdAt).format("DD MMMM YYYY")}
                      </Stack>
                    </HStack>
                    <Rate count={5} value={rating} disabled />
                  </HStack>
                  <Stack
                    $style={{
                      color: colors.textSecondary.toHex(),
                      fontSize: "14px",
                      lineHeight: "20px",
                    }}
                  >
                    {comment}
                  </Stack>
                </VStack>
              ))}
            </>
          )
        )}
      </VStack>
      <Modal
        centered={true}
        footer={
          <Button kind="primary" loading={submitting} onClick={form.submit}>
            Post review
          </Button>
        }
        maskClosable={false}
        onCancel={() => goBack()}
        open={visible}
        styles={{
          body: {
            backgroundColor: colors.bgSecondary.toHex(),
            borderRadius: 12,
            padding: 24,
          },
          content: { display: "flex", flexDirection: "column", gap: "20px" },
          footer: { display: "flex", justifyContent: "center", margin: 0 },
          header: { margin: 0 },
        }}
        title="Write review"
        width={768}
      >
        <Form
          autoComplete="off"
          form={form}
          layout="vertical"
          onFinish={onFinishSuccess}
          onFinishFailed={onFinishFailed}
        >
          <VStack $style={{ gap: "16px" }}>
            <VStack $style={{ alignItems: "start", gap: "8px" }}>
              <Stack
                as="span"
                $style={{
                  fontSize: "12px",
                  lineHeight: "16px",
                }}
              >
                Rating
              </Stack>
              <Form.Item<ReviewForm>
                name="rating"
                rules={[{ required: true }]}
                noStyle
              >
                <Stack
                  as={Rate}
                  count={5}
                  $style={{
                    backgroundColor: colors.bgPrimary.toHex(),
                    borderRadius: "16px",
                    padding: "6px 12px 4px",
                  }}
                />
              </Form.Item>
            </VStack>
            <VStack $style={{ gap: "8px" }}>
              <Stack
                as="span"
                $style={{
                  fontSize: "12px",
                  lineHeight: "16px",
                }}
              >
                Write your review
              </Stack>
              <Form.Item<ReviewForm>
                name="comment"
                rules={[{ required: true }]}
                noStyle
              >
                <Input.TextArea
                  rows={4}
                  placeholder="How do you feel about this app? "
                />
              </Form.Item>
            </VStack>
          </VStack>
        </Form>
      </Modal>
    </>
  );
};
