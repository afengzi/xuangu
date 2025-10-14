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
    # 从请求体获取数据，而不是从URL参数
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == 'admin' and password == '123456':
        token = generate_token(username)
        return jsonify({'token': token})
    else:
        return jsonify({'error': 'Invalid username or password'}), 401


# 因子筛选
@main.route('/stock/filter/factors', methods=['POST'])
def get_factors_info_route():
    data = request.get_json()
    factors = data.get('factors')
    return jsonify(get_factors_info(factors))


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
    return jsonify(get_themes_info(themes))


# 题材和因子筛选
@main.route('/stock/filter/themes-and-factors', methods=['POST'])
def get_multi_theme_and_factor_all_info_route():
    data = request.get_json()
    themes = data.get('themes')
    factors = data.get('factors')
    return jsonify(get_multi_theme_and_factor_all_info(themes, factors))


# 股票详情
@main.route('/stock/filter/detail', methods=['POST'])
def get_detail_info_by_code_route():
    data = request.get_json()
    code = data.get('code')
    return jsonify(get_detail_info_by_code(code))


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
        return jsonify({'error': '特色指标名称不能为空'}), 400
    return jsonify(get_zhibiao_info(zhibiao))


# 特色指标 + 题材 + 因子 交集筛选
@main.route('/stock/filter/themes-factors-zhibiao', methods=['POST'])
def get_zhibiao_theme_factor_route():
    data = request.get_json()
    zhibiao = data.get('zhibiao')
    themes = data.get('themes') or []
    factors = data.get('factors') or []
    if not zhibiao:
        return jsonify({'error': '特色指标名称不能为空'}), 400
    return jsonify(get_zhibiao_factor_theme_info(zhibiao, themes, factors))
