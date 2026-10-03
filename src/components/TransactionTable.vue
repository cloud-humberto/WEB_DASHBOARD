<template>
  <div class="card table-card">
    <!-- Controls Toolbar -->
    <div class="toolbar">
      <div class="filter-tabs">
        <button
          v-for="tab in typeTabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: filterType === tab.key }"
          @click="SET_FILTER_TYPE(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="toolbar-right">
        <!-- Category Selector -->
        <select
          :value="categoryFilter"
          @change="SET_CATEGORY_FILTER($event.target.value)"
          class="form-select select-sm"
        >
          <option value="all">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>

        <!-- Search Input -->
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search description, tender..."
            class="form-input search-input"
            :value="searchQuery"
            @input="onSearchInput"
          />
        </div>
      </div>
    </div>

    <!-- Scoped Slots Data Table -->
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th @click="toggleSort('date')" class="sortable">
              DATE
              <span class="sort-indicator" v-if="sortBy === 'date'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th>TYPE</th>
            <th @click="toggleSort('description')" class="sortable">
              DESCRIPTION
              <span class="sort-indicator" v-if="sortBy === 'description'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th>CATEGORY</th>
            <th>PAYMENT METHOD</th>
            <th>SOURCE</th>
            <th @click="toggleSort('amount')" class="sortable text-right">
              AMOUNT
              <span class="sort-indicator" v-if="sortBy === 'amount'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th class="text-center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRows.length === 0">
            <td colspan="8" class="empty-state">
              No transactions found matching your active filters.
            </td>
          </tr>
          <tr v-for="row in paginatedRows" :key="row.id">
            <!-- Scoped Slot: Date -->
            <slot name="cell-date" :row="row">
              <td class="mono date-cell">{{ formatDate(row.date) }}</td>
            </slot>

            <!-- Scoped Slot: Type -->
            <slot name="cell-type" :row="row">
              <td>
                <span v-if="row.type === 'revenue'" class="badge badge-emerald">INFLOW</span>
                <span v-else class="badge badge-rose">OUTFLOW</span>
              </td>
            </slot>

            <!-- Scoped Slot: Description -->
            <slot name="cell-desc" :row="row">
              <td class="desc-cell">
                <span class="desc-text">{{ row.description }}</span>
                <span v-if="row.operator" class="desc-sub text-muted">Op: {{ row.operator }}</span>
              </td>
            </slot>

            <!-- Scoped Slot: Category -->
            <slot name="cell-category" :row="row">
              <td>
                <span class="badge badge-subtle">{{ row.category || 'General' }}</span>
              </td>
            </slot>

            <!-- Scoped Slot: Payment -->
            <slot name="cell-payment" :row="row">
              <td class="text-secondary">{{ row.payment_method || '-' }}</td>
            </slot>

            <!-- Scoped Slot: Source -->
            <slot name="cell-source" :row="row">
              <td>
                <span v-if="row.source === 'pos_sync'" class="source-badge pos" title="Imported from NovaPOS SQLite">
                  POS Live
                </span>
                <span v-else class="source-badge manual">
                  Manual
                </span>
              </td>
            </slot>

            <!-- Scoped Slot: Amount -->
            <slot name="cell-amount" :row="row">
              <td class="text-right mono font-bold" :class="row.type === 'revenue' ? 'text-emerald' : 'text-rose'">
                {{ row.type === 'revenue' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
              </td>
            </slot>

            <!-- Scoped Slot: Actions -->
            <slot name="cell-actions" :row="row">
              <td class="text-center">
                <button
                  class="btn-icon delete"
                  @click="confirmDelete(row)"
                  title="Delete record"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </slot>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="pagination-footer">
      <div class="page-info mono text-muted">
        Showing {{ paginationStart }} - {{ paginationEnd }} of {{ sortedRows.length }} records
      </div>
      <div class="page-controls">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Previous
        </button>
        <span class="current-page mono">Page {{ currentPage }} / {{ totalPages }}</span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default {
  name: 'TransactionTable',
  data() {
    return {
      typeTabs: [
        { key: 'all', label: 'All Items' },
        { key: 'revenue', label: 'Inflow (+)' },
        { key: 'expense', label: 'Outflow (-)' },
        { key: 'pos_sync', label: 'POS Receipts' }
      ],
      currentPage: 1,
      pageSize: 12,
      sortBy: 'date',
      sortAsc: false,
      searchTimeout: null
    };
  },
  computed: {
    ...mapState('finance', ['filterType', 'categoryFilter', 'searchQuery']),
    ...mapGetters('finance', ['filteredTransactions', 'categories']),

    sortedRows() {
      const items = [...this.filteredTransactions];
      items.sort((a, b) => {
        let valA = a[this.sortBy];
        let valB = b[this.sortBy];

        if (this.sortBy === 'amount') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (this.sortBy === 'date') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return this.sortAsc ? -1 : 1;
        if (valA > valB) return this.sortAsc ? 1 : -1;
        return 0;
      });
      return items;
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.sortedRows.length / this.pageSize));
    },

    paginatedRows() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.sortedRows.slice(start, start + this.pageSize);
    },

    paginationStart() {
      if (this.sortedRows.length === 0) return 0;
      return (this.currentPage - 1) * this.pageSize + 1;
    },

    paginationEnd() {
      return Math.min(this.currentPage * this.pageSize, this.sortedRows.length);
    }
  },
  watch: {
    filteredTransactions() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
    }
  },
  methods: {
    ...mapMutations('finance', ['SET_FILTER_TYPE', 'SET_CATEGORY_FILTER', 'SET_SEARCH_QUERY']),
    ...mapActions('finance', ['removeTransaction']),
    formatCurrency,
    formatDate,

    toggleSort(field) {
      if (this.sortBy === field) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortBy = field;
        this.sortAsc = false;
      }
    },

    onSearchInput(e) {
      clearTimeout(this.searchTimeout);
      const val = e.target.value;
      this.searchTimeout = setTimeout(() => {
        this.SET_SEARCH_QUERY(val);
      }, 250);
    },

    async confirmDelete(row) {
      const conf = confirm(`Delete record "${row.description}" ($${Number(row.amount).toFixed(2)})?`);
      if (conf) {
        await this.removeTransaction(row.id);
      }
    }
  }
};
</script>

