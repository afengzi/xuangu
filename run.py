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
    # 在启动服务器之前执行数据初始化操作
    print("开始执行数据初始化操作...")
    try:
        # 添加scripts目录到Python路径
        scripts_path = os.path.join(project_root, 'scripts')
        sys.path.insert(0, scripts_path)
        
        # 导入并执行初始化脚本
        from scripts.init_admin import main as init_admin_main
        init_result = init_admin_main()
        
        if init_result == 0:
            print("数据初始化成功！")
        else:
            print(f"数据初始化返回非零值：{init_result}")
    except Exception as e:
        print(f"数据初始化过程中发生错误：{str(e)}")
        print("继续启动服务器...")
    
    # 使用配置文件中的主机和端口设置
    host = getattr(Config, 'APP_HOST', '0.0.0.0')
    port = getattr(Config, 'APP_PORT', 5001)
    debug = getattr(Config, 'FLASK_DEBUG', True)
    
    app.run(debug=debug, host=host, port=port)