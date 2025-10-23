from flask import request, jsonify
from .services.info_service import (
    get_factors_info, get_themes_info, get_multi_theme_and_factor_all_info,
    get_detail_info_by_code, get_themes_key, get_zhibiao_info, 
    get_zhibiao_factor_theme_info
)
from .utils import generate_token
from flask import Blueprint

main = Blueprint('main', __name__)


# 健康检查
@main.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': '服务正常运行'})


# 登录
@main.route('/login', methods=['POST'])
def login():
    """用户登录验证"""
    from .models.auth import auth_manager
    
    # 从请求体获取数据
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
    if not user:
        print(f"用户 {username} 不存在")
        return jsonify({'error': '用户不存在'}), 401
    
    print(f"找到用户: {username}, ID: {user['id']}, 状态: {user.get('status')}")
    
    # 验证用户账号状态是否被禁用
    user_status = user.get('status')
    print(f"用户 {username} 状态: {user_status}")
    
    # 状态为0或'0'表示禁用，其他值表示启用
    if user_status == 0 or user_status == '0':
        return jsonify({'error': '账号已被禁用'}), 401
    
    # 验证用户是否具备登录权限 (stock:filter)
    try:
        user_permissions = auth_manager.get_user_permissions(int(user['id']))
        print(f"用户 {username} 的权限列表: {[p.get('code') for p in user_permissions if p.get('code')]}")
        
        # 检查多种可能的权限代码格式
        permission_codes = [p.get('code') for p in user_permissions if p.get('code')]
        has_login_permission = (
            'stock:filter' in permission_codes or
            'stock:fliter' in permission_codes or  # 处理可能的拼写错误
            'filter' in permission_codes
        )
        
        if not has_login_permission:
            print(f"用户 {username} 没有stock:filter权限，拒绝登录")
            return jsonify({'error': '没有权限'}), 403
        else:
            print(f"用户 {username} 权限验证通过")
            
    except Exception as e:
        print(f"验证用户权限时出错: {str(e)}")
        return jsonify({'error': '权限验证失败'}), 500
    
    # 创建会话
    token = auth_manager.create_session(int(user['id']))
    
    # 获取用户权限信息
    roles = auth_manager.get_user_roles(int(user['id']))
    permissions = auth_manager.get_user_permissions(int(user['id']))
    
    # 更新最后登录时间
    from datetime import datetime
    auth_manager.update_user(int(user['id']), last_login=datetime.now().isoformat())
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user.get('email', ''),
            'roles': [r['name'] for r in roles],
            'role_details': [{"name": r['name'], "description": r.get('description', '')} for r in roles],
            'permissions': [p['code'] for p in permissions]
        }
    })


# 因子筛选
@main.route('/stock/filter/factors', methods=['POST'])
def get_factors_info_route():
    data = request.get_json()
    factors = data.get('factors')
    result = get_factors_info(factors)
    return jsonify({'code': 200, 'data': result})


# 获取所有题材列表
@main.route('/theme/list', methods=['GET'])
def get_all_themes_route():
    themes = get_themes_key()
    return jsonify({'themes': themes})

# 题材筛选
@main.route('/stock/filter/themes', methods=['POST'])
def get_themes_info_route():
    data = request.get_json()
    themes = data.get('themes')
    result = get_themes_info(themes)
    return jsonify({'code': 200, 'data': result})


# 题材和因子筛选
@main.route('/stock/filter/themes-and-factors', methods=['POST'])
def get_multi_theme_and_factor_all_info_route():
    data = request.get_json()
    themes = data.get('themes')
    factors = data.get('factors')
    result = get_multi_theme_and_factor_all_info(themes, factors)
    return jsonify({'code': 200, 'data': result})


# 股票详情
@main.route('/stock/filter/detail', methods=['POST'])
def get_detail_info_by_code_route():
    data = request.get_json()
    code = data.get('code')
    result = get_detail_info_by_code(code)
    
    # 检查结果是否包含错误信息
    if result and result.get('error'):
        error_msg = result.get('message', f'获取股票{code}详情失败，请稍后再试')
        return jsonify({'code': 400, 'error': error_msg}), 400
    
    # 如果结果为空或None，说明获取股票详情失败
    if not result:
        return jsonify({'code': 400, 'error': f'获取股票{code}详情失败，请稍后再试'}), 400
    
    return jsonify({'code': 200, 'data': result})


# 特色指标查询
@main.route('/stock/filter/zhibiao', methods=['POST'])
def get_zhibiao_info_route():
    """
    特色指标查询接口
    入参：zhibiao - 特色指标名称
    返回：特色指标对应的股票信息
    """
    data = request.get_json()
    zhibiao = data.get('zhibiao')
    if not zhibiao:
        return jsonify({'code': 400, 'error': '特色指标名称不能为空'}), 400
    result = get_zhibiao_info(zhibiao)
    return jsonify({'code': 200, 'data': result})


# 特色指标 + 题材 + 因子 交集筛选
@main.route('/stock/filter/themes-factors-zhibiao', methods=['POST'])
def get_zhibiao_theme_factor_route():
    data = request.get_json()
    zhibiao = data.get('zhibiao')
    themes = data.get('themes') or []
    factors = data.get('factors') or []
    if not zhibiao:
        return jsonify({'code': 400, 'error': '特色指标名称不能为空'}), 400
    result = get_zhibiao_factor_theme_info(zhibiao, themes, factors)
    return jsonify({'code': 200, 'data': result})
