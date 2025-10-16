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
    """Redis权限管理器
    用于管理用户权限、角色和操作日志的Redis实现。
    """
    
    def __init__(self):
        """初始化Redis连接，添加连接超时和重试机制"""
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
            self.redis_client.ping()
        except redis.RedisError as e:
            print(f"Redis连接失败: {str(e)}")
            # 创建一个模拟客户端，用于在Redis不可用时提供错误处理
            self.redis_client = None
        
    # 用户管理相关方法
    def create_user(self, username: str, password: str, email: str = "", status: int = 1) -> Dict:
        """创建用户
        创建一个新用户并存储到Redis数据库中。
        
        参数:
        username (str): 用户名，必须唯一
        password (str): 密码，会被哈希存储
        email (str, 可选): 用户邮箱，默认空字符串
        status (int, 可选): 用户状态，1为启用，0为禁用，默认1
        
        返回:
        Dict: 包含用户ID、用户名、邮箱、状态、创建时间和更新时间的用户信息字典
        """
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
        """根据ID获取用户信息
        获取指定用户ID的用户信息，不返回密码哈希。
        
        参数:
        user_id (int): 用户ID
        
        返回:
        Optional[Dict]: 包含用户信息的字典，若用户不存在则返回None
        """
        user_data = self.redis_client.hgetall(f"user:{user_id}")
        if user_data:
            # 不返回密码哈希
            user_data.pop('password_hash', None)
            return user_data
        return None
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """根据用户名获取用户信息
        获取指定用户名的用户信息，不返回密码哈希。
        
        参数:
        username (str): 用户名
        
        返回:
        Optional[Dict]: 包含用户信息的字典，若用户不存在则返回None
        """
        user_id = self.redis_client.hget("user:username:index", username)
        if user_id:
            return self.get_user_by_id(int(user_id))
        return None
    
    def verify_user_password(self, username: str, password: str) -> bool:
        """验证用户密码
        验证指定用户名的密码是否正确。
        
        参数:
        username (str): 用户名
        password (str): 密码
        
        返回:
        bool: 若密码正确则返回True，否则返回False
        """
        user_id = self.redis_client.hget("user:username:index", username)
        if user_id:
            password_hash = self.redis_client.hget(f"user:{int(user_id)}", "password_hash")
            if password_hash:
                return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        return False
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """更新用户信息
        更新指定用户ID的用户信息。
        
        参数:
        user_id (int): 用户ID
        kwargs (Dict): 包含要更新的用户字段和值的字典
        
        返回:
        bool: 若更新成功则返回True，否则返回False
        """
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
        """删除用户
        删除指定用户ID的用户信息，包括用户名索引、角色关联和用户数据。
        
        参数:
        user_id (int): 用户ID
        
        返回:
        bool: 若删除成功则返回True，否则返回False
        """
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
        """获取用户列表
        获取所有用户的列表，支持分页。
        
        参数:
        page (int): 页码，默认第一页
        page_size (int): 每页数量，默认10条
        
        返回:
        Dict: 包含用户总数、当前页、每页数量和用户列表的字典
        """
        try:
            if not self.redis_client:
                raise redis.RedisError("Redis未连接")
                
            # 获取所有用户ID，但只计算有效的用户键
            user_keys = self.redis_client.keys("user:[0-9]*")
            valid_user_keys = []
            
            # 先过滤出有效的用户键
            for user_key in user_keys:
                key_str = user_key.decode('utf-8') if isinstance(user_key, bytes) else user_key
                import re
                if re.match(r'^user:\d+$', key_str):
                    valid_user_keys.append(user_key)
            
            total = len(valid_user_keys)
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            
            users = []
            for user_key in sorted(valid_user_keys)[start:end]:
                try:
                    user_data = self.redis_client.hgetall(user_key)
                    if user_data:
                        user_data.pop('password_hash', None)  # 不返回密码
                        users.append(user_data)
                except redis.RedisError as e:
                    print(f"获取用户数据失败 {user_key}: {str(e)}")
            
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
        """创建角色
        创建一个新角色，返回角色ID和其他信息。
        
        参数:
        name (str): 角色名称
        description (str): 角色描述，默认空字符串
        status (int): 角色状态，默认1（启用）
        
        返回:
        Dict: 包含角色ID、名称、描述、状态、创建时间和更新时间的字典
        """
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
        """根据ID获取角色信息
        获取指定角色ID的角色信息。
        
        参数:
        role_id (int): 角色ID
        
        返回:
        Optional[Dict]: 包含角色ID、名称、描述、状态、创建时间和更新时间的字典，若角色不存在则返回None
        """
        return self.redis_client.hgetall(f"role:{role_id}") or None
    
    def update_role(self, role_id: int, **kwargs) -> bool:
        """更新角色信息
        更新指定角色ID的角色信息。
        
        参数:
        role_id (int): 角色ID
        kwargs (Dict): 包含要更新的角色字段和值的字典
        
        返回:
        bool: 若更新成功则返回True，否则返回False
        """
        role_key = f"role:{role_id}"
        if not self.redis_client.exists(role_key):
            return False
            
        kwargs['updated_at'] = datetime.now().isoformat()
        self.redis_client.hset(role_key, mapping=kwargs)
        return True
    
    def delete_role(self, role_id: int) -> bool:
        """删除角色
        删除指定角色ID的角色信息，包括角色权限关联和所有用户的该角色关联。
        
        参数:
        role_id (int): 角色ID
        
        返回:
        bool: 若删除成功则返回True，否则返回False
        """
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
        """获取所有角色
        获取所有角色的信息，包括角色ID、名称、描述、状态、创建时间和更新时间。
        
        返回:
        List[Dict]: 包含所有角色信息的字典列表
        """
        try:
            if not self.redis_client:
                raise redis.RedisError("Redis未连接")
                
            # 只匹配role:id格式的键，避免匹配到role:id:permissions等键
            role_keys = self.redis_client.keys("role:[0-9]*")
            roles = []
            for role_key in role_keys:
                # 检查键是否只包含角色ID，不包含其他后缀
                # 正确的格式应该是"role:数字"，不包含第三个冒号
                key_str = role_key.decode('utf-8') if isinstance(role_key, bytes) else role_key
                import re
                if re.match(r'^role:\d+$', key_str):
                    try:
                        role_data = self.redis_client.hgetall(role_key)
                        roles.append(role_data)
                    except redis.RedisError as e:
                        print(f"获取角色数据失败 {role_key}: {str(e)}")
            return roles
        except redis.RedisError as e:
            print(f"Redis操作失败: {str(e)}")
            return []
    
    # 权限管理相关方法
    def create_permission(
        self, 
        code: str, 
        name: str, 
        permission_type: str = "menu", 
        parent_id: int = 0, 
        status: int = 1,
        description: str = "",
    ) -> Dict:
        """创建权限
        创建一个新权限，返回权限ID和其他信息。
        
        参数:
        code (str): 权限编码，唯一标识权限
        name (str): 权限名称
        permission_type (str): 权限类型，默认"menu"（菜单权限），可选"operation"（操作权限）
        parent_id (int): 父权限ID，默认0（无父权限）
        status (int): 权限状态，默认1（正常），可选0（禁用）
        description (str): 权限描述，默认空字符串
        
        返回:
        Dict: 包含权限ID、编码、名称、类型、父ID、状态、描述、创建时间和更新时间的字典
        """
        permission_id = self.redis_client.incr("permission:id:counter")
        
        permission_data = {
            'id': permission_id,
            'code': code,
            'name': name,
            'type': permission_type,  # menu:菜单权限, operation:操作权限
            'parent_id': parent_id,
            'status': status,  # 1:正常, 0:禁用
            'description': description,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        self.redis_client.hset(f"permission:{permission_id}", mapping=permission_data)
        return permission_data
    
    def get_permission_by_id(self, permission_id: int) -> Optional[Dict]:
        """根据ID获取权限信息
        根据权限ID获取权限的详细信息。
        
        参数:
        permission_id (int): 权限ID
        
        返回:
        Optional[Dict]: 包含权限ID、编码、名称、类型、父ID、状态、描述、创建时间和更新时间的字典，若权限不存在则返回None
        """
        return self.redis_client.hgetall(f"permission:{permission_id}") or None
    
    def update_permission(self, permission_id: int, **kwargs) -> bool:
        """更新权限信息
        更新指定权限ID的权限信息。
        
        参数:
        permission_id (int): 权限ID
        kwargs (Dict): 包含要更新的权限字段和值的字典
        
        返回:
        bool: 若更新成功则返回True，否则返回False
        """
        permission_key = f"permission:{permission_id}"
        if not self.redis_client.exists(permission_key):
            return False
            
        kwargs['updated_at'] = datetime.now().isoformat()
        self.redis_client.hset(permission_key, mapping=kwargs)
        return True
    
    def delete_permission(self, permission_id: int) -> bool:
        """删除权限
        删除指定权限ID的权限信息，包括所有角色的该权限关联。
        
        参数:
        permission_id (int): 权限ID
        
        返回:
        bool: 若删除成功则返回True，否则返回False
        """
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
        """获取所有权限
        获取系统中所有权限的详细信息。
        
        返回:
        List[Dict]: 包含所有权限ID、编码、名称、类型、父ID、状态、描述、创建时间和更新时间的字典列表
        """
        try:
            if not self.redis_client:
                raise redis.RedisError("Redis未连接")
                
            # 只获取权限键，避免获取计数器等非权限键
            permission_keys = self.redis_client.keys("permission:*")
            permissions = []
            for permission_key in permission_keys:
                # 检查键是否为权限键（格式为permission:数字）
                key_str = permission_key.decode('utf-8') if isinstance(permission_key, bytes) else permission_key
                import re
                # 确保能匹配所有权限格式，包括菜单权限和操作权限
                if re.match(r'^permission:\d+$', key_str):
                    try:
                        permission_data = self.redis_client.hgetall(permission_key)
                        # 确保返回的数据格式一致，所有值都转换为字符串
                        formatted_permission = {}
                        for key, value in permission_data.items():
                            k = key.decode('utf-8') if isinstance(key, bytes) else key
                            v = value.decode('utf-8') if isinstance(value, bytes) else value
                            formatted_permission[k] = v
                        permissions.append(formatted_permission)
                    except redis.RedisError as e:
                        print(f"获取权限数据失败 {permission_key}: {str(e)}")
            # 按ID排序，确保权限列表顺序一致
            permissions.sort(key=lambda x: int(x['id']))
            return permissions
        except redis.RedisError as e:
            print(f"Redis操作失败: {str(e)}")
            return []
    
    # 用户角色关联
    def assign_role_to_user(self, user_id: int, role_id: int) -> bool:
        """给用户分配角色
        为指定用户ID分配指定角色ID。
        
        参数:
        user_id (int): 用户ID
        role_id (int): 角色ID
        
        返回:
        bool: 若分配成功则返回True，否则返回False
        """
        if not self.redis_client.exists(f"user:{user_id}") or not self.redis_client.exists(f"role:{role_id}"):
            return False
        
        self.redis_client.sadd(f"user:{user_id}:roles", role_id)
        return True
    
    def remove_role_from_user(self, user_id: int, role_id: int) -> bool:
        """从用户移除角色
        从指定用户ID移除指定角色ID。
        
        参数:
        user_id (int): 用户ID
        role_id (int): 角色ID
        
        返回:
        bool: 若移除成功则返回True，否则返回False
        """
        result = self.redis_client.srem(f"user:{user_id}:roles", role_id)
        return result > 0
    
    def get_user_roles(self, user_id: int) -> List[Dict]:
        """获取用户的所有角色
        获取指定用户ID的所有角色详细信息。
        
        参数:
        user_id (int): 用户ID
        
        返回:
        List[Dict]: 包含所有角色ID、编码、名称、描述、创建时间和更新时间的字典列表
        """
        role_ids = self.redis_client.smembers(f"user:{user_id}:roles")
        roles = []
        for role_id in role_ids:
            role_data = self.get_role_by_id(int(role_id))
            if role_data:
                roles.append(role_data)
        return roles
    
    # 角色权限关联
    def assign_permission_to_role(self, role_id: int, permission_id: int) -> bool:
        """给角色分配权限
        为指定角色ID分配指定权限ID。
        
        参数:
        role_id (int): 角色ID
        permission_id (int): 权限ID
        
        返回:
        bool: 若分配成功则返回True，否则返回False
        """
        role_exists = self.redis_client.exists(f"role:{role_id}")
        perm_exists = self.redis_client.exists(f"permission:{permission_id}")
        if not role_exists or not perm_exists:
            return False
        
        self.redis_client.sadd(f"role:{role_id}:permissions", permission_id)
        return True
    
    def remove_permission_from_role(self, role_id: int, permission_id: int) -> bool:
        """从角色移除权限
        从指定角色ID移除指定权限ID。
        
        参数:
        role_id (int): 角色ID
        permission_id (int): 权限ID
        
        返回:
        bool: 若移除成功则返回True，否则返回False
        """
        result = self.redis_client.srem(f"role:{role_id}:permissions", permission_id)
        return result > 0
    
    def get_role_permissions(self, role_id: int) -> List[Dict]:
        """获取角色的所有权限
        获取指定角色ID的所有权限详细信息。
        
        参数:
        role_id (int): 角色ID
        
        返回:
        List[Dict]: 包含所有权限ID、编码、名称、类型、父ID、状态、描述、创建时间和更新时间的字典列表
        """
        permission_ids = self.redis_client.smembers(f"role:{role_id}:permissions")
        permissions = []
        for permission_id in permission_ids:
            permission_data = self.get_permission_by_id(int(permission_id))
            if permission_data:
                permissions.append(permission_data)
        return permissions
    
    # 权限验证
    def get_user_permissions(self, user_id: int) -> List[Dict]:
        """获取用户的所有权限（通过角色）
        获取指定用户ID的所有权限详细信息，包括通过角色关联的权限。
        
        参数:
        user_id (int): 用户ID
        
        返回:
        List[Dict]: 包含所有权限ID、编码、名称、类型、父ID、路径、方法、创建时间和更新时间的字典列表
        """
        roles = self.get_user_roles(user_id)
        all_permissions = {}
        
        for role in roles:
            permissions = self.get_role_permissions(int(role['id']))
            for permission in permissions:
                all_permissions[permission['id']] = permission
        
        return list(all_permissions.values())
    
    def user_has_permission(self, user_id: int, permission_code: str) -> bool:
        """检查用户是否有指定权限
        检查指定用户ID是否有指定权限编码。
        
        参数:
        user_id (int): 用户ID
        permission_code (str): 权限编码
        
        返回:
        bool: 若用户有该权限则返回True，否则返回False
        """
        permissions = self.get_user_permissions(user_id)
        return any(p['code'] == permission_code for p in permissions)
    
    def user_has_role(self, user_id: int, role_name: str) -> bool:
        """检查用户是否有指定角色
        检查指定用户ID是否有指定角色名称。
        
        参数:
        user_id (int): 用户ID
        role_name (str): 角色名称
        
        返回:
        bool: 若用户有该角色则返回True，否则返回False
        """
        roles = self.get_user_roles(user_id)
        return any(r['name'] == role_name for r in roles)
    
    # 会话管理
    def create_session(self, user_id: int, expire_hours: int = 24) -> str:
        """创建用户会话
        创建一个新的会话token，包含用户ID、用户名、角色和权限信息。
        
        参数:
        user_id (int): 用户ID
        expire_hours (int, 可选): 会话过期时间，单位小时，默认24小时
        
        返回:
        str: 新创建的会话token
        """
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
        """获取会话信息
        获取指定会话token的会话信息。
        
        参数:
        token (str): 会话token
        
        返回:
        Optional[Dict]: 包含会话数据的字典，若会话不存在或已过期则返回None
        """
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
        """删除会话
        删除指定会话token的会话信息。
        
        参数:
        token (str): 会话token
        
        返回:
        bool: 若会话成功删除则返回True，否则返回False
        """
        session_key = f"session:{token}"
        if self.redis_client.exists(session_key):
            self.redis_client.delete(session_key)
            return True
        return False

# 创建全局实例
auth_manager = RedisAuthManager()