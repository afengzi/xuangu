from app.models.auth import RedisAuthManager

if __name__ == '__main__':
    auth_manager = RedisAuthManager()
    user = auth_manager.get_permissions()
    print(user)
