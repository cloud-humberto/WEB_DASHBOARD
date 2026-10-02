# 📈 NovaMetrics - SaaS Financial & Retail Cashflow Analytics (Vue 2 + IndexedDB + Chart.js)

> High-performance Financial Analytics & Cashflow Dashboard built with **Vue 2.7**, **Vuex 3**, **Chart.js 4**, **Offline-First IndexedDB**, and **Live NovaPOS SQLite Synchronization**.

---

## ⚡ 1-Click Launch (Windows)

Launch the dashboard and browser automatically with a single click:

1. **Double-click [`START-DASHBOARD.bat`](./START-DASHBOARD.bat)** in this folder.
   - Automatically detects Node.js.
   - Installs dependencies on the first run (`npm install`).
   - Starts the analytics frontend on port `3002`.
   - Opens your browser automatically to `http://localhost:3002`.

2. **Desktop Shortcut**:
   - Double-click [`CREATE-DESKTOP-SHORTCUT.bat`](./CREATE-DESKTOP-SHORTCUT.bat) to create a **"NovaMetrics Financial Dashboard"** icon directly on your Windows Desktop!

---

## 🔗 Hybrid Architecture: Offline-First + NovaPOS SQLite Bridge

NovaMetrics was designed with an **enterprise hybrid data layer**:

### 1. 🛡️ 100% Standalone & Offline-First (IndexedDB)
- Uses the browser's native **IndexedDB** (`NovaMetricsDB`) for instant zero-setup persistence.
- Automatically seeds 30 days of realistic retail sales history and operational expenses (rent, utilities, payroll, wholesale restock) on the first launch.
- No database server or backend is required for local evaluation or static hosting (e.g. GitHub Pages).

### 2. ⚡ Live NovaPOS SQLite Synchronization (Port 3001)
- Auto-probes the **NovaPOS (`pdv-vue2`)** SQLite Express backend on port `3001`.
- When NovaPOS is online, a green status badge lights up: `● NovaPOS Online (Port 3001)`.
- Clicking **"Sync POS Sales"** pulls new checkout receipts directly from the SQLite database into your financial ledger with zero duplicates.

---

## 🎯 Key Dashboard Features

### 1. 📊 Executive KPI Summary
- **Gross Revenue ($)**: Total inflow with transaction volume counter.
- **Operating Expenses ($)**: Fixed & variable overhead tracking.
- **Net Operating Margin ($ / %)**: Real-time net margin calculation with positive/negative color grading.
- **Average Basket (Ticket Médio)**: Financial average spent per customer checkout.

### 2. 📉 Interactive Chart.js 4 Visualizations
- **Cashflow Evolution Timeline**: Dual smooth cubic-bezier line charts with gradient area fills (Gross Inflow vs Outflow vs Net dotted balance).
- **Payment Method Tender Mix**: Cutout Doughnut chart illustrating percentage and total volume by Tender (Credit Card, Debit, Cash, Pix).
- **Category Volume Inflow vs Outflow**: Stacked/grouped bar charts comparing sales revenue against operating overhead by department.

### 3. 📑 Scoped Slots Transaction Ledger (Vue 2 Architecture)
- Reusable, extensible data table leveraging Vue 2 **Scoped Slots** (`<slot name="cell-type" :row="row">`, `<slot name="cell-amount" :row="row">`).
- Search input with debounce.
- Fast category and type filtering (`All`, `Inflow (+)`, `Outflow (-)`, `POS Receipts`).
- Client-side multi-column sorting and pagination.

### 4. 📄 Executive Reports & Exports
- **1-Click PDF Report**: Generates a clean A4 Corporate Financial Statement with KPIs and audit tables using `jsPDF`.
- **CSV Data Export**: Formats the filtered ledger into a UTF-8 BOM spreadsheet compatible with Excel and Google Sheets.
- **Record Expense Modal**: Record operational overhead (Rent, Utilities, Stock restock, Payroll) with instant reactive recalculation.

---

## 💻 Manual Setup & Commands

```bash
# 1. Navigate to dashboard folder
cd finance-dashboard

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Dashboard opens on http://localhost:3002

# 4. Build for production
npm run build
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Vue 2.7 (Naruto - Composition API & Vite support) |
| **State Management** | Vuex 3.6 (Modular store architecture: `finance`, `pos`) |
| **Charts** | Chart.js 4.4 (Canvas 2D render loop, custom tooltips & gradients) |
| **Storage Engine** | Browser Native IndexedDB (Transactions, Settings) |
| **Styling** | Industrial Fintech Dark UI (Tailored CSS Variables, JetBrains Mono, Plus Jakarta Sans) |
| **Document Export** | jsPDF 4.2 (Vector PDF generation), UTF-8 CSV Generator |
| **Tooling** | Vite 5 + `@vitejs/plugin-vue2` |
