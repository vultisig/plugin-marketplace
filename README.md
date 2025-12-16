# Vultisig Plugin Marketplace

<p align="center">
  <img src="public/images/banner.jpg" alt="Vultisig Logo"/>
</p>

<p align="center">
  <strong>A decentralized marketplace for Vultisig plugins, automations, and integrations</strong>
</p>

<p align="center">
  <!-- Add your badges here -->
  <a href="#"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status"/></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/></a>
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node Version"/></a>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
---

## 🌟 Overview

The **Vultisig Plugin Marketplace** is a modern web application built with React, TypeScript, and Vite that serves as the central hub for discovering, installing, and managing Vultisig vault plugins and automations. 

This marketplace enables users to:
- Browse and search through available plugins and automations
- Install plugins directly to their Vultisig vault via browser extension
- Manage subscriptions and billing for premium features
- Create custom automation recipes
- Access detailed documentation and FAQs of each plugin

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Fast HMR, optimized builds)
- **UI Library**: Ant Design (antd) with custom theming
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router v6
- **Styling**: CSS Modules + Ant Design components
- **Protocol Buffers**: Generated TypeScript types for blockchain policies
- **WebAssembly**: Integration with wallet-core for cryptographic operations
- **Extension Integration**: Browser extension communication via postMessage API

---

## ✨ Features

### Core Features
- **Plugin Discovery**: Browse curated plugins with detailed descriptions, ratings, and compatibility info
- **One-Click Installation**: Seamless installation via Vultisig browser extension
- **Recipe Builder**: Create custom automation workflows using visual policy builders
- **Subscription Management**: Flexible billing with trial periods and plan upgrades

### User Experience
- **Responsive Design**: Mobile-first UI that works on all devices
- **Dark Mode Support**: Comfortable viewing in any lighting condition
- **Secure Authentication**: Integration with Vultisig vault for identity verification

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vultisig Marketplace                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │  React Query │  │  Extension   │     │
│  │  Components  │◄─┤   (Cache)    │◄─┤    Bridge    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Ant Design  │  │  API Client  │  │   WebAssembly│     │
│  │    Theme     │  │   (Fetch)    │  │  wallet-core │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Backend API       │
                 │  (Plugin Registry)  │
                 └─────────────────────┘
```

### Key Components

#### Frontend Layers
1. **Presentation Layer** (`src/pages/`, `src/components/`)
   - Page-level components and routing
   - Reusable UI components
   - Layout and navigation structure

2. **Business Logic Layer** (`src/utils/`, `src/providers/`)
   - API communication and data fetching
   - Extension integration logic
   - Policy/recipe serialization with Protocol Buffers

3. **State Management**
   - React Query for server state (caching, refetching)
   - React Context for global app state
   - Local state with useState/useReducer

#### Integration Points
- **Browser Extension**: Communication via `window.postMessage` (see `src/utils/extension.ts`)
- **WebAssembly**: Wallet operations via `wallet-core.wasm` (loaded in `src/main.tsx`)
- **API Backend**: RESTful endpoints for plugins, billing, and user data

---

## 📋 Prerequisites

### Required
- **Node.js**: v18 or higher (see `.nvmrc` for exact version)
- **Package Manager**: npm, yarn, or pnpm
- **Git**: For version control
- **Vultisig Extension**: Browser extension must be installed for full functionality

### Recommended
- **VS Code**: With ESLint and Prettier extensions
- **nvm**: For Node version management
- **Docker**: For consistent development environments (optional)
---

## 🚀 Getting Started

### Quick Start 

```bash
# 1. Clone the repository
git clone https://github.com/vultisig/plugin-marketplace.git
cd plugin-marketplace

# 2. Use correct Node version (if using nvm)
nvm use

# 3. Install dependencies
npm ci

# 4. Copy environment variables
cp .env.example .env
# edit .env as needed


#### Step 6: Build for Production
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
plugin-marketplace/
├── .github/                    # GitHub Actions and templates
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                     # Static assets
│   ├── vultisig-logo.svg
│   └── favicon.ico
├── proto/                      # Protocol Buffer definitions
│   ├── policy.proto
│   └── recipe.proto
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component with routing
│   ├── components/            # Reusable UI components
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── PluginCard/
│   │   └── RecipeBuilder/
│   ├── pages/                 # Route-level page components
│   │   ├── Home/              # Landing page
│   │   ├── Apps/              # Plugin marketplace
│   │   ├── MyApps/            # User's installed plugins
│   │   ├── Billing/           # Subscription management
│   │   └── FAQ/               # Help and documentation
│   ├── providers/             # React context providers
│   │   ├── CoreProvider.tsx   # Core app state
│   │   ├── QueryProvider.tsx  # React Query setup
│   │   └── ThemeProvider.tsx  # Ant Design theme
│   ├── utils/                 # Utility functions and helpers
│   │   ├── api.ts             # API client and endpoints
│   │   ├── extension.ts       # Extension communication
│   │   ├── policy.ts          # Policy serialization
│   │   └── constants.ts       # App-wide constants
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── styles/                # Global styles and themes
├── .env.example               # Example environment variables
├── .nvmrc                     # Node version specification
├── eslint.config.js           # ESLint configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.app.json          # App-specific TS config
├── tsconfig.node.json         # Node-specific TS config
├── vite.config.ts             # Vite build configuration
├── vercel.json                # Vercel deployment config
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

### Key Files Explained

#### Entry Points
- **`src/main.tsx`**: Application bootstrap, provider setup, and wasm loading
- **`src/App.tsx`**: Root component with React Router configuration
- **`index.html`**: HTML template with meta tags and initial loading state

#### Configuration Files
- **`vite.config.ts`**: Vite build settings, plugins, and optimization ([view file](vite.config.ts))
- **`eslint.config.js`**: Linting rules for code quality ([view file](eslint.config.js))
- **`tsconfig.*.json`**: TypeScript compiler options for different contexts
- **`vercel.json`**: Deployment configuration for Vercel platform ([view file](vercel.json))

#### Important Modules
- **`src/utils/extension.ts`**: Browser extension communication layer
- **`src/utils/api.ts`**: Centralized API client with error handling
- **`src/providers/CoreProvider.tsx`**: Global state management
- **`src/components/RecipeBuilder/`**: Visual automation workflow editor

---

### Development Workflow

#### 1. Create a Feature Branch
```bash
git checkout -b feature/plugin-rating-system
```

#### 2. Make Changes
- Edit files in `src/`
- Vite will auto-reload changes via HMR
- Check browser console for errors

#### 3. Lint and Format
```bash
npm run lint:fix
npm run format
```

#### 4. Type Check
```bash
npm run type-check
```

#### 5. Test Your Changes
```bash
npm run test
```

#### 6. Build Locally
```bash
npm run build
npm run preview
```

#### 7. Commit with Conventional Commits
```bash
git add .
git commit -m "feat(plugins): add rating system with star component"
```

#### 8. Push and Create PR
```bash
git push origin feature/plugin-rating-system
```