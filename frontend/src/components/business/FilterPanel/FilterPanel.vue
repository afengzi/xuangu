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
          :class="{ 'indicator-row': categoryKey === 'indicator' }"
        >
          <!-- 左侧分类名称 -->
          <div class="category-label">
            <span 
              class="category-name"
              :class="{ 'disabled': category.status === 'pending' }"
            >
              <template v-if="categoryKey === 'indicator'">
                <el-icon class="indicator-icon"><TrendCharts /></el-icon>
                <span class="indicator-badge">特色指标</span>
              </template>
              <template v-else>
                {{ category.name }}
              </template>
            </span>
          </div>
          
          <!-- 右侧筛选条件 -->
          <div class="category-conditions">
            <!-- 热门概念：直接多行展示题材名称 -->
            <div v-if="categoryKey === 'hotConcept' && category.status === 'active'" class="conditions-container">
              <div class="hot-theme-list" title="热门概念">
                <!-- 显示前10个热门题材 -->
                <el-tag
                  v-for="t in topThemes"
                  :key="t.name"
                  class="hot-theme-tag"
                  :class="{ selected: selectedThemes.includes(t.name) }"
                  effect="plain"
                  :type="selectedThemes.includes(t.name) ? 'primary' : 'info'"
                  @click="handleSelectTheme(t.name)"
                >
                  <span class="theme-name">{{ t.name }}</span>
                  <el-icon v-if="selectedThemes.includes(t.name)" class="cancel-btn" @click.stop="handleSelectTheme(t.name)"><Close /></el-icon>
                </el-tag>
                
                <!-- 更多按钮 -->
                <el-tag
                  v-if="allThemes.length > 10"
                  ref="moreButtonRef"
                  class="hot-theme-tag more-btn"
                  effect="plain"
                  type="info"
                  @click="showMoreThemes"
                >
                  更多({{ allThemes.length - 10 }})
                </el-tag>
              </div>
            </div>

            <!-- 特色指标：独立按钮渲染，每个静态项一个按钮 -->
            <div 
              v-else-if="categoryKey === 'indicator' && category.status === 'active'"
              class="conditions-container"
            >
              <div class="indicator-list" title="特色指标">
                <el-tag
                  v-for="opt in indicatorOptions"
                  :key="opt"
                  class="indicator-btn"
                  :class="{ selected: selectedFilters.indicator?.special === opt }"
                  effect="plain"
                  :type="selectedFilters.indicator?.special === opt ? 'primary' : 'info'"
                  @click="handleSelectIndicator(opt)"
                >
                  <span>{{ opt }}</span>
                  <el-icon v-if="selectedFilters.indicator?.special === opt" class="cancel-btn" @click.stop="clearIndicator"><Close /></el-icon>
                </el-tag>
              </div>
            </div>

            <!-- 其他分类：沿用原有 FilterItem 渲染 -->
            <div 
              v-else-if="category.status === 'active' && filterConditions[categoryKey]"
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
        </div>
      </div>
    </el-card>

    <!-- 更多题材弹窗 - 显示在更多按钮下方（使用虚拟触发元素） -->
    <el-popover
      :visible="moreThemesPopoverVisible"
      placement="bottom-start"
      :width="400"
      trigger="manual"
      popper-class="theme-selector-popover"
      :offset="8"
      :virtual-ref="moreButtonEl"
      virtual-triggering
      @show="handlePopoverShow"
      @hide="handlePopoverHide"
    >
      
      <div class="theme-content">
        <div class="theme-header">
          <span class="theme-title">所有热门题材</span>
          <el-button 
            link
            class="close-btn"
            @click="handlePopoverClose"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <div class="theme-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索题材名称"
            clearable
            size="small"
            class="search-input"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="theme-list">
          <div 
            v-for="theme in filteredThemes" 
            :key="theme.name"
            class="theme-item"
            :class="{ 'selected': selectedThemes.includes(theme.name) }"
            @click="handleSelectThemeFromPopover(theme.name)"
          >
            <span class="theme-name">{{ theme.name }}</span>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import FilterItem from './FilterItem.vue'
