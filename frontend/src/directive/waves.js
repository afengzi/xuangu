// 点击波纹效果指令
export default {  
  mounted(el) {  
    el.addEventListener('click', (e) => {  
      // 创建波纹元素  
      const ripple = document.createElement('span');  
      const size = Math.max(el.offsetWidth, el.offsetHeight);  
      const halfSize = size / 2;  
      
      // 设置波纹样式  
      ripple.style.position = 'absolute';  
      ripple.style.width = ripple.style.height = `${size}px`;  
      ripple.style.borderRadius = '50%';  
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';  
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';  
      ripple.style.animation = 'ripple-effect 0.6s ease-out';  
      ripple.style.pointerEvents = 'none';  
      
      // 定位波纹中心到点击位置  
      const rect = el.getBoundingClientRect();  
      const x = e.clientX - rect.left;  
      const y = e.clientY - rect.top;  
      ripple.style.left = `${x}px`;  
      ripple.style.top = `${y}px`;  
      
      // 确保元素有相对定位  
      if (getComputedStyle(el).position === 'static') {  
        el.style.position = 'relative';  
      }  
      
      // 添加波纹到元素  
      el.appendChild(ripple);  
      
      // 动画结束后移除波纹  
      setTimeout(() => {  
        ripple.remove();  
      }, 600);  
    });  
  }  
};  

// 添加全局样式
const style = document.createElement('style');
style.textContent = `
@keyframes ripple-effect {
  to {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}
`;
document.head.appendChild(style);