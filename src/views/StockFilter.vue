<template>
  <div class="stock-filter-page">
    <!-- 导航栏 -->
    <el-header class="app-header">
      <div class="header-container">
        <div class="header-left">
          <h2 class="app-title">选股助手</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ currentUser }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <el-row :gutter="20">
        <!-- 筛选面板 -->
        <el-col :span="24">
          <FilterPanel 
            @filter-change="handleFilterChange"
            @search="handleSearch"
          />
        </el-col>
      </el-row>

      <!-- 筛选结果表格 -->
      <div class="filter-results-table">
        <el-card class="results-card" shadow="never">
          <template #header>
            <div class="results-header">
              <span class="results-title">筛选结果</span>
              <span class="results-count">
                共找到 {{ stockList.length }} 只股票
              </span>
            </div>
          </template>

          <!-- 股票列表表格 -->
          <div class="stock-table">
            <el-table 
              :data="stockList" 
              style="width: 100%"
              empty-text="请设置筛选条件后查看结果"
              height="400"
            >
              <el-table-column prop="code" label="股票代码" width="100" align="center" />
              <el-table-column prop="name" label="股票名称" width="120" align="center" />
              <el-table-column prop="price" label="当前价格" width="100" align="center" />
              <el-table-column prop="change" label="涨跌额" width="100" align="center" />
              <el-table-column prop="changePercent" label="涨跌幅" width="100" align="center" />
              <el-table-column prop="pe" label="市盈率" width="80" align="center" />
              <el-table-column prop="pb" label="市净率" width="80" align="center" />
              <el-table-column prop="roe" label="ROE%" width="80" align="center" />
              <el-table-column prop="revenue" label="营业收入(亿)" width="120" align="center" />
              <el-table-column prop="netProfit" label="净利润(亿)" width="110" align="center" />
              <el-table-column prop="grossMargin" label="毛利率%" width="100" align="center" />
              <el-table-column label="操作" width="120" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button 
                    type="text" 
                    size="small"
                    @click="handleViewDetail(row)"
                  >
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 股票详情对话框 -->
    <el-dialog
      v-model="showStockDetail"
      title="股票详情"
      width="60%"
      center
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
          <el-descriptions-item label="营业收入">{{ currentStock.revenue }}亿元</el-descriptions-item>
          <el-descriptions-item label="净利润">{{ currentStock.netProfit }}亿元</el-descriptions-item>
          <el-descriptions-item label="市盈率">{{ currentStock.pe }}</el-descriptions-item>
          <el-descriptions-item label="市净率">{{ currentStock.pb }}</el-descriptions-item>
          <el-descriptions-item label="ROE">{{ currentStock.roe }}%</el-descriptions-item>
          <el-descriptions-item label="MACD">{{ currentStock.macd }}</el-descriptions-item>
          <el-descriptions-item label="KDJ">{{ currentStock.kdj }}</el-descriptions-item>
          <el-descriptions-item label="大单净量">{{ currentStock.bigOrderNet }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import FilterPanel from '../components/FilterPanel/FilterPanel.vue'
import { getStocksByFilter } from '../api/stockAPI.js'

export default {
  name: 'StockFilter',
  components: {
    FilterPanel
  },
  setup() {
    const router = useRouter()
    const currentFilters = reactive({})
    const stockList = ref([])
    const searchLoading = ref(false)
    const showStockDetail = ref(false)
    const currentStock = ref(null)
    
    // 获取当前用户信息
    const currentUser = computed(() => localStorage.getItem('username') || '用户')
    
    // 处理筛选条件变化
    const handleFilterChange = (filterData) => {
      if (filterData.allFilters) {
        Object.assign(currentFilters, filterData.allFilters)
      }
    }
    
    // 处理搜索
    const handleSearch = async (filters) => {
      searchLoading.value = true
      
      try {
        const response = await getStocksByFilter(filters)
        
        if (response.data?.stocks) {
          stockList.value = response.data.stocks
          ElMessage.success(`搜索完成，找到 ${stockList.value.length} 只股票`)
        } else {
          stockList.value = []
          ElMessage.info('未找到符合条件的股票')
        }
      } catch (error) {
        console.error('搜索股票失败:', error)
        ElMessage.error('搜索失败，请稍后重试')
        stockList.value = []
      } finally {
        searchLoading.value = false
      }
    }
    
    // 查看股票详情
    const handleViewDetail = (stock) => {
      currentStock.value = stock
      showStockDetail.value = true
    }
    
    // 获取价格颜色类名
    const getPriceClass = (change) => {
      if (change > 0) return 'price-up'
      if (change < 0) return 'price-down'
      return 'price-neutral'
    }
    
    // 处理下拉菜单命令
    const handleCommand = async (command) => {
      if (command === 'logout') {
        try {
          await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          
          // 清除登录状态
          localStorage.removeItem('isLoggedIn')
          localStorage.removeItem('username')
          
          ElMessage.success('已退出登录')
          router.push('/login')
        } catch (error) {
          // 用户取消退出
        }
      }
    }
    
    return {
      currentFilters,
      stockList,
      searchLoading,
      showStockDetail,
      currentStock,
      currentUser,
      handleFilterChange,
      handleSearch,
      handleViewDetail,
      getPriceClass,
      handleCommand
    }
  }
}
</script>

<style scoped>
.stock-filter-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.app-title {
  color: #1e293b;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-info {
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.user-info:hover {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #3b82f6;
  transform: translateY(-1px);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 20px;
}

.filter-results-table {
  margin-top: 15px;
}

.results-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.results-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.results-count {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* 价格颜色样式 */
.price-up {
  color: #ef4444;
  font-weight: 600;
}

.price-down {
  color: #22c55e;
  font-weight: 600;
}

.price-neutral {
  color: #64748b;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-content {
    padding: 0 15px 15px;
  }
}
</style> 