// 1) 使用静态常量
import { FILTER_CATEGORIES, ALL_FILTERS } from '../../../utils/constants.js'
import { get } from '../../../api/index.js'
import { getAllThemes, getThemesInfo } from '../../../api/stockAPI.js'
import { getThemesData } from '../../../utils/themesCache.js'
import { Close, Search } from '@element-plus/icons-vue'
import { TrendCharts } from '@element-plus/icons-vue'

export default {
  name: 'FilterPanel',
  components: { FilterItem },
  emits: ['filter-change'],
  setup(props, { emit }) {
    const filterCategories = ref({})
    const filterConditions = reactive({})
    const selectedFilters = reactive({})
    const allThemes = ref([])
    const selectedThemes = ref([]) // 改为数组支持多选
    const loading = ref(false)
    const currentOpenSelector = ref(null)
    const moreThemesPopoverVisible = ref(false)
    const searchKeyword = ref('')
    const moreButtonRef = ref(null)
    const moreButtonEl = computed(() => {
      const r = Array.isArray(moreButtonRef.value) ? moreButtonRef.value[0] : moreButtonRef.value
      return r ? (r.$el || r) : null
    })

    const selectedCount = computed(() => {
      let count = 0
      Object.values(selectedFilters).forEach(categoryFilters => {
        if (categoryFilters) {
          count += Object.values(categoryFilters).filter(v => v).length
        }
      })
      return count
    })

    // 计算前10个热门题材
    const topThemes = computed(() => {
      return allThemes.value.slice(0, 10)
    })

    // 计算过滤后的题材列表（用于弹窗搜索）
    const filteredThemes = computed(() => {
      if (!searchKeyword.value.trim()) {
        return allThemes.value
      }
      const keyword = searchKeyword.value.toLowerCase()
      return allThemes.value.filter(theme => 
        theme.name.toLowerCase().includes(keyword)
      )
    })

    // 2) 直接使用静态数据初始化
    const initStaticFilters = () => {
      filterCategories.value = { ...FILTER_CATEGORIES }
      const active = Object.keys(filterCategories.value).filter(k => filterCategories.value[k].status === 'active')
      active.forEach(k => { filterConditions[k] = ALL_FILTERS[k] || {} })
    }

    // 特色指标可选项（使用全局配置）
const indicatorOptions = computed(() => {
  return ALL_FILTERS?.indicator?.special?.ranges || ['打板','抄底','低吸','追涨','龙头']
})

    const clearThemeSelection = () => {
      selectedThemes.value = []
      if (selectedFilters.hotConcept) {
        delete selectedFilters.hotConcept.themes
        if (Object.keys(selectedFilters.hotConcept).length === 0) delete selectedFilters.hotConcept
      }
      emit('filter-change', {
        category: 'hotConcept',
        condition: 'themeResult',
        value: '',
        allFilters: { ...selectedFilters },
        themeRows: []
      })
    }

    // 显示更多题材弹窗
    const showMoreThemes = async () => {
      await nextTick()
      moreThemesPopoverVisible.value = true
      searchKeyword.value = ''
    }

    // 从弹窗中选择题材
    const handleSelectThemeFromPopover = (themeName) => {
      if (selectedThemes.value.includes(themeName)) {
        // 如果已选中，则取消选择
        selectedThemes.value = selectedThemes.value.filter(t => t !== themeName)
      } else {
        // 如果未选中，则添加到选择列表
        selectedThemes.value.push(themeName)
      }
      
      if (!selectedFilters.hotConcept) selectedFilters.hotConcept = {}
      selectedFilters.hotConcept.themes = [...selectedThemes.value]
      
      // 关闭弹窗
      moreThemesPopoverVisible.value = false
      
      // 通知父组件有变更
      emit('filter-change', {
        category: 'hotConcept',
        condition: 'theme',
        value: selectedThemes.value,
        allFilters: { ...selectedFilters }
      })
    }

    // 处理搜索
    const handleSearch = () => {
      // 搜索逻辑已在computed中处理
    }

    // 处理弹窗显示/隐藏
    const handlePopoverShow = () => {
      searchKeyword.value = ''
    }

    const handlePopoverHide = () => {
      // 无需额外处理
    }

    // 处理弹窗关闭
    const handlePopoverClose = () => {
      moreThemesPopoverVisible.value = false
    }

    // 加载热门概念题材名称，并注入为"热门概念"分类的条件（优化版本）
    const loadThemes = async () => {
      try {
        // 先直接设置为激活状态，避免显示加载状态
        if (!filterCategories.value.hotConcept) {
          filterCategories.value.hotConcept = { name: '热门概念', status: 'active' }
        } else {
          filterCategories.value.hotConcept.status = 'active'
        }
        
        // 使用智能缓存获取题材数据
        const result = await getThemesData(getAllThemes)
        const list = result.themes || []
        
        // 静默记录数据来源，不显示调试信息
        if (result.fromCache) {
          // 缓存数据，无需显示加载状态
        } else {
          // API数据，静默更新
        }
        // 处理题材数据，包含人气值信息
        let themesArray = []
        if (Array.isArray(list)) {
          themesArray = list.map(theme => {
            // 如果后端返回的是对象格式（包含人气值）
            if (typeof theme === 'object' && theme.name) {
              return {
                name: theme.name,
                stockCount: theme.stock_count || 0,
                maxHotNum: theme.max_hot_num || 0,
                totalHotNum: theme.total_hot_num || 0
              }
            }
            // 如果后端返回的是字符串格式（兼容旧格式）
            else if (typeof theme === 'string') {
              return { name: theme, stockCount: 0, maxHotNum: 0, totalHotNum: 0 }
            }
            return { name: theme, stockCount: 0, maxHotNum: 0, totalHotNum: 0 }
          })
        }
        
        // 按热度值排序（优先按最大热度值，然后按总热度值，最后按股票数量）
        themesArray.sort((a, b) => {
          // 首先按最大热度值排序
          if (a.maxHotNum !== b.maxHotNum) {
            return b.maxHotNum - a.maxHotNum
          }
          // 然后按总热度值排序
          if (a.totalHotNum !== b.totalHotNum) {
            return b.totalHotNum - a.totalHotNum
          }
          // 最后按股票数量排序
          return b.stockCount - a.stockCount
        })
        
        allThemes.value = themesArray
        // 热门概念数据已加载完成，保持激活状态
      } catch (e) {
        // 拉取失败时保持激活状态，显示空列表
        console.error('加载题材列表失败:', e)
        allThemes.value = []
        // 热门概念保持激活状态，用户可以正常操作
      }
    }

    // 选择题材：与其他条件保持一致的事件模型
    const handleSelectTheme = (t) => {
      if (selectedThemes.value.includes(t)) {
        // 如果已选中，则取消选择
        selectedThemes.value = selectedThemes.value.filter(theme => theme !== t)
      } else {
        // 如果未选中，则添加到选择列表
        selectedThemes.value.push(t)
      }
      
      if (!selectedFilters.hotConcept) selectedFilters.hotConcept = {}
      selectedFilters.hotConcept.themes = [...selectedThemes.value]
      
      // 通知父组件有变更
      emit('filter-change', {
        category: 'hotConcept',
        condition: 'theme',
        value: selectedThemes.value,
        allFilters: { ...selectedFilters }
      })
    }


    const handleItemChange = (categoryKey, changeData) => {
      if (!selectedFilters[categoryKey]) selectedFilters[categoryKey] = {}

      // 当值为空（点击 ❌ 取消）时，移除该条件；若分类下已无任何条件，移除该分类
      if (!changeData.value) {
        delete selectedFilters[categoryKey][changeData.key]
        if (Object.keys(selectedFilters[categoryKey]).length === 0) {
          delete selectedFilters[categoryKey]
        }
      } else {
        selectedFilters[categoryKey][changeData.key] = changeData.value
      }

      emit('filter-change', {
        category: categoryKey,
        condition: changeData.key,
        value: changeData.value,
        allFilters: { ...selectedFilters }
      })
    }

    const handleSelectorOpen = (id) => currentOpenSelector.value = id
    const handleSelectorClose = () => currentOpenSelector.value = null

    const handleReset = () => {
      // 清空所有筛选条件
      Object.keys(selectedFilters).forEach(key => delete selectedFilters[key])
      // 清空题材选择
      selectedThemes.value = []
      // 发送清空事件
      emit('filter-change', { category: null, condition: null, value: null, allFilters: {} })
      ElMessage.success('筛选条件已重置')
    }

    // 选择/取消 特色指标
    const handleSelectIndicator = (opt) => {
      if (!selectedFilters.indicator) selectedFilters.indicator = {}
      if (selectedFilters.indicator.special === opt) {
        // 二次点击同一项 -> 取消
        delete selectedFilters.indicator.special
        if (Object.keys(selectedFilters.indicator).length === 0) delete selectedFilters.indicator
        emit('filter-change', { category: 'indicator', condition: 'special', value: '', allFilters: { ...selectedFilters } })
      } else {
        selectedFilters.indicator.special = opt
        emit('filter-change', { category: 'indicator', condition: 'special', value: opt, allFilters: { ...selectedFilters } })
      }
    }

    const clearIndicator = () => {
      if (selectedFilters.indicator) {
        delete selectedFilters.indicator.special
        if (Object.keys(selectedFilters.indicator).length === 0) delete selectedFilters.indicator
        emit('filter-change', { category: 'indicator', condition: 'special', value: '', allFilters: { ...selectedFilters } })
      }
    }


    onMounted(async () => {
      loading.value = true
      initStaticFilters()
      
      // 先设置热门概念为激活状态，与其他分类保持一致
      filterCategories.value.hotConcept = { name: '热门概念', status: 'active' }
      
      // 后台异步加载题材数据，不阻塞界面展示
      loadThemes().catch(error => {
        console.warn('加载题材数据失败:', error)
        // 加载失败时保持激活状态，显示空列表
      })
      
      loading.value = false
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
      // indicator
      indicatorOptions,
      handleSelectIndicator,
      clearIndicator,
      // hot concepts
      allThemes,
      topThemes,
      selectedThemes,
      handleSelectTheme,
      clearThemeSelection,
      // 弹窗相关
      moreThemesPopoverVisible,
      searchKeyword,
      filteredThemes,
      moreButtonRef,
      moreButtonEl,
      showMoreThemes,
      handleSelectThemeFromPopover,
      handleSearch,
      handlePopoverShow,
      handlePopoverHide,
      handlePopoverClose
    }
  }
}
</script>

<style scoped>
.filter-panel {
  width: 100%;
}

/* ===== 指标专区 - 独特样式 ===== */
.indicator-row {
  position: relative;
  border-bottom: 1px solid #e0e7ff;
  background: linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(99,102,241,0.06) 100%);
  box-shadow: inset 0 0 0 1px rgba(99,102,241,0.15);
  transition: all 0.3s ease;
}

