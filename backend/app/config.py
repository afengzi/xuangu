import os
from dotenv import load_dotenv

# 只从项目根目录加载 .env（.../xuangu_demo/.env）
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

class Config:
    # 优先使用 REDIS_HOST/REDIS_PORT 等，更直观；兼容旧的 LOCALHOST/PORT 等
    REDIS_LOCALHOST = os.getenv('LOCALHOST', '127.0.0.1')
    REDIS_PORT = int(os.getenv('PORT', 6379))
    REDIS_PASSWORD = os.getenv('PASSWORD', None)
    REDIS_DB = int(os.getenv('DB', 1))
    REDIS_SOCKET_TIMEOUT = int(os.getenv('SOCKET_TIMEOUT', 5))
    REDIS_TIMEOUT = int(os.getenv('TIMEOUT', 5))
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')
    
    # 权限管理Redis配置（与主配置保持一致，避免数据库不匹配）
    REDIS_AUTH_DB = int(os.getenv('ADMIN_DB', 6))
    
    # 管理后台Redis配置
    ADMIN_DB = int(os.getenv('ADMIN_DB', 6))
    
    # 应用配置
    APP_HOST = os.getenv('APP_HOST', '0.0.0.0')
    APP_PORT = int(os.getenv('APP_PORT', 5000))
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')