# SEO & Meta Tags Implementation

## Summary

This implementation improves Open Graph, Twitter/X card, and SEO meta tags across the Vultisig App Store marketplace to ensure correct social media previews, better search engine discoverability, and higher click-through rates.

## Changes Made

### 1. Dependencies
- **Installed**: `react-helmet-async` - For dynamic meta tag management in React

### 2. New Components

#### SEO Component (`src/components/SEO.tsx`)
A reusable component that handles all meta tags including:
- Basic SEO tags (title, description, keywords, author)
- Open Graph meta tags for Facebook and other platforms
- Twitter Card meta tags for Twitter/X
- Image dimensions and properties
- Canonical URLs
- Mobile app capabilities
- Robots directives (noindex option)

**Features**:
- Sensible defaults for the entire site
- Per-page customization
- Support for different content types (website, article, product)
- Twitter card type selection
- Structured image metadata

### 3. Updated Files

#### `index.html`
Enhanced base meta tags with:
- Improved title and description
- Comprehensive keywords
- Full Open Graph implementation with image dimensions
- Complete Twitter Card setup
- Theme color for mobile browsers
- Canonical URL
- Format detection settings

#### `src/App.tsx`
- Wrapped the entire app with `HelmetProvider` to enable react-helmet-async

#### Page-Level SEO Implementation

**Main Page** (`src/pages/Main.tsx`):
- Title: "Discover Apps"
- Focused on app discovery and browsing
- Keywords: crypto apps, DeFi apps, automation

**App Detail Page** (`src/pages/App.tsx`):
- Dynamic title based on app name
- Dynamic description from app data
- Dynamic image from app thumbnail/logo
- Type set to "product"
- Custom keywords including app name and audit status

**FAQ Page** (`src/pages/FAQ.tsx`):
- Title: "FAQ - Frequently Asked Questions"
- Description focuses on help and support content
- Keywords related to support and help

**My Apps Page** (`src/pages/MyApps.tsx`):
- Title: "My Apps - Installed Applications"
- Set to `noindex` (user-specific page, shouldn't be indexed)

**Billing Page** (`src/pages/Billing.tsx`):
- Title: "Billing - Payment & Subscription Management"
- Set to `noindex` (user-specific financial data)

**Transactions Page** (`src/pages/Transactions.tsx`):
- Title: "Transaction History"
- Set to `noindex` (user-specific transaction data)

## SEO Best Practices Implemented

### 1. Title Tags
- Unique titles for each page
- Brand name included in format: "Page Title | Vultisig App Store"
- Under 60 characters for optimal display in search results

### 2. Meta Descriptions
- Unique, compelling descriptions for each page
- 150-160 characters for optimal display
- Include relevant keywords naturally
- Call-to-action oriented

### 3. Open Graph Tags
- Complete og: tag implementation
- Image dimensions specified (1200x630px)
- Image alt text for accessibility
- Locale specification
- Type specification (website/product)

### 4. Twitter Cards
- Using `summary_large_image` for better visibility
- Complete twitter: tag implementation
- Consistent with Open Graph data
- Image alt text included

### 5. Canonical URLs
- Proper canonical URL for each page
- Prevents duplicate content issues

### 6. Privacy-Aware Indexing
- User-specific pages (My Apps, Billing, Transactions) set to `noindex`
- Prevents indexing of private user data

### 7. Keywords
- Relevant, specific keywords for each page
- Natural language, not keyword stuffing
- Focus on user intent and search queries

## Testing Recommendations

### Social Media Preview Testing
1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

### SEO Testing
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Google Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
3. **PageSpeed Insights**: https://pagespeed.web.dev/

### Testing Steps
1. Deploy changes to production/staging
2. Test each URL in social media validators
3. Share test links on social platforms to verify preview cards
4. Check search console for proper indexing

## Expected Benefits

1. **Better Social Sharing**: Rich previews with images on Facebook, Twitter, LinkedIn
2. **Improved CTR**: More compelling titles and descriptions in search results
3. **Brand Consistency**: Unified branding across all social platforms
4. **Better Discoverability**: Proper keywords and descriptions for search engines
5. **User Privacy**: User-specific pages properly excluded from search indexing
6. **Dynamic Content**: App detail pages show relevant app information in previews

## Maintenance

- Update default values in `src/components/SEO.tsx` if branding changes
- Add SEO component to new pages as they're created
- Review and update keywords quarterly based on search analytics
- Monitor social media preview performance
- Keep descriptions fresh and relevant

## Banner Image Requirements

For optimal social media previews, ensure:
- Image at `/public/images/banner.jpg` exists
- Dimensions: 1200x630px (minimum)
- Format: JPEG or PNG
- File size: Under 5MB
- High quality, represents the brand well
