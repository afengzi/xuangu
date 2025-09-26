import sys
import os

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    # 添加backend目录到Python路径
    backend_dir = os.path.join(current_dir, 'backend')
    sys.path.insert(0, backend_dir)
    
    from app import create_app
    print("成功导入create_app函数")
except ImportError as e:
    print(f"导入失败: {e}")
    print("当前Python路径:", sys.path)
    sys.exit(1)

app = create_app()

if __name__ == '__main__':
    print("启动Flask应用...")
    print("API地址: http://localhost:5000/api")
    print("健康检查: http://localhost:5000/api/health")
    app.run(debug=True, host='0.0.0.0', port=5000)