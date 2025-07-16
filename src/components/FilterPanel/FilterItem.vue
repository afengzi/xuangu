<template>
  <div class="filter-item">
    <!-- 直接显示筛选条件名称，去掉占位符文字 -->
    <div
      v-if="!isDisabled"
      class="filter-tag"
      :class="{ 
        'has-value': selectedValue,
        'hover': isHovering 
      }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="handleClick"
    >
      <span class="filter-name">{{ condition.name }}</span>
      <span v-if="condition.unit" class="unit">({{ condition.unit }})</span>
      
      <!-- 显示选中的值 -->
      <span v-if="selectedValue" class="selected-value">: {{ selectedValue }}</span>
      
      <!-- 取消按钮 -->
      <el-icon 
        v-if="selectedValue" 
        class="cancel-btn"
        @click.stop="handleCancel"
      >
        <Close />
      </el-icon>
    </div>
    
    <!-- 禁用状态 -->
    <div v-else class="filter-tag disabled">
      <span class="filter-name">{{ condition.name }}</span>
      <span v-if="condition.unit" class="unit">({{ condition.unit }})</span>
      <span class="disabled-text">: 待开发</span>
    </div>
    
    <!-- 数据范围选择器 -->
    <DataRangeSelector
      v-if="!isDisabled"
      :title="`选择${condition.name}范围`"
      :ranges="condition.ranges"
      :selected-range="selectedValue"
      :visible="isSelectorOpen"
      @range-select="handleRangeSelect"
      @close="handleSelectorClose"
    >
      <span></span>
    </DataRangeSelector>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'
import DataRangeSelector from '../DataRangeSelector/DataRangeSelector.vue'

export default {
  name: 'FilterItem',
  components: {
    DataRangeSelector,
    Close
  },
  props: {
    // 筛选条件配置
    condition: {
      type: Object,
      required: true
    },
    // 条件key
    conditionKey: {
      type: String,
      required: true
    },
    // 当前选中的值
    selectedValue: {
      type: String,
      default: ''
    },
    // 是否禁用（待开发功能）
    disabled: {
      type: Boolean,
      default: false
    },
    // 选择器唯一ID
    selectorId: {
      type: String,
      required: true
    },
    // 是否是当前打开的选择器
    isSelectorOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['item-change', 'selector-open', 'selector-close'],
  setup(props, { emit }) {
    const isHovering = ref(false)
    
    // 计算是否禁用
    const isDisabled = computed(() => {
      return props.disabled || !props.condition.ranges || props.condition.ranges.length === 0
    })
    
    // 鼠标事件处理
    const handleMouseEnter = () => !isDisabled.value && (isHovering.value = true)
    const handleMouseLeave = () => isHovering.value = false
    
    // 点击整个区域
    const handleClick = () => {
      if (!isDisabled.value) {
        emit(props.isSelectorOpen ? 'selector-close' : 'selector-open')
      }
    }
    
    // 范围选择 - 直接处理选择
    const handleRangeSelect = (range) => {
      emit('item-change', {
        key: props.conditionKey,
        value: range,
        condition: props.condition
      })
    }
    
    // 关闭选择器
    const handleSelectorClose = () => emit('selector-close')
    
    // 取消选择
    const handleCancel = () => {
      // 重置鼠标悬停状态，避免取消后依然高亮
      isHovering.value = false
      emit('item-change', {
        key: props.conditionKey,
        value: '',
        condition: props.condition
      })
    }
    
    return {
      isHovering,
      isDisabled,
      handleMouseEnter,
      handleMouseLeave,
      handleClick,
      handleRangeSelect,
      handleSelectorClose,
      handleCancel
    }
  }
}
</script>

<style scoped>
.filter-item {
  display: inline-flex;
  align-items: center;
  margin: 0;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  font-size: 13px;
  color: #475569;
  position: relative;
  font-weight: 500;
  white-space: nowrap;
  box-sizing: border-box;
}

.filter-tag:hover,
.filter-tag.hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.filter-tag.has-value {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  padding-right: 32px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.filter-tag.has-value:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.filter-tag.disabled {
  cursor: not-allowed;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-color: #e2e8f0;
  color: #94a3b8;
}

.filter-name {
  font-weight: 600;
}

.unit {
  font-size: 12px;
  opacity: 0.9;
  font-weight: normal;
}

.selected-value {
  font-weight: 600;
}

.disabled-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.cancel-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  padding: 2px;
  border-radius: 2px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: translateY(-50%) scale(1.1);
}
</style> 