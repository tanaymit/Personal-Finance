# Intelligent Budget Planner

A comprehensive expense tracking and budget management application that helps users take control of their finances. This intelligent solution records transactions, analyzes spending patterns, and provides AI-powered insights to help you manage your money better.

## Features

- **Transaction Recording**: Seamlessly track all your online and offline expenses in one place
- **Receipt OCR**: Upload cash payment receipts and let OCR technology automatically extract transaction details from images
- **AI Assistant**: Get intelligent insights about your spending habits, personalized tips for managing expenditure, and predictions for future spending across categories like Groceries, Entertainment, Shopping, and more
- **Expense Analytics**: Visualize your spending patterns and understand where your money goes
- **Category Management**: Organize expenses by customizable categories for better tracking

## Visual overview

Below are screenshots of the running application (dark theme). They illustrate the main UI and flows you see when using the app.

- Dashboard: at-a-glance cards (Total Budget, Total Spent, Remaining, Spending Rate), a Spending Trend chart, and a Spending by Category chart.
- Categories: a grid of category cards showing budget, spent amount, progress bar and over/under indicators for each category.
- Assistant: a chat-like assistant UI that accepts natural language questions (for example: "how much is my total insurance amount that I paid in December 2025") and replies with concise insights.

### Screenshots

Dashboard

![Categories](./WhatsApp%20Image%202026-02-07%20at%204.21.47%20PM.jpeg)

Assistant (chat)

![Assistant](./WhatsApp%20Image%202026-02-07%20at%204.22.20%20PM.jpeg)

The images above are the screenshots included in the repository root. If they don't display on your platform, open them directly from the project root.

## UI highlights (from screenshots)

- Global dark theme with left navigation and compact header.
- Dashboard has a month/year selector, four stat cards (budget, spent, remaining, rate), and visual charts for trends and category breakdowns.
- Category cards show: title, spent amount, budget amount, remaining, percentage, a colored progress bar, and a small tag indicating category type or state (e.g., "Over").
- Assistant provides contextual, period-aware answers and appears as a chat pane with message bubbles and a text input.
- Receipt upload (OCR) is available from the Upload Receipt page to extract transaction details from photographed receipts.

## Getting Started

### Prerequisites

Make sure you have the following installed on your system:
- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables (if required):
Create a `.env.local` file in the root directory and add necessary environment variables.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Technology Stack

This project is built with:
- [Next.js](https://nextjs.org) - React framework for production
- [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) - Optimized font loading with [Geist](https://vercel.com/font)
- OCR technology for receipt scanning
- AI integration for financial insights

## Learn More

To learn more about Next.js, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.