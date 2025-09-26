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

    const handleLogout = () => {}

    return {
      ...stockFilter,
      handleLogout
    }
  }
}
</script>

<style scoped>
@import '../styles/stockFilter.css';
</style> 