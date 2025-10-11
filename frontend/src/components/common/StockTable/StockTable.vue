<template>
  <div class="filter-results-table">
    <el-card class="results-card" shadow="never">

      <!-- 股票列表表格（性能优化版本） -->
      <div class="stock-table">
        <el-table 
          ref="tableRef"
          :key="tableRenderKey"
          :data="paginatedStockList" 
          style="width: 100%"
          :fit="false"
          empty-text="请设置筛选条件后查看结果"
          :height="tableHeight"
          :max-height="tableMaxHeight"
          :default-sort="getDefaultSort()"
          @sort-change="handleSortChange"
          stripe
          :header-cell-style="headerCellStyle"
          :cell-style="cellStyle"
        >
          <template v-if="isThemeMode">
            <el-table-column
              v-for="col in visibleThemeColumns"
              :key="col"
              :prop="col"
              :label="col"
              :min-width="getColumnWidth(col)"
              align="center"
              :sortable="isSortableColumn(col) ? 'custom' : false"
              :show-overflow-tooltip="col !== '描述'"
              :resizable="false"
            >
              <template #default="{ row, $index }">
                <!-- 使用 v-memo 优化重复渲染 -->
                <div v-memo="[row[col], $index]">
                  <a 
                    v-if="col === '股票代码'"
                    :href="formatStockAnalysisUrl(row[col])" 
                    class="stock-code-link"
                    @click="onCodeClick($event, row[col])"
                  >
                    {{ row[col] }}
                  </a>
                  <el-tooltip
                    v-else-if="col === '股票简称'"
                    :content="getStockTooltipContent(getStockCode(row))"
                    placement="top"
                    :disabled="false"
                    :show-after="800"
                    :raw-content="true"
                    popper-class="stock-tooltip"
                    :popper-style="{ width: '300px', maxWidth: '300px' }"
                    :key="`tooltip-${getStockCode(row)}-${stockTooltips[getStockCode(row)] ? 'loaded' : 'loading'}`"
                  >
                    <span 
                      class="stock-name-hover"
                      @mouseenter="handleStockNameHover(getStockCode(row))"
                    >
                      {{ row[col] }}
                    </span>
                  </el-tooltip>
                  <span v-else>{{ row[col] }}</span>
                </div>
              </template>
            </el-table-column>
          </template>
              <template v-else>
                <el-table-column
                  v-for="col in visibleDataColumns"
                  :key="col"
                  :prop="col"
                  :label="getColumnLabel(col)"
                  :min-width="getColumnWidth(col)"
                  align="center"
                  :sortable="isSortableColumn(col) ? 'custom' : false"
                  :show-overflow-tooltip="col !== '股票简称'"
                  :formatter="getColumnFormatter(col)"
                  :resizable="false"
                >
              <template #default="{ row, $index }">
                <!-- 使用 v-memo 优化重复渲染 -->
                <div v-memo="[row[col], $index]">
                  <a 
                    v-if="col === '股票代码'"
                    :href="formatStockAnalysisUrl(row[col])" 
                    class="stock-code-link"
                    @click="onCodeClick($event, row[col])"
                  >
                    {{ row[col] }}
                  </a>
                  <el-tooltip
                    v-else-if="col === '股票简称'"
                    :content="getStockTooltipContent(getStockCode(row))"
                    placement="top"
                    :disabled="false"
                    :show-after="800"
                    :raw-content="true"
                    popper-class="stock-tooltip"
                    :popper-style="{ width: '300px', maxWidth: '300px' }"
                    :key="`tooltip-${getStockCode(row)}-${stockTooltips[getStockCode(row)] ? 'loaded' : 'loading'}`"
                  >
                    <span 
                      class="stock-name-hover"
                      @mouseenter="handleStockNameHover(getStockCode(row))"
                    >
                      {{ row[col] }}
                    </span>
                  </el-tooltip>
                  <span v-else>{{ row[col] }}</span>
                </div>
              </template>
            </el-table-column>
          </template>
        </el-table>
      </div>
    </el-card>

    <!-- 分页组件 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="stockList.length"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handleCurrentPageChange"
    />
  </div>
</template>

<script>
import { ref, computed, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useStockTable } from './StockTable.js'

