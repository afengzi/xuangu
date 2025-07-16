<template>
  <div class="data-range-selector">
    <el-popover
      :visible="visible"
      placement="bottom"
      :width="300"
      trigger="manual"
      popper-class="range-selector-popover"
      @show="handleShow"
      @hide="handleHide"
    >
      <template #reference>
        <slot></slot>
      </template>
      
      <div class="range-content">
        <div class="range-header">
          <span class="range-title">{{ title }}</span>
          <el-button 
            type="text" 
            class="close-btn"
            @click="handleClose"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <div class="range-list">
          <div 
            v-for="(range, index) in ranges" 
            :key="index"
            class="range-item"
            :class="{ 'selected': currentSelected === range }"
            @click="handleRangeSelect(range)"
          >
            {{ range }}
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'

export default {
  name: 'DataRangeSelector',
  components: {
    Close
  },
  props: {
    // 选择器标题
    title: {
      type: String,
      default: '选择范围'
    },
    // 数据范围选项
    ranges: {
      type: Array,
      default: () => []
    },
    // 当前选中的范围
    selectedRange: {
      type: String,
      default: ''
    },
    // 控制显示/隐藏
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['range-select', 'close'],
  setup(props, { emit }) {
    const currentSelected = ref(props.selectedRange)
    
    // 监听props变化
    watch(() => props.selectedRange, (newVal) => {
      currentSelected.value = newVal
    })
    
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        currentSelected.value = props.selectedRange
      }
    })
    
    // 处理范围选择 - 立即确认并关闭
    const handleRangeSelect = (range) => {
      currentSelected.value = range
      emit('range-select', range)
      // 立即关闭弹窗
      emit('close')
    }
    
    // 处理关闭
    const handleClose = () => {
      emit('close')
    }
    
    // 处理显示
    const handleShow = () => {
      currentSelected.value = props.selectedRange
    }
    
    // 处理隐藏
    const handleHide = () => {
      // 可以在这里做一些清理工作
    }
    
    return {
      currentSelected,
      handleRangeSelect,
      handleClose,
      handleShow,
      handleHide
    }
  }
}
</script>

<style scoped>
.range-content {
  padding: 0;
}

.range-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.range-title {
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

.range-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 8px 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
}

.range-list::-webkit-scrollbar {
  width: 6px;
}

.range-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.range-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.range-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.range-item {
  padding: 8px 16px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.range-item:hover {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #1e40af;
  transform: translateX(2px);
}

.range-item.selected {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 13px;
}
</style>

<style>
.range-selector-popover {
  padding: 0 !important;
  min-width: 280px !important;
  max-width: 320px !important;
  margin-top: 8px !important;
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  z-index: 3000 !important;
}

.range-selector-popover .el-popover__arrow {
  display: none !important;
}
</style> 