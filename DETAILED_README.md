# FinanceDash - Personal Finance Dashboard

A modern, responsive personal finance dashboard application built with Next.js 14, React, TypeScript, and Tailwind CSS. Manage your spending across categories, track transactions, and upload receipts for automatic categorization.

## 🎯 Features

### Dashboard
- **Financial Overview**: Key metrics including total budget, spent amount, remaining balance, and spending rate
- **Spending Trends**: Line and bar charts showing spending patterns over time
- **Category Breakdown**: Pie chart visualization of spending by category
- **Recent Transactions**: Quick view of latest transactions with ability to view all
- **Budget Alerts**: Visual warnings when approaching budget limits

### Transactions
- **Complete Transaction History**: View all transactions with detailed information
- **Advanced Filtering**: Filter by category, date range, and amount
- **Search**: Search transactions by merchant or description
- **Delete Transactions**: Remove transactions from your history

### Categories
- **Category Management**: View all spending categories with detailed breakdowns
- **Budget Tracking**: Set and monitor budget limits per category
- **Progress Visualization**: Progress bars showing budget usage
- **Category Editing**: Update budget limits and preferences
- **Over-Budget Alerts**: Visual indicators for categories exceeding limits

### Receipt Upload
- **Drag-and-Drop Interface**: Intuitive file upload for receipts
- **OCR Processing**: Automatic extraction of receipt data (merchant, amount, date)
- **Editable Results**: Review and modify OCR results before saving
- **Category Suggestion**: Automatic category suggestion based on receipt data
- **Transaction Creation**: One-click transaction creation from receipts

### Settings
- **Account Management**: Update profile information
- **Budget Configuration**: Set monthly budget and currency preferences
- **Notification Preferences**: Control notification and alert settings
- **Account Security**: Theme and privacy preferences

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn/ui (component patterns)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useContext)
- **Form Handling**: React Hook Form with Zod validation
- **File Upload**: React Dropzone
- **Animations**: CSS transitions and Tailwind animations

## 📁 Project Structure

```
personal-finance/
├── app/                          # App Router pages
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Dashboard (home page)
│   ├── globals.css              # Global styles
│   ├── transactions/
│   │   └── page.tsx             # Transactions page
│   ├── categories/
│   │   └── page.tsx             # Categories page
│   ├── upload/
│   │   └── page.tsx             # Receipt upload page
│   └── settings/
│       └── page.tsx             # Settings page
├── components/
│   ├── layout/                  # Layout components
│   │   ├── Sidebar.tsx          # Desktop sidebar navigation
│   │   ├── Header.tsx           # Header with search
│   │   └── MobileNav.tsx        # Mobile bottom navigation
│   ├── dashboard/               # Dashboard components
│   │   ├── SummaryCard.tsx      # Financial summary cards
│   │   ├── SpendingChart.tsx    # Trend chart
│   │   ├── CategoryChart.tsx    # Category breakdown
│   │   └── RecentTransactions.tsx # Recent transactions list
│   ├── transactions/            # Transaction components
│   │   ├── TransactionList.tsx  # Transaction table
│   │   └── FilterPanel.tsx      # Filter options
│   ├── categories/              # Category components
│   │   ├── CategoryCard.tsx     # Category card display
│   │   └── EditCategoryModal.tsx # Category editor modal
│   └── upload/                  # Upload components
│       ├── DropZone.tsx         # Drag-and-drop upload
│       ├── ReceiptPreview.tsx   # Receipt preview
│       └── OCRResults.tsx       # OCR data editor
├── lib/
│   ├── api.ts                   # API integration layer
│   ├── types.ts                 # TypeScript interfaces
│   ├── mock-data.ts             # Sample data
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind config
├── next.config.ts               # Next.js config
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Navigate to project directory**:
```bash
cd personal-finance
```

2. **Install dependencies**:
```bash
npm install
```

3. **Run development server**:
```bash
npm run dev
```

4. **Open in browser**:
Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## 📊 Mock Data

The application includes comprehensive mock data with:
- **25+ Transactions**: Diverse transactions across all categories
- **10 Categories**: Groceries, Rent, Utilities, Transportation, Entertainment, Dining, Shopping, Healthcare, Subscriptions, Other
- **Realistic Budget Data**: Monthly budget of $5,400 with category-specific limits
- **Sample Spending Patterns**: Transactions distributed across the month

All mock data is located in `/lib/mock-data.ts` and can be easily customized.

## 🔌 API Integration

The application is structured for easy integration with a FastAPI backend. All API calls are centralized in `/lib/api.ts`:

### Available Endpoints

```typescript
// Transactions
GET /api/transactions           // Fetch all transactions (with optional filters)
POST /api/transactions          // Create new transaction
DELETE /api/transactions/{id}   // Delete transaction

