<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title-wrapper">
          <div class="icon-wrap" :class="isPosOnline ? 'emerald' : 'muted'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">NovaPOS SQLite Integration</h3>
            <span class="modal-subtitle">Live bridge with retail Point of Sale system</span>
          </div>
        </div>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Live Connection Status Box -->
        <div class="status-box" :class="isPosOnline ? 'online' : 'offline'">
          <div class="status-left">
            <span class="status-indicator-dot"></span>
            <div>
              <div class="status-title">
                {{ isPosOnline ? 'NovaPOS SQLite Backend Connected' : 'NovaPOS Backend Not Detected' }}
              </div>
              <div class="status-desc mono">
                {{ isPosOnline ? 'API Target: http://localhost:3001' : 'Offline / Standalone IndexedDB Mode Active' }}
              </div>
            </div>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="isChecking"
            @click="handleCheckConnection"
          >
            {{ isChecking ? 'Checking...' : 'Probe API' }}
          </button>
        </div>

        <!-- If Online: POS SQLite Stats -->
        <div v-if="isPosOnline" class="pos-stats-section">
          <h4 class="section-title">LIVE RETAIL METRICS (FROM SQLITE)</h4>
          <div class="pos-stats-grid" v-if="posSummary">
            <div class="stat-item">
              <span class="stat-label">TOTAL SALES TODAY</span>
              <span class="stat-val mono">{{ posSummary.total_sales_count || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">GROSS REVENUE</span>
              <span class="stat-val mono text-emerald">{{ formatCurrency(posSummary.gross_sales) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">TOTAL DISCOUNTS</span>
              <span class="stat-val mono text-rose">{{ formatCurrency(posSummary.total_discounts) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">TOTAL TAX</span>
              <span class="stat-val mono text-amber">{{ formatCurrency(posSummary.total_tax) }}</span>
            </div>
          </div>

          <div class="sync-action-box">
            <p class="sync-desc">
              Import all retail checkout receipts into your NovaMetrics dashboard. Duplicate receipts are automatically skipped.
            </p>
            <button
              class="btn btn-emerald"
              :disabled="isSyncing"
              @click="handleSync"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {{ isSyncing ? 'Importing Receipts...' : 'Synchronize POS Sales Now' }}
            </button>
          </div>

          <!-- Last Sync Results -->
          <div v-if="lastSyncStats" class="sync-results mono">
            <span class="text-emerald">✓ {{ lastSyncStats.importedCount }} new receipts imported</span>
            <span v-if="lastSyncStats.skippedCount > 0" class="text-muted">
              ({{ lastSyncStats.skippedCount }} already up-to-date)
            </span>
          </div>
        </div>

        <!-- If Offline: Explanation on how to start POS -->
        <div v-else class="offline-guide">
          <h4 class="section-title">HOW TO CONNECT TO NOVAPOS:</h4>
          <p class="guide-text">
            NovaMetrics works 100% offline using your browser's IndexedDB. To synchronize real-time sales with your NovaPOS register:
          </p>
          <ol class="guide-steps">
            <li>
              Navigate to the <code>pdv-vue2/</code> folder and run <code>START-POS.bat</code> (or double-click the <strong>NovaPOS Terminal</strong> desktop shortcut).
            </li>
            <li>
              NovaPOS will start its native SQLite backend server on port <code>3001</code>.
            </li>
            <li>
              Return to this dashboard and click <strong>Probe API</strong> to link live receipts!
            </li>
          </ol>
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
    ...mapState('pos', ['isPosOnline', 'isChecking', 'isSyncing', 'lastSyncStats', 'posSummary'])
  },
  methods: {
    ...mapActions('pos', ['checkConnection', 'syncSalesWithDashboard']),
    formatCurrency,

    async handleCheckConnection() {
      await this.checkConnection();
    },

    async handleSync() {
      try {
        await this.syncSalesWithDashboard();
      } catch (err) {
        alert('Sync error: ' + err.message);
      }
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
  margin-bottom: 20px;
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
}

.section-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.6px;
  margin-bottom: 12px;
}

.pos-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
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
  font-size: 16px;
  font-weight: 800;
  margin-top: 4px;
}

.sync-action-box {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.sync-results {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
  display: flex;
  gap: 8px;
}

/* Offline Guide */
.offline-guide {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
}

.guide-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.guide-steps {
  font-size: 12px;
  color: var(--text-secondary);
  padding-left: 20px;
  line-height: 1.6;
}
.guide-steps li {
  margin-bottom: 6px;
}
.guide-steps code {
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
}
</style>