.indicator-row::before {
  /* 左侧高亮条 */
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 6px;
  border-radius: 0 6px 6px 0;
  background: linear-gradient(180deg, #60a5fa, #8b5cf6);
  box-shadow: 0 0 12px rgba(99,102,241,0.4);
}

.indicator-row:hover {
  background: linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(99,102,241,0.10) 100%);
  box-shadow: inset 0 0 0 1px rgba(99,102,241,0.25);
}

.indicator-icon {
  color: #4f46e5;
  margin-right: 6px;
  font-size: 24px;
}

.indicator-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  box-shadow: 0 6px 18px rgba(99,102,241,0.38);
}

.indicator-sub {
  margin-left: 6px;
  color: #4338ca;
  font-weight: 600;
}

/* 仅放大“特色指标”行的分类名字号 */
.indicator-row .category-name {
  font-size: 20px;
  line-height: 1.8;
}

/* 指标专区的“待开发”提示更显眼 */
.indicator-row .pending-status .pending-text {
  color: #4f46e5;
  font-weight: 600;
  background: rgba(99,102,241,0.08);
  border: 1px dashed rgba(99,102,241,0.35);
  padding: 4px 8px;
  border-radius: 6px;
}

/* 轻微高光扫光效果（可选） */
.indicator-row {
  overflow: hidden;
}
.indicator-row::after {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transform: skewX(-20deg);
  animation: shine 4s ease-in-out infinite;
}
@keyframes shine {
  0%   { left: -40%; }
  60%  { left: 120%; }
  100% { left: 120%; }
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
  min-height: 50px;
  padding: 14px 0;
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
  flex: 0 0 110px;
  padding-right: 18px;
  display: flex;
  align-items: center;
  min-height: 40px;
  justify-content: flex-end;
  text-align: right;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.5;
  white-space: nowrap;
}

