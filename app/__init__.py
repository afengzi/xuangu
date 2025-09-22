from flask import Flask
from app.config import Config
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 启用CORS支持前端跨域请求
    CORS(app)
    
    # 注册蓝图
    from app.routes import main
    app.register_blueprint(main, url_prefix='/api')
    
    return app

