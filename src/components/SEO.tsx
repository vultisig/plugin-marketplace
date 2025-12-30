import { FC } from "react";
import { Helmet } from "react-helmet-async";

type SEOProps = {
  author?: string;
  canonical?: string;
  description?: string;
  image?: string;
  keywords?: string;
  noindex?: boolean;
  title?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterCreator?: string;
  twitterSite?: string;
  type?: "website" | "article" | "product";
  url?: string;
};

export const SEO: FC<SEOProps> = ({
  author = "Vultisig",
  canonical,
  description,
  image = "https://store.vultisigplugin.app/images/banner.jpg",
  keywords,
  noindex = false,
  title,
  twitterCard = "summary_large_image",
  twitterCreator = "@vultisig",
  twitterSite = "@vultisig",
  type = "website",
  url,
}) => {
  const baseUrl = "https://store.vultisigplugin.app";
  const siteName = "Vultisig App Store";

  const pageDescription =
    description ||
    "Discover and install secure cryptocurrency applications and automations for your Vultisig wallet. Access recurring swaps, automated sends, and more powerful crypto tools.";
  const pageTitle = title
    ? `${title} | ${siteName}`
    : "Vultisig App Store - Secure Crypto Apps & Automations";
  const pageUrl = url ? `${baseUrl}${url}` : baseUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta
        name="keywords"
        content={
          keywords ||
          "vultisig, crypto wallet, cryptocurrency, blockchain apps, crypto automation, recurring swaps, automated sends, web3, DeFi, bitcoin, ethereum"
        }
      />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonical || pageUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={siteName} />
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
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* Additional SEO Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Helmet>
  );
};
