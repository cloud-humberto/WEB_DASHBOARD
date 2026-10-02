import {
  probePosStatus,
  fetchPosDailyReport,
  syncPosSalesToDatabase
} from '@/services/posSync';

export default {
  namespaced: true,

  state: () => ({
    isPosOnline: false,
    isChecking: false,
    isSyncing: false,
    lastSyncStats: null,
    posSummary: null
  }),

  getters: {
    connectionBadge: (state) => {
      if (state.isChecking) return { text: 'Checking POS...', status: 'loading' };
      if (state.isPosOnline) return { text: 'NovaPOS Online (Port 3001)', status: 'online' };
      return { text: 'Offline Demo (IndexedDB)', status: 'offline' };
    }
  },

  mutations: {
    SET_CHECKING(state, val) {
      state.isChecking = val;
    },
    SET_ONLINE(state, val) {
      state.isPosOnline = val;
    },
    SET_SYNCING(state, val) {
      state.isSyncing = val;
    },
    SET_SYNC_STATS(state, stats) {
      state.lastSyncStats = stats;
    },
    SET_POS_SUMMARY(state, summary) {
      state.posSummary = summary;
    }
  },

  actions: {
    async checkConnection({ commit }) {
      commit('SET_CHECKING', true);
      try {
        const isOnline = await probePosStatus();
        commit('SET_ONLINE', isOnline);

        if (isOnline) {
          const report = await fetchPosDailyReport();
          commit('SET_POS_SUMMARY', report.summary || null);
        }
        return isOnline;
      } catch (err) {
        commit('SET_ONLINE', false);
        return false;
      } finally {
        commit('SET_CHECKING', false);
      }
    },

    async syncSalesWithDashboard({ commit, dispatch }) {
      commit('SET_SYNCING', true);
      try {
        const stats = await syncPosSalesToDatabase();
        commit('SET_SYNC_STATS', stats);

        // Reload finance transactions into the store
        await dispatch('finance/loadData', null, { root: true });
        return stats;
      } catch (err) {
        console.error('POS sync error:', err);
        throw err;
      } finally {
        commit('SET_SYNCING', false);
      }
    }
  }
};
