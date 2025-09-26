<template>
  <el-dialog
    v-model="visible"
    title="股票详情"
    width="60%"
    center
    @close="handleClose"
  >
    <div v-if="currentStock" class="stock-detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="股票代码">{{ currentStock.code }}</el-descriptions-item>
        <el-descriptions-item label="股票名称">{{ currentStock.name }}</el-descriptions-item>
        <el-descriptions-item label="当前价格">
          <span :class="getPriceClass(currentStock.change)">
            ¥{{ currentStock.price.toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="涨跌幅">
          <span :class="getPriceClass(currentStock.change)">
            {{ currentStock.changePercent > 0 ? '+' : '' }}{{ currentStock.changePercent.toFixed(2) }}%
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="营业收入">{{ formatYiYuan(null, null, currentStock.revenue) }}</el-descriptions-item>
        <el-descriptions-item label="净利润">{{ formatYiYuan(null, null, currentStock.netProfit) }}</el-descriptions-item>
        <el-descriptions-item label="市盈率">{{ currentStock.pe }}</el-descriptions-item>
        <el-descriptions-item label="市净率">{{ currentStock.pb }}</el-descriptions-item>
        <el-descriptions-item label="ROE">{{ currentStock.roe }}%</el-descriptions-item>
        <el-descriptions-item label="MACD">{{ currentStock.macd }}</el-descriptions-item>
        <el-descriptions-item label="KDJ">{{ currentStock.kdj }}</el-descriptions-item>
        <el-descriptions-item label="大单净量">{{ currentStock.bigOrderNet }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>

<script>
import { computed } from 'vue'
import { getPriceClass, formatYiYuan } from '../../../utils/formatters/stockFormatters.js'

export default {
  name: 'StockDetail',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    currentStock: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const handleClose = () => {
      emit('close')
    }

    return {
      visible,
      handleClose,
      getPriceClass,
      formatYiYuan
    }
  }
}
</script>

<style scoped>
.stock-detail {
  padding: 20px 0;
}

/* 价格颜色样式 */
:deep(.price-up) {
  color: #ef4444;
  font-weight: 600;
}

:deep(.price-down) {
  color: #22c55e;
  font-weight: 600;
}

:deep(.price-neutral) {
  color: #64748b;
  font-weight: 600;
}
</style>
