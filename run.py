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
    from app import create_app  # type: ignore
except ImportError as e:
    print(f"导入失败: {e}")
    sys.exit(1)

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)