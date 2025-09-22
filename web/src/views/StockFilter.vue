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
import FilterPanel from '../components/FilterPanel/FilterPanel.vue'
import AppHeader from '../components/AppHeader/AppHeader.vue'
import StockTable from '../components/StockTable/StockTable.vue'
import StockDetail from '../components/StockDetail/StockDetail.vue'
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
    // 使用组合式函数获取股票筛选相关逻辑
    const stockFilter = useStockFilter()
    
    // 处理退出登录
    const handleLogout = () => {
      // 可以在这里添加额外的退出登录逻辑
      console.log('用户已退出登录')
    }

    // 调试：监控数据状态
    console.log('StockFilter页面初始化:', {
      stockListLength: stockFilter.stockList.value.length,
      searchLoading: stockFilter.searchLoading.value,
      isThemeMode: stockFilter.isThemeMode.value
    })

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