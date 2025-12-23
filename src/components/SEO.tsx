import { FC } from "react";
import { Helmet } from "react-helmet-async";

export type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  keywords?: string;
  author?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterSite?: string;
  twitterCreator?: string;
  noindex?: boolean;
  canonical?: string;
};

const defaultValues = {
  siteName: "Vultisig App Store",
  defaultTitle: "Vultisig App Store - Secure Crypto Apps & Automations",
  defaultDescription:
    "Discover and install secure cryptocurrency applications and automations for your Vultisig wallet. Access recurring swaps, automated sends, and more powerful crypto tools.",
  defaultImage: "https://store.vultisigplugin.app/images/banner.jpg",
  baseUrl: "https://store.vultisigplugin.app",
  twitterHandle: "@vultisig",
  defaultKeywords:
    "vultisig, crypto wallet, cryptocurrency, blockchain apps, crypto automation, recurring swaps, automated sends, web3, DeFi, bitcoin, ethereum",
};

export const SEO: FC<SEOProps> = ({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  author = "Vultisig",
  twitterCard = "summary_large_image",
  twitterSite = defaultValues.twitterHandle,
  twitterCreator = defaultValues.twitterHandle,
  noindex = false,
  canonical,
}) => {
  const pageTitle = title
    ? `${title} | ${defaultValues.siteName}`
    : defaultValues.defaultTitle;
  const pageDescription = description || defaultValues.defaultDescription;
  const pageImage = image || defaultValues.defaultImage;
  const pageUrl = url
    ? `${defaultValues.baseUrl}${url}`
    : defaultValues.baseUrl;
  const pageKeywords = keywords || defaultValues.defaultKeywords;
  const canonicalUrl = canonical || pageUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={defaultValues.siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Open Graph Image Properties */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:alt" content={pageTitle} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* Additional SEO Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={defaultValues.siteName} />
    </Helmet>
  );
};
