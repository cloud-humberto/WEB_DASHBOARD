<template>
  <div class="card chart-container">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Category Inflow vs Outflow</h3>
        <span class="chart-subtitle">Financial volume grouped by commercial category</span>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="dot emerald"></span> Sales Revenue</span>
        <span class="legend-item"><span class="dot rose"></span> Operating Expense</span>
      </div>
    </div>
    <div class="canvas-wrapper">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script>
import { Chart } from 'chart.js/auto';
import { mapGetters } from 'vuex';

export default {
  name: 'ChartTopCategories',
  data() {
    return {
      chart: null
    };
  },
  computed: {
    ...mapGetters('finance', ['categoryBreakdown'])
  },
  watch: {
    categoryBreakdown: {
      deep: true,
      handler() {
        this.renderOrUpdateChart();
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.renderOrUpdateChart();
    });
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
  methods: {
    renderOrUpdateChart() {
      if (!this.$refs.canvas) return;

      const data = this.categoryBreakdown;
      const ctx = this.$refs.canvas.getContext('2d');

      const chartConfig = {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Sales Revenue ($)',
              data: data.revenues,
              backgroundColor: '#10B981',
              borderRadius: 4,
              maxBarThickness: 16
            },
            {
              label: 'Operating Expense ($)',
              data: data.expenses,
              backgroundColor: '#F43F5E',
              borderRadius: 4,
              maxBarThickness: 16
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#F8FAFC',
              bodyColor: '#E2E8F0',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(context.parsed.y || 0);
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#64748B',
                font: { family: 'Plus Jakarta Sans', size: 10 }
              }
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#64748B',
                font: { family: 'Plus Jakarta Sans', size: 11 },
                callback: (val) => `$${val}`
              }
            }
          }
        }
      };

      if (this.chart) {
        this.chart.data = chartConfig.data;
        this.chart.update('none');
      } else {
        this.chart = new Chart(ctx, chartConfig);
      }
    }
  }
};
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.emerald { background: var(--accent-emerald); }
.dot.rose { background: var(--accent-rose); }

.canvas-wrapper {
  position: relative;
  height: 240px;
  width: 100%;
}
</style>
