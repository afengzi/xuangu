import jwt
from datetime import datetime, timedelta
from app.config import Config

def generate_token(user_id):
    payload = {
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow(),
        'sub': user_id
    }
    # 从配置中获取JWT密钥，而不是从app对象
    config = Config()
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm='HS256')

def decode_token(token):
    try:
        config = Config()
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

