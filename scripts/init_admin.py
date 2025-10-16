#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
初始化管理员账户和基础权限数据
"""

import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_path)

from backend.app.models.auth import auth_manager

def init_permissions():
    """初始化基础权限"""
    permissions = [
        # 用户管理权限
        {'code': 'user:list', 'name': '查看用户列表', 'type': 'operation','status':1,'description':'查看所有用户信息'},
        {'code': 'user:view', 'name': '查看用户详情', 'type': 'operation','status':1,'description':'查看用户详细信息'},
        {'code': 'user:add', 'name': '添加用户', 'type': 'operation','status':1,'description':'添加新用户'},
        {'code': 'user:edit', 'name': '编辑用户', 'type': 'operation','status':1,'description':'编辑用户信息'},
        {'code': 'user:delete', 'name': '删除用户', 'type': 'operation','status':1,'description':'删除用户'},
        {'code': 'user:assign_role', 'name': '分配用户角色', 'type': 'operation','status':1,'description':'为用户分配角色'},
        
        # 角色管理权限
        {'code': 'role:list', 'name': '查看角色列表', 'type': 'operation','status':1,'description':'查看所有角色信息'},
        {'code': 'role:view', 'name': '查看角色详情', 'type': 'operation','status':1,'description':'查看角色详细信息'},
        {'code': 'role:add', 'name': '添加角色', 'type': 'operation','status':1,'description':'添加新角色'},
        {'code': 'role:edit', 'name': '编辑角色', 'type': 'operation','status':1,'description':'编辑角色信息'},
        {'code': 'role:delete', 'name': '删除角色', 'type': 'operation','status':1,'description':'删除角色'},
        {'code': 'role:assign_permission', 'name': '分配角色权限', 'type': 'operation','status':1,'description':'为角色分配权限'},
        
        # 权限管理权限
        {'code': 'permission:list', 'name': '查看权限列表', 'type': 'operation','status':1,'description':'查看所有权限信息'},
        {'code': 'permission:view', 'name': '查看权限详情', 'type': 'operation','status':1,'description':'查看权限详细信息'},
        {'code': 'permission:add', 'name': '添加权限', 'type': 'operation','status':1,'description':'添加新权限'},
        {'code': 'permission:edit', 'name': '编辑权限', 'type': 'operation','status':1,'description':'编辑权限信息'},
        {'code': 'permission:delete', 'name': '删除权限', 'type': 'operation','status':1,'description':'删除权限'},
    ]
    
    permission_ids = []
    for perm in permissions:
        permission = auth_manager.create_permission(
            code=perm['code'],
            name=perm['name'],
            permission_type=perm['type'],
            status=perm['status'],
            description=perm['description']
        )
        permission_ids.append(permission['id'])
        print(f"✓ 创建权限: {perm['name']} ({perm['code']})")
    
    return permission_ids

def init_roles():
    """初始化基础角色"""
    # 创建超级管理员角色
    admin_role = auth_manager.create_role(
        name='super_admin',
        description='拥有所有权限的系统管理员'
    )
    print(f"✓ 创建角色: {admin_role['name']}")
    
    # 创建普通管理员角色
    manager_role = auth_manager.create_role(
        name='admin',
        description='拥有基本管理权限的管理员'
    )
    print(f"✓ 创建角色: {manager_role['name']}")
    
    return admin_role['id'], manager_role['id']

def assign_permissions_to_roles(admin_role_id, manager_role_id):
    """为角色分配权限"""
    # 超级管理员拥有所有权限
    permissions = auth_manager.get_permissions()
    for permission in permissions:
        auth_manager.assign_permission_to_role(admin_role_id, int(permission['id']))
    print(f"✓ 为超级管理员分配了 {len(permissions)} 个权限")
    
    # 普通管理员只拥有查看权限
    viewer_permissions = ['user:list', 'user:view', 'role:list', 'role:view', 'permission:list', 'permission:view']
    for perm_code in viewer_permissions:
        permission = next((p for p in permissions if p['code'] == perm_code), None)
        if permission:
            auth_manager.assign_permission_to_role(manager_role_id, int(permission['id']))
    print(f"✓ 为普通管理员分配了 {len(viewer_permissions)} 个权限")

def create_admin_user():
    """创建默认管理员用户"""
    # 检查是否已存在管理员用户
    if auth_manager.get_user_by_username('admin'):
        print("⚠ 管理员用户 'admin' 已存在，跳过创建")
        return None
    
    # 创建管理员用户
    admin_user = auth_manager.create_user(
        username='admin',
        password='admin123',
        email='admin@example.com'
    )
    print(f"✓ 创建管理员用户: {admin_user['username']}")
    
    return admin_user['id']


def main():
    """主函数"""
    print("开始初始化权限管理系统...")
    print("-" * 50)
    
    try:
        # 1. 初始化权限
        print("1. 初始化基础权限...")
        permission_ids = init_permissions()
        
        # 2. 初始化角色
        print("\n2. 初始化基础角色...")
        admin_role_id, manager_role_id = init_roles()
        
        # 3. 为角色分配权限
        print("\n3. 为角色分配权限...")
        assign_permissions_to_roles(admin_role_id, manager_role_id)
        
        # 4. 创建管理员用户
        print("\n4. 创建管理员用户...")
        admin_user_id = create_admin_user()
        
        if admin_user_id:
            # 5. 为管理员用户分配超级管理员角色
            print("\n5. 为管理员用户分配角色...")
            auth_manager.assign_role_to_user(admin_user_id, admin_role_id)
            print(f"✓ 为管理员用户分配了超级管理员角色")
        
        print("\n" + "=" * 50)
        print("权限管理系统初始化完成！")
        print("默认管理员账户:")
        print("  用户名: admin")
        print("  密码: admin123")
        print("\n请尽快修改默认密码！")
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())