<style scoped>
.table-card {
  padding: 0;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}
.tab-btn:hover {
  color: var(--text-primary);
}
.tab-btn.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-sm {
  width: auto;
  padding: 6px 10px;
  font-size: 12px;
}

.search-box {
  position: relative;
  width: 220px;
}

.search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  padding: 6px 10px 6px 28px;
  font-size: 12px;
}

/* Data Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.data-table th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card);
  letter-spacing: 0.5px;
  user-select: none;
}

.data-table th.sortable {
  cursor: pointer;
}
.data-table th.sortable:hover {
  color: var(--text-primary);
}

.sort-indicator {
  font-size: 9px;
  margin-left: 4px;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.data-table tbody tr:hover {
  background: var(--bg-card-hover);
}

.date-cell {
  font-size: 12px;
  color: var(--text-secondary);
}

.desc-cell {
  display: flex;
  flex-direction: column;
}

.desc-text {
  font-weight: 600;
}

.desc-sub {
  font-size: 11px;
}

.source-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}
.source-badge.pos {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent-emerald);
}
.source-badge.manual {
  background: rgba(100, 116, 139, 0.2);
  color: var(--text-secondary);
}

.font-bold {
  font-weight: 700;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: all 0.15s ease;
}
.btn-icon:hover.delete {
  color: var(--accent-rose);
  background: var(--accent-rose-glow);
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
  font-style: italic;
}

/* Pagination Footer */
.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-subtle);
  border-top: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 10px;
}

.page-info {
  font-size: 12px;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-page {
  font-size: 12px;
  color: var(--text-secondary);
}

.text-right { text-align: right; }
.text-center { text-align: center; }

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
  }
  .filter-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    width: 100%;
  }
  .filter-tabs::-webkit-scrollbar {
    display: none;
  }
  .tab-btn {
    flex-shrink: 0;
    padding: 6px 10px;
  }
  .toolbar-right {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  .select-sm {
    width: 100%;
  }
  .search-box {
    width: 100%;
  }
  .data-table th, .data-table td {
    padding: 8px 10px;
    font-size: 11.5px;
  }
  .pagination-footer {
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px;
    text-align: center;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .toolbar {
    padding: 8px 12px;
    gap: 8px;
  }
  .data-table th, .data-table td {
    padding: 6px 8px;
    font-size: 11px;
  }
  .pagination-footer {
    padding: 6px 12px;
  }
}
</style>