// Categories
GET /api/categories             // Fetch all categories
PUT /api/categories/{id}        // Update category budget

// Budget
GET /api/budget-summary         // Fetch budget summary

// Receipts
POST /api/upload-receipt        // Upload receipt (multipart/form-data)
  // Backend should perform OCR and return:
  // {
  //   merchant: string,
  //   amount: number,
  //   date: string,
  //   items: [{name: string, price: number}],
  //   suggestedCategory: string
  // }
```

### Current Implementation

Currently, the API functions return mock data with simulated delays (500ms default, 1500ms for OCR). To connect to a real backend:

1. Replace the mock data returns in `/lib/api.ts` with actual `fetch` calls
2. Update the API endpoints to match your backend URLs
3. Add error handling for network failures
4. Implement proper authentication if needed

Example implementation:
```typescript
export async function fetchTransactions(filters?: FilterOptions): Promise<Transaction[]> {
  const response = await fetch('/api/transactions', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    // Add query params for filters
  });
  return response.json();
}
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue/Indigo (#3B82F6, #6366F1) - Trust and professionalism
- **Success**: Green (#10B981) - Positive financial metrics
- **Warning**: Amber (#F59E0B) - Budget approaching limits
- **Danger**: Red (#EF4444) - Overspending warnings
- **Neutral**: Gray scale - Backgrounds and text

### Responsive Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md-lg)
- **Desktop**: > 1024px (lg+)

### Layout Features
- **Desktop**: Persistent sidebar navigation, full 3-4 column grid layouts
- **Tablet**: Collapsible sidebar, 2-column grid layouts
- **Mobile**: Full-width stacked layouts, bottom navigation bar

## ⌨️ Keyboard Shortcuts (Future Implementation)

Planned keyboard shortcuts for power users:
- `Cmd/Ctrl + /`: Open command palette
- `Cmd/Ctrl + K`: Quick search
- `Cmd/Ctrl + N`: New transaction
- `Esc`: Close modals/dialogs

## 📝 Component Architecture

### SummaryCard
Flexible card component for displaying financial metrics with optional trend indicators and color coding.

### TransactionList
Reusable list component with delete functionality and loading states.

### FilterPanel
Collapsible filter panel supporting category, amount range, and date filtering.

### CategoryCard
Visual card displaying category information with budget progress and status indicators.

### DropZone
Drag-and-drop file upload component with validation and error handling.

### Charts
Responsive Recharts integrations for trend and category visualization with proper tooltip formatting.

## 🔐 Security Considerations

Before deploying to production:
1. Implement proper authentication and authorization
2. Add CSRF protection
3. Validate all user inputs on backend
4. Implement rate limiting on API endpoints
5. Use HTTPS for all communications
6. Store sensitive data securely
7. Add proper error logging and monitoring
8. Implement data encryption for sensitive fields

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Mobile Optimization

The app is fully responsive with:
- Touch-friendly button sizes (minimum 44x44px)
- Optimized fonts for mobile readability
- Bottom navigation for thumb-friendly access
- Full-width forms and inputs
- Stacked layouts for small screens

## 🚧 Known Limitations

- OCR processing uses mock data (integrate with actual OCR service)
- No real backend authentication
- Transaction data only stored in mock state
- Category budgets reset on page refresh
- No data persistence layer

## 🔮 Future Enhancements

- Real backend integration with FastAPI
- Authentication and user accounts
- Data persistence with database
- Real OCR processing for receipts
- Budget forecasting and analytics
- Transaction export (CSV, PDF)
- Spending insights and recommendations
- Multi-user family budgets
- Bill splitting and shared expenses
- Investment tracking
- Savings goals
- Dark mode toggle
- Multi-language support
- API webhook integrations
- Mobile app (React Native)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Recharts Documentation](https://recharts.org)
- [Lucide Icons](https://lucide.dev)

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email: support@financedash.app

## 🎓 Learning Resources

This project demonstrates:
- Next.js 14 App Router
- TypeScript best practices
- Component composition
- State management with hooks
- Responsive design patterns
- Form handling and validation
- API integration patterns
- Chart and data visualization
- Accessibility considerations
- Modern UI/UX patterns

Perfect for learning modern React and Next.js development!

---

**Last Updated**: February 6, 2026
**Version**: 1.0.0
