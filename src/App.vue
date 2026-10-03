<template>
  <div id="app" class="dashboard-layout">
    <!-- Header -->
    <HeaderBar
      @open-pos-modal="showPosModal = true"
      @open-expense-modal="showExpenseModal = true"
      @refresh-data="handleRefresh"
      @export-pdf="handleExportPdf"
      @export-csv="handleExportCsv"
    />

    <!-- Main Content Body -->
    <main class="main-content">
      <!-- 1. Executive KPI Cards -->
      <section class="section-kpis">
        <KpiCards />
      </section>

      <!-- 2. Interactive Charts Grid -->
      <section class="section-charts">
        <div class="charts-row-primary">
          <div class="chart-col-main">
            <ChartCashflow />
          </div>
          <div class="chart-col-side">
            <ChartPaymentMethods />
          </div>
        </div>

        <div class="charts-row-secondary">
          <ChartTopCategories />
        </div>
      </section>

      <!-- 3. Scoped Slots Transactions Table -->
      <section class="section-table">
        <div class="table-header-title">
          <h2 class="section-title">AUDIT TRAIL & TRANSACTION JOURNAL</h2>
          <span class="section-subtitle">Real-time ledger combining operational expenses & POS checkout receipts</span>
        </div>
        <TransactionTable />
      </section>
    </main>

    <!-- Modals -->
    <ModalAddExpense
      v-if="showExpenseModal"
      @close="showExpenseModal = false"
    />

    <ModalPosSync
      v-if="showPosModal"
      @close="showPosModal = false"
    />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import HeaderBar from './components/HeaderBar.vue';
import KpiCards from './components/KpiCards.vue';
import ChartCashflow from './components/ChartCashflow.vue';
import ChartPaymentMethods from './components/ChartPaymentMethods.vue';
import ChartTopCategories from './components/ChartTopCategories.vue';
import TransactionTable from './components/TransactionTable.vue';
import ModalAddExpense from './components/ModalAddExpense.vue';
import ModalPosSync from './components/ModalPosSync.vue';

import { exportTransactionsToCsv } from './utils/exportCsv';
import { exportExecutivePdf } from './utils/exportPdf';

export default {
  name: 'App',
  components: {
    HeaderBar,
    KpiCards,
    ChartCashflow,
    ChartPaymentMethods,
    ChartTopCategories,
    TransactionTable,
    ModalAddExpense,
    ModalPosSync
  },
  data() {
    return {
      showExpenseModal: false,
      showPosModal: false,
      pollInterval: null
    };
  },
  computed: {
    ...mapState('finance', ['filterPeriod']),
    ...mapGetters('finance', ['kpis', 'filteredTransactions'])
  },
  async mounted() {
    // 1. Initial Load of shared SQLite data
    await this.loadFinanceData();

    // 2. Poll every 8 seconds to capture new NovaPOS checkout receipts live
    this.pollInterval = setInterval(() => {
      this.loadFinanceData();
    }, 8000);
  },
  beforeDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  },
  methods: {
    ...mapActions('finance', {
      loadFinanceData: 'loadData'
    }),

    async handleRefresh() {
      await this.loadFinanceData();
    },

    handleExportCsv() {
      exportTransactionsToCsv(this.filteredTransactions, `novametrics_transactions_${this.filterPeriod}.csv`);
    },

    handleExportPdf() {
      const periodLabels = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        'month': 'This Month',
        'all': 'All Time History'
      };
      exportExecutivePdf(this.kpis, this.filteredTransactions, periodLabels[this.filterPeriod] || 'Custom');
    }
  }
};
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-charts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.charts-row-primary {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

@media (max-width: 960px) {
  .charts-row-primary {
    grid-template-columns: 1fr;
  }
}

.section-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-header-title {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .main-content {
    padding: 12px 10px;
    gap: 16px;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .main-content {
    padding: 8px 14px;
    gap: 12px;
  }
  .charts-row-primary {
    grid-template-columns: 1fr 1fr !important;
    gap: 10px;
  }
  .section-charts {
    gap: 10px;
  }
}
</style>