export default {
  name: 'StockTable',
  props: {
    stockList: {
      type: Array,
      default: () => []
    },
    isThemeMode: {
      type: Boolean,
      default: false
    },
    themeColumns: {
      type: Array,
      default: () => []
    },
    dataColumns: {
      type: Array,
      default: () => []
    },
    showTimeFilter: {
      type: Boolean,
      default: false
    },
    dateRange: {
      type: Array,
      default: () => []
    }
  },
  emits: ['date-range-change', 'sort-change', 'view-detail', 'update:dateRange'],
  setup(props, { emit }) {
    // 使用股票表格业务逻辑
    const stockTable = useStockTable()
    
    // 性能优化：计算可见列
    const visibleThemeColumns = computed(() => {
      return props.themeColumns.filter(c => c !== 'name' && c !== '交易所代码' && c !== 'ts_code' && c !== 'code')
    })
    
    // 性能优化：计算可见的数据列（常规模式）
    const visibleDataColumns = computed(() => {
      return props.dataColumns.filter(c => c !== 'name' && c !== '交易所代码' && c !== 'ts_code' && c !== 'code')
    })
    
    // 性能优化：固定样式对象，避免重复创建
    const headerCellStyle = {
      background: '#f8fafc', 
      color: '#374151', 
      fontWeight: '600',
      textAlign: 'center',
      borderBottom: '2px solid #e5e7eb'
    }
    
    const cellStyle = {
      textAlign: 'center', 
      padding: '8px 6px', // 减少padding提升性能
      fontSize: '13px'    // 稍微减小字体
    }
    
    // 性能优化：动态表格高度
    const tableHeight = computed(() => {
      const windowHeight = window.innerHeight
      return Math.min(windowHeight * 0.6, 500) // 限制最大高度
    })
    
    const tableMaxHeight = computed(() => {
      return Math.min(window.innerHeight * 0.7, 600)
    })
    
    // 性能优化：分页数据处理
    const paginatedStockList = computed(() => {
      const list = [...props.stockList]
      
      // 优化排序逻辑
      if (stockTable.currentSort.prop) {
        const { prop, order } = stockTable.currentSort
        const factor = order === 'descending' ? -1 : 1
        
        list.sort((a, b) => {
          const av = a[prop]
          const bv = b[prop]
          
          // 处理空值
          if (av === null || av === undefined) return factor
          if (bv === null || bv === undefined) return -factor
          
          // 数字排序优化（包括字符串类型的数字）
          const aNum = parseFloat(av)
          const bNum = parseFloat(bv)
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return (aNum - bNum) * factor
          }
          
          // 字符串排序优化
          return String(av).localeCompare(String(bv)) * factor
        })
      } else {
        // 默认按股票代码升序
        const firstCol = '股票代码'
        list.sort((a, b) => String(a[firstCol] ?? '').localeCompare(String(b[firstCol] ?? '')))
      }

      const start = (stockTable.currentPage.value - 1) * stockTable.pageSize.value
      const end = start + stockTable.pageSize.value
      return list.slice(start, end)
    })

    // 性能优化：防抖处理
    const debounceTimer = ref(null)
    const handlePageSizeChange = (newSize) => {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = setTimeout(() => {
        stockTable.pageSize.value = newSize
        stockTable.currentPage.value = 1
      }, 100)
    }

    const handleCurrentPageChange = (newPage) => {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = setTimeout(() => {
        stockTable.currentPage.value = newPage
      }, 100)
    }

    const handleSortChange = ({ prop, order }) => {
      stockTable.currentSort.prop = prop
      stockTable.currentSort.order = order
      stockTable.currentPage.value = 1
      emit('sort-change', { prop, order })
    }

    const dateRangeProxy = computed({
      get: () => props.dateRange,
      set: (val) => emit('update:dateRange', val)
    })

    const handleDateRangeChange = () => {
      emit('date-range-change', props.dateRange)
    }

    // 列表变化时校正页码
    watch(() => props.stockList, (list) => {
      const maxPage = Math.max(1, Math.ceil(list.length / stockTable.pageSize.value))
      if (stockTable.currentPage.value > maxPage) stockTable.currentPage.value = 1
    })

    // 监听列配置变化，重新设置默认排序（只在数据列变化时）
    watch(() => props.dataColumns, () => {
      setDefaultSort()
    }, { deep: true })

    // 清理定时器
    onUnmounted(() => {
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value)
      }
    })

    // 重置表格状态的方法
    const resetTable = () => {
      stockTable.currentPage.value = 1
      setDefaultSort()
      nextTick(() => {
        if (stockTable.tableRef.value?.clearSort) stockTable.tableRef.value.clearSort()
        stockTable.tableRenderKey.value++
      })
    }

    // 获取股票代码的辅助函数
    const getStockCode = (row) => {
      return row['股票代码'] || row.code || row['code'] || ''
    }

    // 动态列配置辅助方法
    const getColumnLabel = (col) => {
      const labelMap = {
        '股票代码': '股票代码',
        '股票简称': '股票简称',
        '净利润': '净利润(亿元)',
        '营业收入': '营业收入(亿元)',
        '销售毛利率': '销售毛利率%',
        '资产负债率': '资产负债率%',
        'ROE': 'ROE%',
        '市净率': '市净率',
        '市盈率': '市盈率',
        '大单净量': '大单净量',
        '大单净额': '大单净额(亿元)',
        'MACD': 'MACD',
        'KDJ': 'KDJ',
        'BOLL': 'BOLL',
        '单k组合': '单k组合',
        '均线': '均线',
        '陆股通净流入': '陆股通净流入(万元)',
        '大单净量': '大单净量',
        '大单净额': '大单净额(万元)'
      }
      return labelMap[col] || col
    }

    const getColumnWidth = (col) => {
      const widthMap = {
        '股票代码': 110,
        '股票简称': 110,
        '净利润': 140,
        '营业收入': 145,
        '销售毛利率': 140,
        '资产负债率': 135,
        'ROE': 95,
        '市净率': 95,
        '市盈率': 90,
        '大单净量': 105,
        '大单净额': 140,
        'MACD': 120,
        'KDJ': 120,
        'BOLL': 120,
        '单k组合': 120,
        '均线': 120,
        '陆股通净流入': 150,
        '大单净量': 105,
        '大单净额': 140,
        '题材': 200,
        '题材描述': 300,
        '主题': 200,
        '股票简称': 120,
        '热度值': 100,
        '特色指标': 120
      }
      return widthMap[col] || 110
    }

    const getColumnFormatter = (col) => {
      const formatterMap = {
        '净利润': stockTable.formatYiYuan,
        '营业收入': stockTable.formatYiYuan,
        '销售毛利率': stockTable.formatPercent,
        '资产负债率': stockTable.formatPercent,
        'ROE': stockTable.formatPercent,
        '市净率': stockTable.formatNumber,
        '市盈率': stockTable.formatPercent,
        '大单净量': stockTable.formatNumber,
        '大单净额': stockTable.formatYiYuan,
        '陆股通净流入': stockTable.formatMoney
      }
      return formatterMap[col] || null
    }

    // 获取默认排序配置
    const getDefaultSort = () => {
      const columns = props.isThemeMode ? props.themeColumns : props.dataColumns
      const defaultColumn = props.isThemeMode ? (props.themeColumns[0] || 'code') : '股票代码'
      
      // 优先按热度值降序，否则按默认列升序
      if (columns.includes('热度值')) {
        return { prop: '热度值', order: 'descending' }
      }
      return { prop: defaultColumn, order: 'ascending' }
    }

    // 设置默认排序的通用函数
    const setDefaultSort = () => {
      const defaultSort = getDefaultSort()
      stockTable.currentSort.prop = defaultSort.prop
      stockTable.currentSort.order = defaultSort.order
    }

    // 初始化默认排序
    setDefaultSort()

    return {
      // 状态
      currentPage: stockTable.currentPage,
      pageSize: stockTable.pageSize,
      tableRenderKey: stockTable.tableRenderKey,
      tableRef: stockTable.tableRef,
      paginatedStockList,
      
      // 性能优化相关
      visibleThemeColumns,
      visibleDataColumns,
      headerCellStyle,
      cellStyle,
      tableHeight,
      tableMaxHeight,
      
      // 方法
      handlePageSizeChange,
      handleCurrentPageChange,
      handleSortChange,
      getDefaultSort,
      handleDateRangeChange,
      dateRangeProxy,
      resetTable,
      
      // 股票表格业务逻辑
      stockTooltips: stockTable.stockTooltips,
      handleStockNameHover: stockTable.handleStockNameHover,
      getStockTooltipContent: stockTable.getStockTooltipContent,
      onCodeClick: stockTable.onCodeClick,
      isSortableColumn: stockTable.isSortableColumn,
      
      // 格式化函数
      formatStockAnalysisUrl: stockTable.formatStockAnalysisUrl,
      formatTreeIdUrl: stockTable.formatTreeIdUrl,
      handleStockCodeClick: stockTable.handleStockCodeClick,
      formatMoney: stockTable.formatMoney,
      formatYiYuan: stockTable.formatYiYuan,
      formatPercent: stockTable.formatPercent,
      formatNumber: stockTable.formatNumber,
      
      // 动态列配置方法
      getStockCode,
      getColumnLabel,
      getColumnWidth,
      getColumnFormatter
    }
  }
}
</script>

<style scoped>
@import './styles/index.css';
</style>
