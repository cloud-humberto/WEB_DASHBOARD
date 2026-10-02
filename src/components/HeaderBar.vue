<template>
  <header class="header-container">
    <div class="header-top">
      <!-- Brand & Title -->
      <div class="brand-section">
        <div class="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <div>
          <h1 class="brand-title">NovaMetrics</h1>
          <span class="brand-subtitle">FINANCIAL CASHFLOW & RETAIL ANALYTICS</span>
        </div>
      </div>

      <!-- POS Live Connection Status Badge -->
      <div class="pos-status-badge" :class="connectionBadge.status" @click="$emit('open-pos-modal')">
        <span class="pulse-dot"></span>
        <span class="status-text">{{ connectionBadge.text }}</span>
        <span class="status-action" v-if="isPosOnline">MANAGE &bull;</span>
        <span class="status-action" v-else>OFFLINE &bull;</span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="actions-group">
        <button
          v-if="isPosOnline"
          class="btn btn-emerald btn-sm"
          :disabled="isSyncing"
          @click="$emit('sync-pos')"
          title="Import latest retail receipts directly from NovaPOS SQLite database"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {{ isSyncing ? 'Syncing...' : 'Sync POS Sales' }}
        </button>

        <button
          class="btn btn-secondary btn-sm"
          @click="$emit('open-expense-modal')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Record Expense
        </button>

        <button
          class="btn btn-secondary btn-sm"
          @click="$emit('export-pdf')"
          title="Generate Executive Financial Statement PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          PDF Report
        </button>

        <button
          class="btn btn-secondary btn-sm"
          @click="$emit('export-csv')"
          title="Download transactions CSV spreadsheet"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          CSV
        </button>

        <button
          class="btn btn-ghost btn-sm"
          @click="$emit('reset-baseline')"
          title="Reset IndexedDB baseline sample data"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Filter Pills Row -->
    <div class="header-bottom">
      <div class="period-pills">
        <span class="period-label">TIMEFRAME:</span>
        <button
          v-for="p in periods"
          :key="p.key"
          class="period-btn"
          :class="{ active: filterPeriod === p.key }"
          @click="changePeriod(p.key)"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="stats-preview mono text-muted">
        <span v-if="isPosOnline" class="text-emerald">Live SQLite Backend Connected</span>
        <span v-else>IndexedDB Offline Persistence Active</span>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';

export default {
  name: 'HeaderBar',
  data() {
    return {
      periods: [
        { key: '7d', label: 'Last 7 Days' },
        { key: '30d', label: 'Last 30 Days' },
        { key: 'month', label: 'This Month' },
        { key: 'all', label: 'All History' }
      ]
    };
  },
  computed: {
    ...mapState('finance', ['filterPeriod']),
    ...mapState('pos', ['isPosOnline', 'isSyncing']),
    ...mapGetters('pos', ['connectionBadge'])
  },
  methods: {
    ...mapMutations('finance', ['SET_FILTER_PERIOD']),
    changePeriod(key) {
      this.SET_FILTER_PERIOD(key);
    }
  }
};
</script>

<style scoped>
.header-container {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  padding: 16px 24px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.8px;
}

/* POS Connection Badge */
.pos-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.pos-status-badge.online {
  background: var(--accent-emerald-glow);
  color: var(--accent-emerald);
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.pos-status-badge.online:hover {
  background: rgba(16, 185, 129, 0.25);
  box-shadow: 0 0 10px var(--accent-emerald-glow);
}
.pos-status-badge.offline {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}
.pos-status-badge.offline:hover {
  border-color: var(--text-muted);
}
.pos-status-badge.loading {
  background: var(--accent-amber-glow);
  color: var(--accent-amber);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.pos-status-badge.online .pulse-dot {
  box-shadow: 0 0 8px #10B981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.status-action {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.7;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Filter Row */
.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

.period-pills {
  display: flex;
  align-items: center;
  gap: 6px;
}

.period-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  margin-right: 4px;
}

.period-btn {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.period-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
.period-btn.active {
  background: var(--accent-blue);
  color: #FFFFFF;
  border-color: var(--accent-blue);
  box-shadow: 0 0 10px var(--accent-blue-glow);
}

.stats-preview {
  font-size: 12px;
}
</style>
