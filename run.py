import sys
import os

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 添加backend目录到Python路径
backend_dir = os.path.join(current_dir, 'backend')
sys.path.insert(0, backend_dir)

# 确保backend/app目录在Python路径中
app_dir = os.path.join(backend_dir, 'app')
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

try:
    # 尝试从app模块导入create_app
    from app import create_app  # type: ignore
    print("成功导入create_app函数")
except ImportError as e:
    print(f"导入失败: {e}")
    print("当前Python路径:", sys.path)
    print("backend目录路径:", backend_dir)
    print("app目录路径:", app_dir)
    print("backend目录是否存在:", os.path.exists(backend_dir))
    print("app目录是否存在:", os.path.exists(app_dir))
    print("__init__.py文件是否存在:", os.path.exists(os.path.join(app_dir, '__init__.py')))
    sys.exit(1)

app = create_app()

if __name__ == '__main__':
    print("启动Flask应用...")
    print("API地址: http://localhost:5000/api")
    print("健康检查: http://localhost:5000/api/health")
    app.run(debug=True, host='0.0.0.0', port=5000)