.category-name.disabled {
  color: #94a3b8;
}

.category-conditions {
  flex: 1;
  min-height: 40px;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.conditions-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px 6px;
  align-items: center;
  width: 100%;
}

.pending-status,
.loading-status {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  width: 100%;
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

/* 热门概念标签样式，保持与其他条件一致的观感 */
.hot-theme-list { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px 6px; 
}

.hot-theme-tag {
  height: 32px;
  line-height: 30px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  box-sizing: border-box;
  cursor: default;
  display: inline-flex;
  flex: 0 0 auto; /* 禁止收缩换行 */
  white-space: nowrap; /* 标签内容不换行 */
  align-items: center;
  gap: 4px;
}

.hot-theme-tag:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.hot-theme-tag.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.hot-theme-tag.more-btn {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  font-weight: 600;
}

.hot-theme-tag.more-btn:hover {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  color: #b45309;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}


/* 特色指标按钮样式（与热门概念标签一致，色系略偏紫） */
.indicator-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 10px;
}

.indicator-btn {
  height: 42px;
  line-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: linear-gradient(#ffffffcc, #ffffffcc) padding-box,
              linear-gradient(135deg, #a78bfa, #60a5fa) border-box;
  backdrop-filter: blur(5px);
  font-size: 16px;
  color: #475569;
  font-weight: 500;
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 auto;
  white-space: nowrap;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 10px rgba(79, 70, 229, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
}

.indicator-btn:hover {
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.18);
}

.indicator-btn.selected {
  border-color: transparent;
  background: linear-gradient(#ffffff00, #ffffff00) padding-box,
              linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%) border-box;
  color: #fff;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35), inset 0 0 0 999px rgba(79, 70, 229, 0.10);
  animation: gradientShift 4s ease infinite;
}

@keyframes gradientShift {
  0% { filter: saturate(100%); }
  50% { filter: saturate(120%); }
  100% { filter: saturate(100%); }
}


.cancel-btn {
  margin-left: 6px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

/* 题材选择器弹窗样式 - 与DataRangeSelector保持一致 */
.theme-content {
  padding: 0;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.theme-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  padding: 0;
  font-size: 14px;
  color: #64748b;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #3b82f6;
  transform: scale(1.1);
}

.theme-search {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.95);
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__inner) {
  border-radius: 6px;
  font-size: 13px;
}

.theme-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 8px 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
}

.theme-list::-webkit-scrollbar {
  width: 6px;
}

.theme-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.theme-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.theme-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.theme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.theme-item:hover {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #1e40af;
  transform: translateX(2px);
}

.theme-item.selected {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 13px;
}

.theme-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


</style>

<style>
/* 题材选择器弹窗全局样式 - 与DataRangeSelector保持一致 */
.theme-selector-popover {
  padding: 0 !important;
  min-width: 360px !important;
  max-width: 400px !important;
  margin-top: 8px !important;
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  z-index: 3000 !important;
}

.theme-selector-popover .el-popover__arrow {
  display: none !important;
}
</style> 