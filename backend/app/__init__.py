from flask import Flask, send_from_directory
from app.config import Config
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
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
    
    # 注册蓝图
    from app.routes import main
    app.register_blueprint(main, url_prefix='/api')

    # 注册 IE11 兼容页面蓝图（无前缀，直接提供 /legacy/ 页面）
    from app.legacy import legacy_bp
    app.register_blueprint(legacy_bp)
    
    return app

