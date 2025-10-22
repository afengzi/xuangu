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
                <!-- 固定显示前10个热门题材 -->
                <div
                  v-for="t in topThemes"
                  :key="t.name"
                  class="hot-theme-tag filter-tag"
                  :class="{ 'selected': selectedThemes.includes(t.name), 'has-value': selectedThemes.includes(t.name) }"
                  @click="handleSelectTheme(t.name)"
                >
                  <span class="theme-name">{{ t.name }}</span>
                </div>
                
                <!-- 显示已选择但不在前10中的题材 -->
                <div
                  v-for="t in selectedAdditionalThemes"
                  :key="'selected-' + t"
                  class="hot-theme-tag filter-tag selected has-value"
                  @click="handleSelectTheme(t)"
                >
                  <span class="theme-name">{{ t }}</span>
                </div>
                
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
                <div
                  v-for="opt in indicatorOptions"
                  :key="opt"
                  class="indicator-btn filter-tag"
                  :class="{ 'selected': selectedFilters.indicator?.special === opt, 'has-value': selectedFilters.indicator?.special === opt }"
                  @click="handleSelectIndicator(opt)"
                >
                  <span>{{ opt }}</span>
                </div>
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
          <span class="theme-title">更多热门题材</span>
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
            class="theme-item filter-tag"
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
import { FILTER_CATEGORIES, ALL_FILTERS } from '@shared/config/constants.js'
import { get } from '../../../api/index.js'
import { getAllThemes, getThemesInfo } from '../../../api/stockAPI.js'
import { getThemesData } from '../../../utils/themesCache.js'
import { Close, Search, TrendCharts } from '@element-plus/icons-vue'

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

    // 计算已选择但不在前10中的题材
    const selectedAdditionalThemes = computed(() => {
      // 确保依赖的值存在
      if (!selectedThemes.value || !topThemes.value) {
        return []
      }
      
      // 获取前10个题材的名称
      const topThemeNames = topThemes.value.map(t => t.name)
      // 返回已选择但不在前10中的题材
      return selectedThemes.value.filter(theme => !topThemeNames.includes(theme))
    })

    // 计算过滤后的题材列表（用于弹窗搜索）
    const filteredThemes = computed(() => {
      // 获取除了前10个固定显示的题材之外的剩余题材
      const remainingThemes = allThemes.value.slice(10)
      
      if (!searchKeyword.value.trim()) {
        return remainingThemes
      }
      const keyword = searchKeyword.value.toLowerCase()
      return remainingThemes.filter(theme => 
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
      // hot concepts
      allThemes,
      topThemes,
      selectedThemes,
      selectedAdditionalThemes, // 添加这个计算属性到返回值中
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
@import './styles/index.css';
</style>