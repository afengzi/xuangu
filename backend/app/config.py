import os
from dotenv import load_dotenv

# 只从项目根目录加载 .env（.../xuangu_demo/.env）
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

class Config:
    # 优先使用 REDIS_HOST/REDIS_PORT 等，更直观；兼容旧的 LOCALHOST/PORT 等
    REDIS_LOCALHOST = os.getenv('LOCALHOST', '')
    REDIS_PORT = int(os.getenv('PORT', 6379))
    REDIS_PASSWORD = os.getenv('PASSWORD', None)
    REDIS_DB = int(os.getenv('DB', 1))
    REDIS_SOCKET_TIMEOUT = int(os.getenv('SOCKET_TIMEOUT', 5))
    REDIS_TIMEOUT = int(os.getenv('TIMEOUT', 5))
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')