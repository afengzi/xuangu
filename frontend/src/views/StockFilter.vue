<template>
  <div class="stock-filter-page">
    <!-- 导航栏组件 -->
    <AppHeader @logout="handleLogout" />

    <!-- 主要内容区域 -->
    <div class="page-content">
      <el-row :gutter="20">
        <!-- 筛选面板 -->
        <el-col :span="24">
          <FilterPanel 
            @filter-change="handleFilterChange"
          />
        </el-col>
      </el-row>

      <!-- 股票表格组件 -->
      <StockTable
        :stock-list="stockList"
        :is-theme-mode="isThemeMode"
        :theme-columns="themeColumns"
        :data-columns="dataColumns"
        :show-time-filter="showTimeFilter"
        v-model:date-range="dateRange"
        @date-range-change="handleDateRangeChange"
              @sort-change="handleSortChange"
        @view-detail="handleViewDetail"
      />
    </div>

    <!-- 股票详情对话框组件 -->
    <StockDetail
      v-model="showStockDetail"
      :current-stock="currentStock"
      @close="showStockDetail = false"
    />
  </div>
</template>

<script>
import FilterPanel from '../components/business/FilterPanel/FilterPanel.vue'
import AppHeader from '../components/common/AppHeader/AppHeader.vue'
import StockTable from '../components/common/StockTable/StockTable.vue'
import StockDetail from '../components/business/StockDetail/StockDetail.vue'
import { useStockFilter } from '../composables/useStockFilter.js'
import { useStockTable } from '../components/common/StockTable/StockTable.js'

export default {
  name: 'StockFilter',
  components: {
    FilterPanel,
    AppHeader,
    StockTable,
    StockDetail
  },
  setup() {
    const stockFilter = useStockFilter()
    const stockTable = useStockTable()

    // 处理筛选条件变化
    const handleFilterChange = (filterData) => {
      // 清除股票详情缓存，确保在筛选条件变化后能获取最新的详情数据
      if (stockTable.tooltipCache && typeof stockTable.tooltipCache.value.clear === 'function') {
        stockTable.tooltipCache.value.clear();
      }
      
      // 调用原始的处理函数
      stockFilter.handleFilterChange(filterData)
    }

    const handleLogout = () => {}

    return {
      ...stockFilter,
      handleFilterChange, // 使用自定义的处理函数
      handleLogout
    }
  }
}
</script>

<style scoped>
.stock-filter-page {
  width: 70%;
  margin: 0 auto;
  padding: 5px 0;
}

.page-content {
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stock-filter-page {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .stock-filter-page {
    width: 95%;
  }
}
</style>