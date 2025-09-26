from flask import Blueprint, render_template

# 提供 IE11 兼容页面的蓝图（不带 /api 前缀）
legacy_bp = Blueprint(
    'legacy', __name__,
    template_folder='templates',
    static_folder='static'
)


@legacy_bp.route('/legacy/')
def legacy_index():
    # 纯后端模板渲染入口，前端 JS 负责请求 /api 接口获取数据
    return render_template('legacy/index.html')


