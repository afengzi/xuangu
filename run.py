import sys
import os

# 将项目根目录和backend目录添加到Python路径
project_root = os.path.abspath(os.path.dirname(__file__))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_path)

from backend.app import create_app
from backend.app.config import Config

app = create_app()

if __name__ == '__main__':
    
    # 使用配置文件中的主机和端口设置
    host = getattr(Config, 'APP_HOST', '0.0.0.0')
    port = getattr(Config, 'APP_PORT', 5001)
    debug = getattr(Config, 'FLASK_DEBUG', True)
    
    app.run(debug=debug, host=host, port=port)