import { Collapse } from "antd";
import { Fragment } from "react";

import { SEO } from "@/components/SEO";
import { Divider } from "@/toolkits/Divider";
import { Stack, VStack } from "@/toolkits/Stack";

const data = [
  {
    heading: "General",
    items: [
      {
        answer: `
          <p>The Vultisig App Store is a marketplace for self-custodial automation. It gives users the option to easily install apps and automate their digital asset holdings without transferring custody or unilaterally granting access to their funds.</p>
          <p>Users decide how much access to grant and which processes to automate.</p>
        `,
        question: "What is the Vultisig App store?",
      },
      {
        answer: `
          <p>It leverages MPC technology, which is already used in Vultisig apps, to provide the highest level of self-custodial security.</p>
          <p>Users can install apps and delegate access to them. Each app consists of a proposing side and a validating side, ensuring that each transaction is validated against the user's set rules.</p>
          <p>These rules can be deleted or changed, ensuring that no transaction is sent without pre-existing approval and giving users complete control over their installed apps and automations.</p>
          <br />
          <p>Read more in our <a href="https://docs.vultisig.com/vultisig-ecosystem/marketplace" target="_blank" rel="noopener noreferrer">documentation</a></p>
        `,
        question: "How does it work?",
      },
      {
        answer: `
          <p>Self-custodial automation was not technologically possible until now. Thanks to Vultisig MPC technology, you can now securely delegate and automate specific parts of your wallet without risking your seed phrase or giving up custody.</p>
          <p>Vultisig Apps enable the world's first self-custodial automation.</p>
        `,
        question: "Why is it unique?",
      },
      {
        answer:
          "Vultisig apps are considered safe because the developers are known to the Vultisig team, and the apps undergo a rigorous review process to ensure they function properly. An installed app can never access or move funds without the user's prior authorization, as the App Store's well-thought-out proposal/verification structure always ensures that only authorized user actions are fulfilled. Though some apps and agents will have greater access to the wallet, thereby increasing the app's risk level, apps will have a risk level assigned to ensure users are always aware of their funds' access.",
        question: "How safe is it?",
      },
    ],
  },
  {
    heading: "Developers",
    items: [
      {
        answer:
          "Apps are programs that enable self-custodial automation and expand the functionality of your Vultisig wallet. They can be written in any programming language and directly integrate with the Vultisig Ecosystem.",
        question: "What are Apps?",
      },
      {
        answer: `To create one please follow the documentation <a href="https://docs.vultisig.com/developer-docs/app-store/ai-agents" target="_blank" rel="noopener noreferrer">here</a>.`,
        question: "How can I create one?",
      },
      {
        answer: `
          <p>Apps can be monetized in different ways, including on-time payment or recurring payments, such as subscriptions.</p>
          <p>For more information, please refer to the latest monetization option <a href="https://docs.vultisig.com/developer-docs/app-store/infrastructure-overview/revenue" target="_blank" rel="noopener noreferrer">documentation</a>.</p>
        `,
        question: "Can I monetize my app?",
      },
      {
        answer:
          "Listing an app incurs only a small developer and app verification fee in $VULT, which will be burned to ensure that real, dedicated developers are building apps in the Vultisig App Store. Furthermore, developers must run their apps on dedicated servers that they must host.",
        question: "What are the costs and requirements?",
      },
    ],
  },
];

export const FaqPage = () => {
  return (
    <VStack $style={{ alignItems: "center", flexGrow: "1" }}>
      <SEO
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about Vultisig App Store, self-custodial automation, app security, and developer resources."
        url="/faq"
        keywords="vultisig faq, app store help, crypto automation help, self-custodial automation, vultisig support"
      />
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
          FAQ
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
                    items={[
                      {
                        key: "1",
                        label: question,
                        children: (
                          <Stack dangerouslySetInnerHTML={{ __html: answer }} />
                        ),
                      },
                    ]}
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
