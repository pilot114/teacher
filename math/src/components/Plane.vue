<template>
    <line-chart
        ref="chart"
        width="100%"
        height="700px"
        :data="data"
        :library="chartOptions"
        label="y"
        :min="min"
        :max="max"
        :legend="true"
    />
</template>

<script>
export default {
  name: 'Plane',
  props: {
    data: Object,
    min: Number,
    max: Number,
    logarithmic: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#2c3e50'
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => {
                if (items.length > 0) {
                  return `x: ${items[0].parsed.x.toFixed(3)}`;
                }
                return '';
              },
              label: (context) => {
                return `${context.dataset.label || 'y'}: ${context.parsed.y.toFixed(3)}`;
              }
            }
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
            },
            pan: {
              enabled: true,
              mode: 'xy',
            },
            limits: {
              x: {min: -1000, max: 1000},
              y: {min: -1000, max: 1000}
            }
          }
        },
        scales: {
          x: {
            type: this.logarithmic ? 'logarithmic' : 'linear',
            title: {
              display: true,
              text: 'x',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#2c3e50'
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#ddd'
            }
          },
          y: {
            type: this.logarithmic ? 'logarithmic' : 'linear',
            title: {
              display: true,
              text: 'y',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#2c3e50'
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#ddd'
            }
          }
        },
        elements: {
          point: {
            radius: 0,
            hitRadius: 5,
            hoverRadius: 3
          },
          line: {
            borderWidth: 2,
            tension: 0.1
          }
        }
      };
    }
  }
}
</script>

<style scoped>
</style>
