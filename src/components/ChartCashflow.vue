<template>
  <div class="card chart-container">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Cashflow Evolution</h3>
        <span class="chart-subtitle">Daily Gross Inflow (Sales) vs Operating Outflow (Expenses)</span>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="dot emerald"></span> Inflow</span>
        <span class="legend-item"><span class="dot rose"></span> Outflow</span>
        <span class="legend-item"><span class="dot blue"></span> Net</span>
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
  name: 'ChartCashflow',
  data() {
    return {
      chart: null
    };
  },
  computed: {
    ...mapGetters('finance', ['cashflowTimeline'])
  },
  watch: {
    cashflowTimeline: {
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

      const data = this.cashflowTimeline;
      const ctx = this.$refs.canvas.getContext('2d');

      // Create gradient fills
      const gradientInflow = ctx.createLinearGradient(0, 0, 0, 300);
      gradientInflow.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      gradientInflow.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      const gradientOutflow = ctx.createLinearGradient(0, 0, 0, 300);
      gradientOutflow.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
      gradientOutflow.addColorStop(1, 'rgba(244, 63, 94, 0.0)');

      const chartConfig = {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Gross Inflow ($)',
              data: data.revenues,
              borderColor: '#10B981',
              backgroundColor: gradientInflow,
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointRadius: 2,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#10B981'
            },
            {
              label: 'Operating Outflow ($)',
              data: data.expenses,
              borderColor: '#F43F5E',
              backgroundColor: gradientOutflow,
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 2,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#F43F5E'
            },
            {
              label: 'Net Balance ($)',
              data: data.net,
              borderColor: '#3B82F6',
              borderWidth: 1.5,
              borderDash: [4, 4],
              tension: 0.2,
              fill: false,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#F8FAFC',
              bodyColor: '#E2E8F0',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(context.parsed.y);
                  }
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
                font: { family: 'Plus Jakarta Sans', size: 11 }
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
  margin-bottom: 16px;
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
  gap: 14px;
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
.dot.blue { background: var(--accent-blue); }

.canvas-wrapper {
  position: relative;
  height: 280px;
  width: 100%;
}
</style>
