import { Collapse } from "antd";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { Divider } from "@/toolkits/Divider";
import { Stack, VStack } from "@/toolkits/Stack";

const text =
  "Maecenas in porttitor consequat aenean. In nulla cursus pulvinar at lacus ultricies et nulla. Non porta arcu vehicula rhoncus. Habitant integer lectus elit proin. Etiam morbi nunc pretium vestibulum sed convallis etiam. Pulvinar vitae porttitor elementum eget mattis sagittis facilisi magna. Et pulvinar pretium vitae odio non ultricies maecenas id. Non nibh scelerisque in facilisis tincidunt viverra fermentum sem. Quam varius pretium vitae neque. Senectus lectus ultricies nibh eget.";

const data = [
  {
    heading: "General",
    items: [
      {
        answer: text,
        question: "How does it work?",
      },
      {
        answer: text,
        question: "How to install?",
      },
      {
        answer: text,
        question: "Is it safe? I don’t want to risk my funds.",
      },
      {
        answer: text,
        question: "Are apps audited?",
      },
    ],
  },
  {
    heading: "Developers",
    items: [
      {
        answer: text,
        question: "How does it work?",
      },
      {
        answer: text,
        question: "How to install?",
      },
      {
        answer: text,
        question: "Is it safe? I don’t want to risk my funds.",
      },
      {
        answer: text,
        question: "Are apps audited?",
      },
    ],
  },
];

export const FaqPage = () => {
  const { t } = useTranslation();

  return (
    <VStack $style={{ alignItems: "center", flexGrow: "1" }}>
      <VStack
        $style={{
          gap: "32px",
          maxWidth: "768px",
          padding: "48px 16px",
          width: "100%",
        }}
      >
        <Stack
          as="span"
          $style={{
            fontSize: "40px",
            justifyContent: "center",
            lineHeight: "42px",
          }}
        >
          {t("faq")}
        </Stack>
        <VStack $style={{ gap: "72px" }}>
          {data.map(({ heading, items }, index) => (
            <VStack key={index} $style={{ gap: "24px" }}>
              <Stack
                as="span"
                $style={{ fontSize: "22px", lineHeight: "24px" }}
              >
                {heading}
              </Stack>
              {items.map(({ answer, question }, index) => (
                <Fragment key={index}>
                  {index > 0 && <Divider light />}
                  <Collapse
                    bordered={false}
                    items={[{ key: "1", label: question, children: answer }]}
                    expandIconPlacement="end"
                    ghost
                  />
                </Fragment>
              ))}
            </VStack>
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
};
