#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用户权限管理模型 - Redis实现
使用Redis数据库索引6存储权限相关数据
"""

import redis
import json
try:
    import bcrypt
except ImportError:
    raise ImportError("无法导入 'bcrypt' 模块，请使用 'pip install bcrypt' 安装该模块。")
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from ..config import Config

class RedisAuthManager:
    """Redis权限管理器"""
    
    def __init__(self):
        # 初始化Redis连接，添加连接超时和重试机制
        try:
            self.redis_client = redis.Redis(
                host=Config.REDIS_LOCALHOST,
                port=Config.REDIS_PORT,
                password=Config.REDIS_PASSWORD,
                db=Config.REDIS_AUTH_DB,
                decode_responses=True,
                socket_timeout=Config.REDIS_SOCKET_TIMEOUT,
                socket_connect_timeout=Config.REDIS_SOCKET_TIMEOUT
            )
            # 测试连接
            self.redis_client.ping()
        except redis.RedisError as e:
            print(f"Redis连接失败: {str(e)}")
            # 创建一个模拟客户端，用于在Redis不可用时提供错误处理
            self.redis_client = None
        
    # 用户管理相关方法
    def create_user(self, username: str, password: str, email: str = "", status: int = 1) -> Dict:
        """创建用户"""
        user_id = self.redis_client.incr("user:id:counter")
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user_data = {
            'id': user_id,
            'username': username,
            'password_hash': password_hash,
            'email': email,
            'status': status,  # 1:启用, 0:禁用
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # 存储用户信息
        self.redis_client.hset(f"user:{user_id}", mapping=user_data)
        # 用户名索引
        self.redis_client.hset("user:username:index", username, user_id)
        
        return user_data
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """根据ID获取用户信息"""
        user_data = self.redis_client.hgetall(f"user:{user_id}")
        if user_data:
            # 不返回密码哈希
            user_data.pop('password_hash', None)
            return user_data
        return None
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """根据用户名获取用户信息"""
        user_id = self.redis_client.hget("user:username:index", username)
        if user_id:
            return self.get_user_by_id(int(user_id))
        return None
    
    def verify_user_password(self, username: str, password: str) -> bool:
        """验证用户密码"""
        user_id = self.redis_client.hget("user:username:index", username)
        if user_id:
            password_hash = self.redis_client.hget(f"user:{int(user_id)}", "password_hash")
            if password_hash:
                return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        return False
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """更新用户信息"""
        user_key = f"user:{user_id}"
        if not self.redis_client.exists(user_key):
            return False
            
        # 如果更新用户名，需要更新索引
        if 'username' in kwargs:
            old_username = self.redis_client.hget(user_key, "username")
            new_username = kwargs['username']
            if old_username != new_username:
                # 检查新用户名是否已存在
                if self.redis_client.hexists("user:username:index", new_username):
                    return False
                # 更新索引
                self.redis_client.hdel("user:username:index", old_username)
                self.redis_client.hset("user:username:index", new_username, user_id)
        
        kwargs['updated_at'] = datetime.now().isoformat()
        self.redis_client.hset(user_key, mapping=kwargs)
        return True
    
    def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        user_key = f"user:{user_id}"
        username = self.redis_client.hget(user_key, "username")
        
        if username:
            # 删除用户名索引
            self.redis_client.hdel("user:username:index", username)
            # 删除用户角色关联
            self.redis_client.delete(f"user:{user_id}:roles")
            # 删除用户信息
            self.redis_client.delete(user_key)
            return True
        return False
    
    def get_users(self, page: int = 1, page_size: int = 10) -> Dict:
        """获取用户列表"""
        try:
            if not self.redis_client:
                raise redis.RedisError("Redis未连接")
                
            # 获取所有用户ID
            user_keys = self.redis_client.keys("user:[0-9]*")
            total = len(user_keys)
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            
            users = []
            for user_key in sorted(user_keys)[start:end]:
                user_data = self.redis_client.hgetall(user_key)
                if user_data:
                    user_data.pop('password_hash', None)  # 不返回密码
                    users.append(user_data)
            
            return {
                'total': total,
                'page': page,
                'page_size': page_size,
                'users': users
            }
        except redis.RedisError as e:
            print(f"Redis操作失败: {str(e)}")
            # 返回空列表和错误信息，而不是抛出异常导致API 500错误
            return {
                'total': 0,
                'page': page,
                'page_size': page_size,
                'users': [],
                'error': f"Redis操作失败: {str(e)}"
            }
    
    # 角色管理相关方法
    def create_role(self, name: str, description: str = "", status: int = 1) -> Dict:
        """创建角色"""
        role_id = self.redis_client.incr("role:id:counter")
        
        role_data = {
            'id': role_id,
            'name': name,
            'description': description,
            'status': status,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        self.redis_client.hset(f"role:{role_id}", mapping=role_data)
        return role_data
    
    def get_role_by_id(self, role_id: int) -> Optional[Dict]:
        """根据ID获取角色信息"""
        return self.redis_client.hgetall(f"role:{role_id}") or None
    
    def update_role(self, role_id: int, **kwargs) -> bool:
        """更新角色信息"""
        role_key = f"role:{role_id}"
        if not self.redis_client.exists(role_key):
            return False
            
        kwargs['updated_at'] = datetime.now().isoformat()
        self.redis_client.hset(role_key, mapping=kwargs)
        return True
    
    def delete_role(self, role_id: int) -> bool:
        """删除角色"""
        role_key = f"role:{role_id}"
        if self.redis_client.exists(role_key):
            # 删除角色权限关联
            self.redis_client.delete(f"role:{role_id}:permissions")
            # 删除所有用户的该角色关联
            user_role_keys = self.redis_client.keys("user:*:roles")
            for key in user_role_keys:
                self.redis_client.srem(key, role_id)
            # 删除角色信息
            self.redis_client.delete(role_key)
            return True
        return False
    
    def get_roles(self) -> List[Dict]:
        """获取所有角色"""
        role_keys = self.redis_client.keys("role:[0-9]*")
        roles = []
        for role_key in role_keys:
            role_data = self.redis_client.hgetall(role_key)
            roles.append(role_data)
        return roles
    
    # 权限管理相关方法
    def create_permission(
        self, 
        code: str, 
        name: str, 
        permission_type: str = "menu", 
        parent_id: int = 0, 
        path: str = "", 
        method: str = ""
    ) -> Dict:
        """创建权限"""
        permission_id = self.redis_client.incr("permission:id:counter")
        
        permission_data = {
            'id': permission_id,
            'code': code,
            'name': name,
            'type': permission_type,  # menu:菜单权限, operation:操作权限
            'parent_id': parent_id,
            'path': path,
            'method': method,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        self.redis_client.hset(f"permission:{permission_id}", mapping=permission_data)
        return permission_data
    
    def get_permission_by_id(self, permission_id: int) -> Optional[Dict]:
        """根据ID获取权限信息"""
        return self.redis_client.hgetall(f"permission:{permission_id}") or None
    
    def update_permission(self, permission_id: int, **kwargs) -> bool:
        """更新权限信息"""
        permission_key = f"permission:{permission_id}"
        if not self.redis_client.exists(permission_key):
            return False
            
        kwargs['updated_at'] = datetime.now().isoformat()
        self.redis_client.hset(permission_key, mapping=kwargs)
        return True
    
    def delete_permission(self, permission_id: int) -> bool:
        """删除权限"""
        permission_key = f"permission:{permission_id}"
        if self.redis_client.exists(permission_key):
            # 删除所有角色的该权限关联
            role_permission_keys = self.redis_client.keys("role:*:permissions")
            for key in role_permission_keys:
                self.redis_client.srem(key, permission_id)
            # 删除权限信息
            self.redis_client.delete(permission_key)
            return True
        return False
    
    def get_permissions(self) -> List[Dict]:
        """获取所有权限"""
        permission_keys = self.redis_client.keys("permission:[0-9]*")
        permissions = []
        for permission_key in permission_keys:
            permission_data = self.redis_client.hgetall(permission_key)
            permissions.append(permission_data)
        return permissions
    
    # 用户角色关联
    def assign_role_to_user(self, user_id: int, role_id: int) -> bool:
        """给用户分配角色"""
        if not self.redis_client.exists(f"user:{user_id}") or not self.redis_client.exists(f"role:{role_id}"):
            return False
        
        self.redis_client.sadd(f"user:{user_id}:roles", role_id)
        return True
    
    def remove_role_from_user(self, user_id: int, role_id: int) -> bool:
        """从用户移除角色"""
        result = self.redis_client.srem(f"user:{user_id}:roles", role_id)
        return result > 0
    
    def get_user_roles(self, user_id: int) -> List[Dict]:
        """获取用户的所有角色"""
        role_ids = self.redis_client.smembers(f"user:{user_id}:roles")
        roles = []
        for role_id in role_ids:
            role_data = self.get_role_by_id(int(role_id))
            if role_data:
                roles.append(role_data)
        return roles
    
    # 角色权限关联
    def assign_permission_to_role(self, role_id: int, permission_id: int) -> bool:
        """给角色分配权限"""
        role_exists = self.redis_client.exists(f"role:{role_id}")
        perm_exists = self.redis_client.exists(f"permission:{permission_id}")
        if not role_exists or not perm_exists:
            return False
        
        self.redis_client.sadd(f"role:{role_id}:permissions", permission_id)
        return True
    
    def remove_permission_from_role(self, role_id: int, permission_id: int) -> bool:
        """从角色移除权限"""
        result = self.redis_client.srem(f"role:{role_id}:permissions", permission_id)
        return result > 0
    
    def get_role_permissions(self, role_id: int) -> List[Dict]:
        """获取角色的所有权限"""
        permission_ids = self.redis_client.smembers(f"role:{role_id}:permissions")
        permissions = []
        for permission_id in permission_ids:
            permission_data = self.get_permission_by_id(int(permission_id))
            if permission_data:
                permissions.append(permission_data)
        return permissions
    
    # 权限验证
    def get_user_permissions(self, user_id: int) -> List[Dict]:
        """获取用户的所有权限（通过角色）"""
        roles = self.get_user_roles(user_id)
        all_permissions = {}
        
        for role in roles:
            permissions = self.get_role_permissions(int(role['id']))
            for permission in permissions:
                all_permissions[permission['id']] = permission
        
        return list(all_permissions.values())
    
    def user_has_permission(self, user_id: int, permission_code: str) -> bool:
        """检查用户是否有指定权限"""
        permissions = self.get_user_permissions(user_id)
        return any(p['code'] == permission_code for p in permissions)
    
    def user_has_role(self, user_id: int, role_name: str) -> bool:
        """检查用户是否有指定角色"""
        roles = self.get_user_roles(user_id)
        return any(r['name'] == role_name for r in roles)
    
    # 会话管理
    def create_session(self, user_id: int, expire_hours: int = 24) -> str:
        """创建用户会话"""
        import secrets
        token = secrets.token_urlsafe(32)
        
        user_data = self.get_user_by_id(user_id)
        roles = self.get_user_roles(user_id)
        permissions = self.get_user_permissions(user_id)
        
        session_data = {
            'user_id': user_id,
            'username': user_data['username'],
            'roles': json.dumps([r['name'] for r in roles]),
            'permissions': json.dumps([p['code'] for p in permissions]),
            'expire_time': (datetime.now() + timedelta(hours=expire_hours)).isoformat()
        }
        
        self.redis_client.hset(f"session:{token}", mapping=session_data)
        return token
    
    def get_session(self, token: str) -> Optional[Dict]:
        """获取会话信息"""
        session_key = f"session:{token}"
        session_data = self.redis_client.hgetall(session_key)
        
        if not session_data:
            return None
        
        # 检查是否过期
        expire_time = datetime.fromisoformat(session_data['expire_time'])
        if datetime.now() > expire_time:
            self.redis_client.delete(session_key)
            return None
        
        return session_data
    
    def delete_session(self, token: str) -> bool:
        """删除会话"""
        session_key = f"session:{token}"
        if self.redis_client.exists(session_key):
            self.redis_client.delete(session_key)
            return True
        return False

# 创建全局实例
auth_manager = RedisAuthManager()