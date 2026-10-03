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

      <!-- POS & SQLite Live Link Status Badge -->
      <div
        class="pos-status-badge"
        :class="statusClass"
        @click="$emit('open-pos-modal')"
        :title="statusTooltip"
      >
        <span class="pulse-dot"></span>
        <span class="status-text">{{ statusText }}</span>
        <span class="status-action">&bull; VIEW DB</span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="actions-group">
        <button
          class="btn btn-danger btn-sm"
          @click="handlePurgeDemo"
          title="Delete all mock sales and expenses to start with a clean empty database ($0.00)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Clear Mock Data
        </button>

        <button
          class="btn btn-emerald btn-sm"
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
          @click="$emit('refresh-data')"
          title="Refresh database records"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh
        </button>

        <button
          class="btn btn-secondary btn-sm"
          @click="$emit('export-pdf')"
          title="Generate Executive Financial Statement PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          CSV
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
        <span v-if="isSqlConnected" class="text-emerald">
          🗄️ Database: <code>{{ dbPathDisplay }}</code>
        </span>
        <span v-else>
          IndexedDB Offline Persistence Active
        </span>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';

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
    ...mapState('finance', ['filterPeriod', 'isSqlConnected', 'dbPath', 'posStatus']),

    dbPathDisplay() {
      if (!this.dbPath) return 'Connected';
      if (this.dbPath.startsWith('libsql://') || this.dbPath.includes('turso.io')) {
        const domain = this.dbPath.replace(/^libsql:\/\//, '').split('.')[0];
        return `Turso Cloud (${domain})`;
      }
      return this.dbPath;
    },

    statusClass() {
      if (!this.isSqlConnected) return 'offline';
      if (this.dbPath && (this.dbPath.startsWith('libsql://') || this.dbPath.includes('turso.io'))) return 'online';
      if (this.posStatus && this.posStatus.isPosOnline) return 'online';
      return 'connected-db';
    },

    statusText() {
      if (!this.isSqlConnected) return 'Offline (IndexedDB)';
      if (this.dbPath && (this.dbPath.startsWith('libsql://') || this.dbPath.includes('turso.io'))) {
        return 'Turso libSQL Cloud Connected';
      }
      if (this.posStatus && this.posStatus.isPosOnline) return 'NovaPOS Terminal Active (Port 3000/3001)';
      return 'Shared SQLite Connected';
    },

    statusTooltip() {
      if (this.isSqlConnected) {
        return `Connected to database: ${this.dbPath || 'Active'}`;
      }
      return 'Using local browser IndexedDB';
    }
  },
  methods: {
    ...mapMutations('finance', ['SET_FILTER_PERIOD']),
    ...mapActions('finance', ['loadData', 'purgeDemoData']),
    changePeriod(key) {
      this.SET_FILTER_PERIOD(key);
      this.loadData();
    },
    async handlePurgeDemo() {
      const conf = confirm(
        '⚠️ DELETE ALL MOCK DATA?\n\nThis will permanently delete all seeded mock sales and expenses from the database.\nYour register will start clean at $0.00.\n\n(Products and User accounts will NOT be deleted).\n\nProceed?'
      );
      if (conf) {
        await this.purgeDemoData();
      }
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
.pos-status-badge.connected-db {
  background: var(--accent-blue-glow);
  color: var(--accent-blue);
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.pos-status-badge.offline {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.pos-status-badge.online .pulse-dot,
.pos-status-badge.connected-db .pulse-dot {
  box-shadow: 0 0 8px currentColor;
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
  opacity: 0.8;
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

.stats-preview code {
  background: var(--bg-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .header-container {
    padding: 10px 14px;
  }
  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .brand-section {
    justify-content: space-between;
    width: 100%;
  }
  .actions-group {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;
    gap: 6px;
    scrollbar-width: none;
  }
  .actions-group::-webkit-scrollbar {
    display: none;
  }
  .actions-group .btn {
    flex-shrink: 0;
    padding: 6px 10px;
  }
  .header-bottom {
    margin-top: 8px;
    padding-top: 8px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .period-pills {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .period-pills::-webkit-scrollbar {
    display: none;
  }
  .period-btn {
    flex-shrink: 0;
    padding: 4px 10px;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .header-container {
    padding: 6px 14px;
  }
  .brand-logo {
    width: 28px;
    height: 28px;
  }
  .brand-title {
    font-size: 15px;
  }
  .brand-subtitle {
    display: none;
  }
  .header-bottom {
    margin-top: 4px;
    padding-top: 4px;
  }
  .actions-group .btn {
    padding: 3px 8px;
    font-size: 11px;
  }
  .period-btn {
    padding: 3px 8px;
    font-size: 11px;
  }
}
</style>
