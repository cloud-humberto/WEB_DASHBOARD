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

## 🔗 Hybrid Architecture & Automatic NovaPOS Integration

NovaMetrics is engineered with an **intelligent commercial data layer**:

### 1. 🔄 Automatic NovaPOS Discovery & Shared SQLite Database
- **Zero-Config Auto-Detection**: When launched alongside **[NovaPOS Terminal (WEB_POS)](https://github.com/cloud-humberto/WEB_POS)**, the backend (`server/db.js`) automatically detects and connects directly to `pdv-vue2/server/database.sqlite`.
- **Concurrent Multi-Process WAL Mode**: SQLite **Write-Ahead Logging** (`PRAGMA journal_mode = WAL;`) enables both NovaPOS and NovaMetrics to concurrently read and write to the same database file with zero file locking or conflicts.
- **Real-Time Retail Feeds**: Every sale finalized in NovaPOS (`[F4] Tender`) is instantly queried by the dashboard—feeding Gross Inflow, top products, payment tender mix, and net profit margins without manual export/import.
- **Live Terminal Monitor**: The top header badge dynamically detects if the NovaPOS terminal is actively running (`🟢 NovaPOS Terminal Active`) or stopped (`🔵 Shared SQLite Connected`).

### 2. 🛡️ 100% Standalone Autonomy (SQLite + IndexedDB Fallback)
- **Runs Completely Alone**: If NovaPOS is not present, NovaMetrics automatically creates its own independent SQLite database (`server/database.sqlite`) with complete commercial schemas (`products`, `sales`, `sale_items`, `expenses`, `users`) and seeded baseline data.
- **Static / Serverless Fallback**: If the Node.js backend is offline (e.g. static preview or GitHub Pages), the dashboard seamlessly switches to browser-native **IndexedDB** (`NovaMetricsDB`).

### 3. 🧹 Clean Store Deployment & Mock Data Purge (Reset to $0.00)
- **Out-of-the-Box Demo Baseline**: Upon fresh installation or initial test run, the app includes 30 days of mock sales and expenses so you can test charts, filters, and reports immediately without having to enter data manually.
- **1-Click Purge Mock Data**: When ready to deploy in a real store, simply click **`Clear Mock Data`** in the header or inside the Database modal:
  - Permanently purges all mock sales, receipt line items, and expenses.
  - Automatically resets financial KPIs and cash register to a clean **`$0.00`** state.
  - **Zero Data Loss**: Safely preserves the entire product catalog (`products`) and cashier/manager accounts (`users`).
  - **Persistent Clean State**: Remembers your preference via persistent settings (`demo_cleared = '1'`), ensuring that server restarts or browser refreshes never accidentally restore mock transactions.
  - **Testing Flexibility**: You can reload sample baseline data at any time via the Database modal (`Reload Demo Baseline Data`).

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
