<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title-wrapper">
          <div class="icon-wrap" :class="isSqlConnected ? 'emerald' : 'muted'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">Shared SQLite Database & POS Link</h3>
            <span class="modal-subtitle">Unified relational storage with NovaPOS</span>
          </div>
        </div>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Live Connection Status Box -->
        <div class="status-box" :class="isSqlConnected ? 'online' : 'offline'">
          <div class="status-left">
            <span class="status-indicator-dot"></span>
            <div>
              <div class="status-title">
                {{ isSqlConnected ? 'Shared SQLite Database Connected' : 'SQLite Server Not Detected' }}
              </div>
              <div class="status-desc mono">
                {{ dbPath || 'Using Local IndexedDB' }}
              </div>
            </div>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            @click="handleRefresh"
          >
            Probe DB
          </button>
        </div>

        <!-- POS Terminal Link Status -->
        <div class="pos-link-card">
          <div class="pos-link-header">
            <span class="section-title">NOVAPOS TERMINAL STATUS</span>
            <span
              class="badge"
              :class="posStatus && posStatus.isPosOnline ? 'badge-emerald' : 'badge-subtle'"
            >
              {{ posStatus && posStatus.isPosOnline ? 'RUNNING (PORT 3000/3001)' : 'TERMINAL STOPPED' }}
            </span>
          </div>
          <p class="pos-link-desc">
            Whenever a cashier checks out an order in NovaPOS, it is written immediately to this shared SQLite database, and automatically flows into this dashboard.
          </p>
        </div>

        <!-- Shared SQLite Statistics -->
        <div class="pos-stats-section" v-if="posStatus && posStatus.stats">
          <h4 class="section-title">DATABASE ENTITIES IN SQLITE</h4>
          <div class="pos-stats-grid">
            <div class="stat-item">
              <span class="stat-label">RETAIL SALES</span>
              <span class="stat-val mono text-emerald">{{ posStatus.stats.salesCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">OPERATING EXPENSES</span>
              <span class="stat-val mono text-rose">{{ posStatus.stats.expensesCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">PRODUCTS IN CATALOG</span>
              <span class="stat-val mono text-blue">{{ posStatus.stats.productsCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">SQLITE CONCURRENCY</span>
              <span class="stat-val mono text-amber">WAL MODE</span>
            </div>
          </div>

          <!-- Latest Sale in Database -->
          <div v-if="posStatus.lastSale" class="last-sale-box mono">
            <span class="text-secondary">Latest Checkout:</span>
            <span class="text-emerald font-bold">Receipt #{{ posStatus.lastSale.sale_number }}</span>
            <span class="text-muted">({{ formatCurrency(posStatus.lastSale.total_amount) }} - {{ posStatus.lastSale.operator_name }})</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatCurrency } from '@/utils/formatters';

export default {
  name: 'ModalPosSync',
  computed: {
    ...mapState('finance', ['isSqlConnected', 'dbPath', 'posStatus'])
  },
  methods: {
    ...mapActions('finance', ['loadData']),
    formatCurrency,

    async handleRefresh() {
      await this.loadData();
    }
  }
};
</script>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrap.emerald {
  background: var(--accent-emerald-glow);
  color: var(--accent-emerald);
}
.icon-wrap.muted {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}
.btn-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.status-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}
.status-box.online {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.status-box.offline {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-box.online .status-indicator-dot {
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
}
.status-box.offline .status-indicator-dot {
  background: var(--text-muted);
}

.status-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.status-desc {
  font-size: 11px;
  color: var(--text-muted);
  word-break: break-all;
}

.pos-link-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 16px;
}

.pos-link-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.pos-link-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.section-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.6px;
}

.pos-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
  margin-bottom: 16px;
}

.stat-item {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
}

.stat-val {
  font-size: 18px;
  font-weight: 800;
  margin-top: 4px;
}

.last-sale-box {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
}
</style>
