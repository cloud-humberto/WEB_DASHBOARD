<template>
  <div class="card chart-container">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Payment Method Mix</h3>
        <span class="chart-subtitle">Revenue volume by tender type</span>
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
  name: 'ChartPaymentMethods',
  data() {
    return {
      chart: null
    };
  },
  computed: {
    ...mapGetters('finance', ['paymentMethodsBreakdown'])
  },
  watch: {
    paymentMethodsBreakdown: {
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

      const data = this.paymentMethodsBreakdown;
      const ctx = this.$refs.canvas.getContext('2d');

      const palette = [
        '#3B82F6', // Blue (Credit)
        '#10B981', // Emerald (Pix / Instant)
        '#F59E0B', // Amber (Cash)
        '#8B5CF6', // Purple (Debit)
        '#EC4899', // Pink
        '#64748B'  // Slate
      ];

      const chartConfig = {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [
            {
              data: data.values,
              backgroundColor: palette.slice(0, data.labels.length),
              borderWidth: 2,
              borderColor: '#111827',
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94A3B8',
                font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                padding: 14,
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#F8FAFC',
              bodyColor: '#E2E8F0',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (context) => {
                  const val = context.parsed || 0;
                  const formatted = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(val);
                  return ` ${context.label}: ${formatted}`;
                }
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
  margin-bottom: 12px;
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

.canvas-wrapper {
  position: relative;
  height: 280px;
  width: 100%;
}

@media (max-width: 640px) {
  .canvas-wrapper {
    height: 230px;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .canvas-wrapper {
    height: 180px;
  }
  .chart-header {
    margin-bottom: 6px;
  }
}
</style>
