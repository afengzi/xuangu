#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
管理后台API路由
用户权限管理相关接口
"""

from flask import Blueprint, request, jsonify, g
from functools import wraps
from ..models.auth import auth_manager
from ..utils import generate_token, decode_token

admin_bp = Blueprint('admin', __name__)

def login_required(f):
    """登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': '未提供认证令牌'}), 401
        
        # 移除Bearer前缀
        if token.startswith('Bearer '):
            token = token[7:]
        
        # 检查会话
        session_data = auth_manager.get_session(token)
        if not session_data:
            return jsonify({'error': '无效的认证令牌或会话已过期'}), 401
        
        # 将用户信息存储到g对象中
        g.current_user = {
            'id': int(session_data['user_id']),
            'username': session_data['username'],
            'roles': session_data['roles'],
            'permissions': session_data['permissions']
        }
        
        return f(*args, **kwargs)
    return decorated_function

def require_permission(permission_code):
    """权限验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': '请先登录'}), 401
            
            user_id = g.current_user['id']
            if not auth_manager.user_has_permission(user_id, permission_code):
                return jsonify({'error': '没有权限执行此操作'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role_name):
    """角色验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': '请先登录'}), 401
            
            user_id = g.current_user['id']
            if not auth_manager.user_has_role(user_id, role_name):
                return jsonify({'error': '需要特定角色才能执行此操作'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# 认证相关接口
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """管理员登录"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    # 验证用户密码
    if not auth_manager.verify_user_password(username, password):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    # 获取用户信息
    user = auth_manager.get_user_by_username(username)
    if not user or user.get('status') != '1':
        return jsonify({'error': '用户不存在或已被禁用'}), 401
    
    # 创建会话
    token = auth_manager.create_session(int(user['id']))
    
    # 获取用户权限信息
    roles = auth_manager.get_user_roles(int(user['id']))
    permissions = auth_manager.get_user_permissions(int(user['id']))
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user.get('email', ''),
            'roles': [r['name'] for r in roles],
            'permissions': [p['code'] for p in permissions]
        }
    })

@admin_bp.route('/logout', methods=['POST'])
@login_required
def admin_logout():
    """管理员退出登录"""
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]
    
    auth_manager.delete_session(token)
    return jsonify({'message': '退出登录成功'})

@admin_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """获取当前用户信息"""
    user_id = g.current_user['id']
    user = auth_manager.get_user_by_id(user_id)
    roles = auth_manager.get_user_roles(user_id)
    permissions = auth_manager.get_user_permissions(user_id)
    
    return jsonify({
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user.get('email', ''),
            'roles': roles,
            'permissions': permissions
        }
    })

# 用户管理接口
@admin_bp.route('/users', methods=['GET'])
@login_required
@require_permission('user:list')
def get_users():
    """获取用户列表"""
    try:
        page = int(request.args.get('page', 1))
        # 同时支持page_size和limit参数，优先使用limit
        page_size = int(request.args.get('limit', request.args.get('page_size', 10)))
        username = request.args.get('username', '')
        
        result = auth_manager.get_users(page, page_size)
        
        # 如果需要按用户名筛选
        if username:
            filtered_users = []
            for user in result['users']:
                if username.lower() in user['username'].lower():
                    filtered_users.append(user)
            result['users'] = filtered_users
            result['total'] = len(filtered_users)
        
        return jsonify(result)
    except Exception as e:
        print(f"获取用户列表失败: {str(e)}")
        return jsonify({'error': f'获取用户列表失败: {str(e)}'}), 500

@admin_bp.route('/users', methods=['POST'])
@login_required
@require_permission('user:add')
def create_user():
    """创建用户"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    # 检查用户名是否已存在
    if auth_manager.get_user_by_username(username):
        return jsonify({'error': '用户名已存在'}), 400
    
    try:
        user = auth_manager.create_user(username, password, email)
        return jsonify({
            'message': '用户创建成功',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'status': user['status']
            }
        })
    except Exception as e:
        return jsonify({'error': f'创建用户失败: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
@require_permission('user:view')
def get_user(user_id):
    """获取用户详情"""
    user = auth_manager.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    roles = auth_manager.get_user_roles(user_id)
    
    return jsonify({
        'user': user,
        'roles': roles
    })

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@require_permission('user:edit')
def update_user(user_id):
    """更新用户信息"""
    data = request.get_json()
    
    # 不能更新密码，密码更新需要单独的接口
    update_data = {}
    if 'email' in data:
        update_data['email'] = data['email']
    if 'status' in data:
        update_data['status'] = data['status']
    if 'username' in data:
        update_data['username'] = data['username']
    
    if not update_data:
        return jsonify({'error': '没有提供要更新的字段'}), 400
    
    success = auth_manager.update_user(user_id, **update_data)
    if success:
        return jsonify({'message': '用户更新成功'})
    else:
        return jsonify({'error': '用户不存在或更新失败'}), 404

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@require_permission('user:delete')
def delete_user(user_id):
    """删除用户"""
    success = auth_manager.delete_user(user_id)
    if success:
        return jsonify({'message': '用户删除成功'})
    else:
        return jsonify({'error': '用户不存在'}), 404

@admin_bp.route('/users/<int:user_id>/roles', methods=['PUT'])
@login_required
@require_permission('user:assign_role')
def assign_user_roles(user_id):
    """分配用户角色"""
    data = request.get_json()
    role_ids = data.get('role_ids', [])
    
    if not auth_manager.get_user_by_id(user_id):
        return jsonify({'error': '用户不存在'}), 404
    
    # 先清除现有角色
    existing_roles = auth_manager.get_user_roles(user_id)
    for role in existing_roles:
        auth_manager.remove_role_from_user(user_id, int(role['id']))
    
    # 分配新角色
    for role_id in role_ids:
        if not auth_manager.get_role_by_id(role_id):
            return jsonify({'error': f'角色不存在: {role_id}'}), 400
        auth_manager.assign_role_to_user(user_id, role_id)
    
    return jsonify({'message': '角色分配成功'})

# 角色管理接口
@admin_bp.route('/roles', methods=['GET'])
@login_required
@require_permission('role:list')
def get_roles():
    """获取角色列表"""
    roles = auth_manager.get_roles()
    return jsonify({'roles': roles})

@admin_bp.route('/roles', methods=['POST'])
@login_required
@require_permission('role:add')
def create_role():
    """创建角色"""
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': '角色名称不能为空'}), 400
    
    try:
        role = auth_manager.create_role(name, description)
        return jsonify({
            'message': '角色创建成功',
            'role': role
        })
    except Exception as e:
        return jsonify({'error': f'创建角色失败: {str(e)}'}), 500

@admin_bp.route('/roles/<int:role_id>', methods=['GET'])
@login_required
@require_permission('role:view')
def get_role(role_id):
    """获取角色详情"""
    role = auth_manager.get_role_by_id(role_id)
    if not role:
        return jsonify({'error': '角色不存在'}), 404
    
    permissions = auth_manager.get_role_permissions(role_id)
    
    return jsonify({
        'role': role,
        'permissions': permissions
    })

@admin_bp.route('/roles/<int:role_id>', methods=['PUT'])
@login_required
@require_permission('role:edit')
def update_role(role_id):
    """更新角色"""
    data = request.get_json()
    
    update_data = {}
    if 'name' in data:
        update_data['name'] = data['name']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'status' in data:
        update_data['status'] = data['status']
    
    if not update_data:
        return jsonify({'error': '没有提供要更新的字段'}), 400
    
    success = auth_manager.update_role(role_id, **update_data)
    if success:
        return jsonify({'message': '角色更新成功'})
    else:
        return jsonify({'error': '角色不存在'}), 404

@admin_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@login_required
@require_permission('role:delete')
def delete_role(role_id):
    """删除角色"""
    success = auth_manager.delete_role(role_id)
    if success:
        return jsonify({'message': '角色删除成功'})
    else:
        return jsonify({'error': '角色不存在'}), 404

@admin_bp.route('/roles/<int:role_id>/permissions', methods=['PUT'])
@login_required
@require_permission('role:assign_permission')
def assign_role_permissions(role_id):
    """分配角色权限"""
    data = request.get_json()
    permission_ids = data.get('permission_ids', [])
    
    if not auth_manager.get_role_by_id(role_id):
        return jsonify({'error': '角色不存在'}), 404
    
    # 先清除现有权限
    existing_permissions = auth_manager.get_role_permissions(role_id)
    for permission in existing_permissions:
        auth_manager.remove_permission_from_role(role_id, int(permission['id']))
    
    # 分配新权限
    for permission_id in permission_ids:
        if not auth_manager.get_permission_by_id(permission_id):
            return jsonify({'error': f'权限不存在: {permission_id}'}), 400
        auth_manager.assign_permission_to_role(role_id, permission_id)
    
    return jsonify({'message': '权限分配成功'})

# 权限管理接口
@admin_bp.route('/permissions', methods=['GET'])
@login_required
@require_permission('permission:list')
def get_permissions():
    """获取权限列表"""
    permissions = auth_manager.get_permissions()
    return jsonify({'permissions': permissions})

@admin_bp.route('/permissions', methods=['POST'])
@login_required
@require_permission('permission:add')
def create_permission():
    """创建权限"""
    data = request.get_json()
    code = data.get('code')
    name = data.get('name')
    permission_type = data.get('type', 'menu')
    parent_id = data.get('parent_id', 0)
    path = data.get('path', '')
    method = data.get('method', '')
    
    if not code or not name:
        return jsonify({'error': '权限代码和名称不能为空'}), 400
    
    try:
        permission = auth_manager.create_permission(code, name, permission_type, 
                                                   parent_id, path, method)
        return jsonify({
            'message': '权限创建成功',
            'permission': permission
        })
    except Exception as e:
        return jsonify({'error': f'创建权限失败: {str(e)}'}), 500

@admin_bp.route('/permissions/<int:permission_id>', methods=['GET'])
@login_required
@require_permission('permission:view')
def get_permission(permission_id):
    """获取权限详情"""
    permission = auth_manager.get_permission_by_id(permission_id)
    if not permission:
        return jsonify({'error': '权限不存在'}), 404
    
    return jsonify({'permission': permission})

@admin_bp.route('/permissions/<int:permission_id>', methods=['PUT'])
@login_required
@require_permission('permission:edit')
def update_permission(permission_id):
    """更新权限"""
    data = request.get_json()
    
    update_data = {}
    if 'code' in data:
        update_data['code'] = data['code']
    if 'name' in data:
        update_data['name'] = data['name']
    if 'type' in data:
        update_data['type'] = data['type']
    if 'parent_id' in data:
        update_data['parent_id'] = data['parent_id']
    if 'path' in data:
        update_data['path'] = data['path']
    if 'method' in data:
        update_data['method'] = data['method']
    
    if not update_data:
        return jsonify({'error': '没有提供要更新的字段'}), 400
    
    success = auth_manager.update_permission(permission_id, **update_data)
    if success:
        return jsonify({'message': '权限更新成功'})
    else:
        return jsonify({'error': '权限不存在'}), 404

@admin_bp.route('/permissions/<int:permission_id>', methods=['DELETE'])
@login_required
@require_permission('permission:delete')
def delete_permission(permission_id):
    """删除权限"""
    success = auth_manager.delete_permission(permission_id)
    if success:
        return jsonify({'message': '权限删除成功'})
    else:
        return jsonify({'error': '权限不存在'}), 404