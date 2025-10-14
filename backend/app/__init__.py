import os
import logging
from flask import Flask, send_from_directory
from .config import Config
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 配置日志
    log_level = getattr(Config, 'LOG_LEVEL', 'INFO')
    logging.basicConfig(level=getattr(logging, log_level.upper(), logging.INFO))
    
    # 启用CORS支持前端跨域请求
    CORS(app)
    
    # 添加shared目录的静态文件路由
    @app.route('/static/shared/<path:filename>')
    def shared_static(filename):
        # 获取项目根目录
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        shared_dir = os.path.join(root_dir, 'shared')
        print(f"Debug: Serving {filename} from {shared_dir}")  # 调试信息
        return send_from_directory(shared_dir, filename)
    
    # 注册蓝图 - 直接从routes.py导入main蓝图
    try:
        # 导入sys和os用于路径处理
        import sys
        import os
        import importlib.util
        # 获取当前文件目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # 将当前目录添加到Python路径
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
        
        # 使用绝对路径导入routes模块
        routes_path = os.path.join(current_dir, 'routes.py')
        spec = importlib.util.spec_from_file_location("app.routes", routes_path)
        routes_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(routes_module)
        
        # 获取main蓝图
        main = getattr(routes_module, 'main')
        app.register_blueprint(main, url_prefix='/api')
        print("主蓝图注册成功")
    except Exception as e:
        print(f"警告：主蓝图导入失败: {e}")
        # 创建备用蓝图
        from flask import Blueprint
        main = Blueprint('main', __name__)
        app.register_blueprint(main, url_prefix='/api')
    
    # 注册管理员蓝图（可选）
    try:
        from .routes.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
    except ImportError:
        print("警告：管理员蓝图导入失败")
    
    # 注册旧版蓝图（可选）
    try:
        from .legacy import legacy_bp
        app.register_blueprint(legacy_bp)
    except ImportError:
        print("警告：旧版蓝图导入失败")
    
    return app

