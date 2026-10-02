import {
  getAllTransactions,
  addTransaction,
  deleteTransaction,
  clearTransactions,
  seedInitialDataIfEmpty
} from '@/services/indexedDb';

export default {
  namespaced: true,

  state: () => ({
    transactions: [],
    filterPeriod: '30d', // '7d' | '30d' | 'month' | 'all'
    filterType: 'all',   // 'all' | 'revenue' | 'expense' | 'pos_sync'
    categoryFilter: 'all',
    searchQuery: '',
    isLoading: false
  }),

  getters: {
    /**
     * Filter transactions based on active UI criteria
     */
    filteredTransactions: (state) => {
      const now = new Date();
      let cutoffDate = null;

      if (state.filterPeriod === '7d') {
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - 7);
      } else if (state.filterPeriod === '30d') {
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - 30);
      } else if (state.filterPeriod === 'month') {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      return state.transactions.filter((t) => {
        // Period filter
        if (cutoffDate && new Date(t.date) < cutoffDate) {
          return false;
        }

        // Type filter
        if (state.filterType === 'revenue' && t.type !== 'revenue') return false;
        if (state.filterType === 'expense' && t.type !== 'expense') return false;
        if (state.filterType === 'pos_sync' && t.source !== 'pos_sync') return false;

        // Category filter
        if (state.categoryFilter !== 'all' && t.category !== state.categoryFilter) {
          return false;
        }

        // Search query
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase();
          const matchDesc = (t.description || '').toLowerCase().includes(q);
          const matchCat = (t.category || '').toLowerCase().includes(q);
          const matchPm = (t.payment_method || '').toLowerCase().includes(q);
          const matchOp = (t.operator || '').toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchPm && !matchOp) return false;
        }

        return true;
      });
    },

    /**
     * Executive KPI metrics calculated over filtered items
     */
    kpis: (state, getters) => {
      const items = getters.filteredTransactions;
      let totalRevenue = 0;
      let totalExpenses = 0;
      let revenueCount = 0;

      items.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'revenue') {
          totalRevenue += amt;
          revenueCount++;
        } else if (t.type === 'expense') {
          totalExpenses += amt;
        }
      });

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const avgTicket = revenueCount > 0 ? totalRevenue / revenueCount : 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        avgTicket,
        totalTransactions: items.length,
        revenueCount
      };
    },

    /**
     * Unique category list for dropdown filters
     */
    categories: (state) => {
      const set = new Set();
      state.transactions.forEach((t) => {
        if (t.category) set.add(t.category);
      });
      return Array.from(set).sort();
    },

    /**
     * Timeline data prepared for Chart.js Line Chart (Chronological order)
     */
    cashflowTimeline: (state, getters) => {
      const items = [...getters.filteredTransactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const map = new Map();

      items.forEach((t) => {
        const dateKey = t.date ? t.date.slice(0, 10) : 'Unknown';
        if (!map.has(dateKey)) {
          map.set(dateKey, { revenue: 0, expense: 0 });
        }
        const entry = map.get(dateKey);
        const amt = Number(t.amount) || 0;
        if (t.type === 'revenue') {
          entry.revenue += amt;
        } else {
          entry.expense += amt;
        }
      });

      const labels = [];
      const revenues = [];
      const expenses = [];
      const net = [];

      for (const [key, val] of map.entries()) {
        const [year, month, day] = key.split('-');
        labels.push(`${month}/${day}`);
        revenues.push(Number(val.revenue.toFixed(2)));
        expenses.push(Number(val.expense.toFixed(2)));
        net.push(Number((val.revenue - val.expense).toFixed(2)));
      }

      return { labels, revenues, expenses, net };
    },

    /**
     * Payment Methods breakdown prepared for Doughnut chart
     */
    paymentMethodsBreakdown: (state, getters) => {
      const items = getters.filteredTransactions.filter((t) => t.type === 'revenue');
      const map = new Map();

      items.forEach((t) => {
        const pm = t.payment_method || 'Other';
        const current = map.get(pm) || 0;
        map.set(pm, current + (Number(t.amount) || 0));
      });

      const labels = [];
      const values = [];

      for (const [pm, total] of map.entries()) {
        labels.push(pm);
        values.push(Number(total.toFixed(2)));
      }

      return { labels, values };
    },

    /**
     * Category distribution for Bar Chart
     */
    categoryBreakdown: (state, getters) => {
      const items = getters.filteredTransactions;
      const map = new Map();

      items.forEach((t) => {
        const cat = t.category || 'General';
        if (!map.has(cat)) {
          map.set(cat, { revenue: 0, expense: 0 });
        }
        const entry = map.get(cat);
        const amt = Number(t.amount) || 0;
        if (t.type === 'revenue') {
          entry.revenue += amt;
        } else {
          entry.expense += amt;
        }
      });

      const labels = [];
      const revenues = [];
      const expenses = [];

      for (const [cat, data] of map.entries()) {
        labels.push(cat);
        revenues.push(Number(data.revenue.toFixed(2)));
        expenses.push(Number(data.expense.toFixed(2)));
      }

      return { labels, revenues, expenses };
    }
  },

  mutations: {
    SET_TRANSACTIONS(state, list) {
      state.transactions = list;
    },
    ADD_TRANSACTION(state, item) {
      state.transactions.unshift(item);
    },
    REMOVE_TRANSACTION(state, id) {
      state.transactions = state.transactions.filter((t) => t.id !== id);
    },
    SET_FILTER_PERIOD(state, period) {
      state.filterPeriod = period;
    },
    SET_FILTER_TYPE(state, type) {
      state.filterType = type;
    },
    SET_CATEGORY_FILTER(state, cat) {
      state.categoryFilter = cat;
    },
    SET_SEARCH_QUERY(state, q) {
      state.searchQuery = q;
    },
    SET_LOADING(state, val) {
      state.isLoading = val;
    }
  },

  actions: {
    async loadData({ commit }) {
      commit('SET_LOADING', true);
      try {
        const data = await seedInitialDataIfEmpty();
        commit('SET_TRANSACTIONS', data);
      } catch (err) {
        console.error('Failed to load IndexedDB finance data:', err);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async createExpense({ commit }, expenseData) {
      const saved = await addTransaction({
        ...expenseData,
        type: 'expense'
      });
      commit('ADD_TRANSACTION', saved);
      return saved;
    },

    async removeTransaction({ commit }, id) {
      await deleteTransaction(id);
      commit('REMOVE_TRANSACTION', id);
    },

    async resetBaseline({ commit }) {
      commit('SET_LOADING', true);
      try {
        await clearTransactions();
        const fresh = await seedInitialDataIfEmpty();
        commit('SET_TRANSACTIONS', fresh);
      } finally {
        commit('SET_LOADING', false);
      }
    }
  }
};
