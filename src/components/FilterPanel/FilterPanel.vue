<template>
  <div class="filter-panel">
    <el-card class="filter-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">股票筛选条件</span>
        </div>
      </template>
      
      <div class="filter-content">
        <!-- 筛选分类行 -->
        <div 
          v-for="(category, categoryKey) in filterCategories" 
          :key="categoryKey"
          class="filter-category-row"
        >
          <!-- 左侧分类名称 -->
          <div class="category-label">
            <span 
              class="category-name"
              :class="{ 'disabled': category.status === 'pending' }"
            >
              {{ category.name }}
            </span>
          </div>
          
          <!-- 右侧筛选条件 -->
          <div class="category-conditions">
            <div 
              v-if="category.status === 'active' && filterConditions[categoryKey]"
              class="conditions-container"
            >
              <FilterItem
                v-for="(condition, conditionKey) in filterConditions[categoryKey]"
                :key="conditionKey"
                :condition="condition"
                :condition-key="conditionKey"
                :selected-value="selectedFilters[categoryKey]?.[conditionKey] || ''"
                :disabled="category.status === 'pending'"
                :selector-id="`${categoryKey}-${conditionKey}`"
                :is-selector-open="currentOpenSelector === `${categoryKey}-${conditionKey}`"
                @item-change="handleItemChange(categoryKey, $event)"
                @selector-open="handleSelectorOpen(`${categoryKey}-${conditionKey}`)"
                @selector-close="handleSelectorClose"
              />
            </div>
            
            <!-- 待开发状态 -->
            <div 
              v-else-if="category.status === 'pending'"
              class="pending-status"
            >
              <span class="pending-text">待开发</span>
            </div>
            
            <!-- 加载状态 -->
            <div 
              v-else
              class="loading-status"
            >
              <el-skeleton :rows="2" animated />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部操作区域 -->
      <div class="filter-actions">
        <div class="selected-summary">
          <span class="summary-text">
            已选择 {{ selectedCount }} 个筛选条件
          </span>
        </div>
        
        <div class="action-buttons">
          <el-button @click="handleReset">清除条件</el-button>
          <el-button 
            type="primary"
            :disabled="selectedCount === 0"
            @click="handleSearch"
          >
            开始筛选
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import FilterItem from './FilterItem.vue'
import { getFilterCategories, getFilterConditions } from '../../api/stockAPI.js'
import { FILTER_CATEGORIES } from '../../utils/constants.js'

export default {
  name: 'FilterPanel',
  components: {
    FilterItem
  },
  emits: ['filter-change', 'search'],
  setup(props, { emit }) {
    const filterCategories = ref({})
    const filterConditions = reactive({})
    const selectedFilters = reactive({})
    const loading = ref(false)
    // 添加状态来跟踪当前打开的选择器
    const currentOpenSelector = ref(null)
    
    // 计算已选择的筛选条件数量
    const selectedCount = computed(() => {
      let count = 0
      Object.values(selectedFilters).forEach(categoryFilters => {
        if (categoryFilters) {
          count += Object.values(categoryFilters).filter(value => value).length
        }
      })
      return count
    })
    
    // 初始化筛选分类
    const initFilterCategories = async () => {
      try {
        // 使用本地常量数据作为初始化
        filterCategories.value = { ...FILTER_CATEGORIES }
        
        // 尝试从API获取最新配置（在Mock环境下会返回相同数据）
        const response = await getFilterCategories()
        if (response.data) {
          filterCategories.value = response.data
        }
      } catch (error) {
        console.error('获取筛选分类失败:', error)
        // 使用本地默认配置
        filterCategories.value = { ...FILTER_CATEGORIES }
      }
    }
    
    // 加载筛选条件
    const loadFilterConditions = async (categoryKey) => {
      if (filterCategories.value[categoryKey]?.status !== 'active') return
      
      try {
        const response = await getFilterConditions(categoryKey)
        if (response.data) {
          filterConditions[categoryKey] = response.data
        }
      } catch (error) {
        console.error(`获取${categoryKey}筛选条件失败:`, error)
        ElMessage.error(`加载${filterCategories.value[categoryKey]?.name}筛选条件失败`)
      }
    }
    
    // 处理筛选项变化
    const handleItemChange = (categoryKey, changeData) => {
      if (!selectedFilters[categoryKey]) {
        selectedFilters[categoryKey] = {}
      }
      
      selectedFilters[categoryKey][changeData.key] = changeData.value
      
      // 触发变化事件
      emit('filter-change', {
        category: categoryKey,
        condition: changeData.key,
        value: changeData.value,
        allFilters: { ...selectedFilters }
      })
    }
    
    // 处理选择器状态
    const handleSelectorOpen = (selectorId) => currentOpenSelector.value = selectorId
    const handleSelectorClose = () => currentOpenSelector.value = null
    
    // 重置筛选条件
    const handleReset = () => {
      Object.keys(selectedFilters).forEach(key => delete selectedFilters[key])
      emit('filter-change', { category: null, condition: null, value: null, allFilters: {} })
      ElMessage.success('筛选条件已重置')
    }
    
    // 开始筛选
    const handleSearch = () => {
      if (selectedCount.value === 0) {
        ElMessage.warning('请至少选择一个筛选条件')
        return
      }
      
      emit('search', { ...selectedFilters })
      ElMessage.success(`开始筛选，共使用 ${selectedCount.value} 个条件`)
    }
    
    // 组件挂载后初始化
    onMounted(async () => {
      loading.value = true
      
      try {
        // 初始化分类
        await initFilterCategories()
        
        // 加载活跃分类的筛选条件
        const activeCategories = Object.keys(filterCategories.value)
          .filter(key => filterCategories.value[key].status === 'active')
        
        // 并行加载所有活跃分类的条件
        await Promise.all(activeCategories.map(loadFilterConditions))
      } catch (error) {
        console.error('初始化筛选面板失败:', error)
        ElMessage.error('加载筛选条件失败')
      } finally {
        loading.value = false
      }
    })
    
    return {
      filterCategories,
      filterConditions,
      selectedFilters,
      loading,
      selectedCount,
      currentOpenSelector,
      handleItemChange,
      handleSelectorOpen,
      handleSelectorClose,
      handleReset,
      handleSearch
    }
  }
}
</script>

<style scoped>
.filter-panel {
  width: 100%;
}

.filter-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}



.filter-content {
  padding: 0;
}

.filter-category-row {
  display: flex;
  align-items: flex-start;
  min-height: 45px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.filter-category-row:hover {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.filter-category-row:last-child {
  border-bottom: none;
}

.category-label {
  flex: 0 0 100px;
  padding-right: 16px;
  display: flex;
  align-items: flex-start;
  min-height: 36px;
  padding-top: 6px;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.category-name.disabled {
  color: #94a3b8;
}

.category-conditions {
  flex: 1;
  min-height: 36px;
}

.conditions-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 3px;
  align-items: flex-start;
}

.pending-status,
.loading-status {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 6px 12px;
}

.pending-text {
  font-size: 14px;
  color: #94a3b8;
  font-style: italic;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 0 0;
  border-top: 1px solid #f1f5f9;
  margin-top: 12px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 0 0 12px 12px;
  margin: 12px -20px 0 -20px;
  padding: 12px 20px;
}

.selected-summary {
  flex: 1;
}

.summary-text {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style> 