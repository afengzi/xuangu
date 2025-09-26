# StockFilter.vue 文件拆解总结

## 拆解目标
将原本的 `StockFilter.vue` 文件拆解为多个独立的文件，提高代码复用性、可维护性和可读性。

## 拆解后的文件结构

### 1. 工具函数文件
- **`utils/stockFormatters.js`** - 数据格式化工具函数
  - `getPriceClass()` - 获取价格颜色类名
  - `formatPrice()` - 格式化价格显示
  - `formatChange()` - 格式化涨跌幅显示
  - `formatPercent()` - 格式化百分比显示
  - `formatNumber()` - 格式化数值显示
  - `formatMoney()` - 格式化金额显示
  - `formatChangeValue()` - 模板显示的涨跌幅格式化
  - `formatPercentValue()` - 模板显示的百分比格式化
  - `formatStockCodeLink()` - 格式化股票代码链接
  - `handleStockCodeClick()` - 处理股票代码点击事件
  - `DEFAULT_CODE_COLUMNS` - 默认表格列配置

- **`utils/stockFilterUtils.js`** - 股票筛选业务逻辑工具函数
  - `collectFactors()` - 收集筛选因子
  - `processStockData()` - 处理股票数据映射
  - `processThemeData()` - 处理题材数据映射
  - `processFilterChange()` - 处理筛选条件变化的核心逻辑
  - `debounce()` - 防抖函数
  - `getPaginatedData()` - 分页计算

### 2. 组合式函数
- **`composables/useStockFilter.js`** - 股票筛选业务逻辑组合式函数
  - 提供股票筛选相关的状态管理
  - 处理筛选条件变化、搜索、分页等业务逻辑
  - 统一管理组件间的数据流

### 3. 组件文件
- **`components/AppHeader/AppHeader.vue`** - 导航栏组件
  - 独立的导航栏逻辑和样式
  - 用户信息显示和退出登录功能

- **`components/StockTable/StockTable.vue`** - 股票表格组件
  - 股票数据展示和分页
  - 表格排序和筛选功能
  - 时间筛选器集成

- **`components/StockDetail/StockDetail.vue`** - 股票详情对话框组件
  - 股票详细信息展示
  - 对话框状态管理

### 4. 样式文件
- **`styles/stockFilter.css`** - 股票筛选页面样式
  - 页面整体样式
  - 价格颜色样式
  - 响应式设计

### 5. 模板文件
- **`templates/StockFilterTemplate.html`** - HTML 模板文件
  - 展示页面结构（用于参考）

### 6. 重构后的主文件
- **`views/StockFilter.vue`** - 重构后的主页面文件
  - 大幅简化，只保留必要的组件引用
  - 使用组合式函数管理业务逻辑
  - 引用外部样式文件

## 拆解优势

### 1. 代码复用性提升
- 工具函数可以在多个组件中复用
- 格式化函数统一管理，避免重复代码
- 业务逻辑封装在组合式函数中，便于复用

### 2. 可维护性增强
- 单一职责原则：每个文件只负责特定功能
- 模块化设计：功能模块独立，便于维护
- 清晰的依赖关系：通过导入导出明确模块依赖

### 3. 可读性改善
- 文件结构清晰，功能划分明确
- 代码量减少，单个文件更易理解
- 命名规范统一，便于查找和理解

### 4. 开发效率提升
- 组件化开发，便于团队协作
- 工具函数集中管理，减少重复开发
- 样式文件独立，便于题材定制

## 使用方式

### 1. 在组件中使用工具函数
```javascript
import { formatPrice, getPriceClass } from '../utils/stockFormatters.js'
```

### 2. 在组件中使用组合式函数
```javascript
import { useStockFilter } from '../composables/useStockFilter.js'

export default {
  setup() {
    const stockFilter = useStockFilter()
    return { ...stockFilter }
  }
}
```

### 3. 引用外部样式
```css
@import '../styles/stockFilter.css';
```

## 注意事项

1. **导入路径**：确保所有导入路径正确
2. **组件通信**：通过 props 和 emit 进行组件间通信
3. **状态管理**：使用组合式函数统一管理状态
4. **样式隔离**：使用 scoped 样式避免样式冲突

## 后续优化建议

1. **类型定义**：可以考虑添加 TypeScript 支持
2. **单元测试**：为工具函数和组合式函数添加单元测试
3. **文档完善**：为每个函数和组件添加详细的 JSDoc 注释
4. **性能优化**：考虑使用 Vue 3 的 Suspense 和异步组件
