<template>
  <div class="data-range-selector">
    <el-popover
      :visible="visible"
      placement="bottom"
      :width="240"
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
            link
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
            class="range-item filter-tag"
            :class="{ 'selected': currentSelected === range, 'has-value': currentSelected === range }"
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
@import './styles/index.css';
</style>

<style>
.range-selector-popover {
  padding: 0 !important;
  min-width: 240px !important;
  max-width: 240px !important;
  margin-top: 8px !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  z-index: 3000 !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
}

.range-selector-popover .el-popover__arrow {
  display: none !important;
}
</style>