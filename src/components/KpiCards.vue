<template>
  <div class="kpi-grid">
    <!-- Card 1: Gross Inflow / Revenue -->
    <div class="card kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">GROSS REVENUE</span>
        <div class="kpi-icon-wrapper emerald">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
      </div>
      <div class="kpi-value text-emerald mono">{{ formatCurrency(kpis.totalRevenue) }}</div>
      <div class="kpi-footer">
        <span class="badge badge-emerald">+{{ kpis.revenueCount }} Sales</span>
        <span class="kpi-subtitle">Retail POS receipts</span>
      </div>
    </div>

    <!-- Card 2: Operating Expenses -->
    <div class="card kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">OPERATING EXPENSES</span>
        <div class="kpi-icon-wrapper rose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline>
          </svg>
        </div>
      </div>
      <div class="kpi-value text-rose mono">{{ formatCurrency(kpis.totalExpenses) }}</div>
      <div class="kpi-footer">
        <span class="badge badge-rose">Outflow</span>
        <span class="kpi-subtitle">Rent, utilities & stock</span>
      </div>
    </div>

    <!-- Card 3: Net Operating Profit -->
    <div class="card kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">NET OPERATING PROFIT</span>
        <div class="kpi-icon-wrapper" :class="kpis.netProfit >= 0 ? 'blue' : 'rose'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
      </div>
      <div class="kpi-value mono" :class="kpis.netProfit >= 0 ? 'text-emerald' : 'text-rose'">
        {{ formatCurrency(kpis.netProfit) }}
      </div>
      <div class="kpi-footer">
        <span class="badge" :class="kpis.netProfit >= 0 ? 'badge-emerald' : 'badge-rose'">
          {{ formatPercent(kpis.profitMargin) }} Margin
        </span>
        <span class="kpi-subtitle">Net cash remaining</span>
      </div>
    </div>

    <!-- Card 4: Average POS Ticket -->
    <div class="card kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">AVERAGE BASKET (TICKET)</span>
        <div class="kpi-icon-wrapper amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
      </div>
      <div class="kpi-value text-amber mono">{{ formatCurrency(kpis.avgTicket) }}</div>
      <div class="kpi-footer">
        <span class="badge badge-amber">Per Checkout</span>
        <span class="kpi-subtitle">Customer transaction avg</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatCurrency, formatPercent } from '@/utils/formatters';

export default {
  name: 'KpiCards',
  computed: {
    ...mapGetters('finance', ['kpis'])
  },
  methods: {
    formatCurrency,
    formatPercent
  }
};
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-left: 3px solid transparent;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-focus);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.kpi-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}

.kpi-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-icon-wrapper.emerald {
  background: var(--accent-emerald-glow);
  color: var(--accent-emerald);
}
.kpi-icon-wrapper.rose {
  background: var(--accent-rose-glow);
  color: var(--accent-rose);
}
.kpi-icon-wrapper.blue {
  background: var(--accent-blue-glow);
  color: var(--accent-blue);
}
.kpi-icon-wrapper.amber {
  background: var(--accent-amber-glow);
  color: var(--accent-amber);
}

.kpi-value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.kpi-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kpi-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
