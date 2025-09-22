import sys
import os

# 把项目根目录加入 sys.path，便于复用 Redis 连接
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from app.interface.data2redis import connect_redis


def get_theme_names(keyword: str = '') -> list:
    """
    从 Redis 扫描并返回所有题材主题名称。
    - 来源键：theme:{theme_name}（Set）
    - 排除：theme:detail:*（Hash）
    - 过滤：包含 keyword 的名称
    返回：按字典序排序的名称列表
    """
    r = connect_redis()
    try:
        cursor = 0
        names = set()
        kw = (keyword or '').strip()
        while True:
            cursor, keys = r.scan(cursor=cursor, match='theme:*', count=500)
            for k in keys:
                if k.startswith('theme:detail:'):
                    continue
                # 键名：theme:{name}
                parts = k.split(':', 1)
                if len(parts) != 2:
                    continue
                name = parts[1]
                if (not kw) or (kw in name):
                    names.add(name)
            if cursor == 0:
                break
        return sorted(names)
    finally:
        r.close()


def get_theme_names_with_hot_num(keyword: str = '') -> list:
    """
    从 Redis 扫描并返回所有题材主题名称及其热度值。
    - 来源键：theme:{theme_name}（Set）
    - 排除：theme:detail:*（Hash）
    - 过滤：包含 keyword 的名称
    返回：按热度值从高到低排序的主题列表，格式：[{name, hot_num}]
    """
    r = connect_redis()
    try:
        cursor = 0
        themes = []
        kw = (keyword or '').strip()
        
        while True:
            cursor, keys = r.scan(cursor=cursor, match='theme:*', count=500)
            for k in keys:
                if k.startswith('theme:detail:'):
                    continue
                # 键名：theme:{name}
                parts = k.split(':', 1)
                if len(parts) != 2:
                    continue
                name = parts[1]
                if (not kw) or (kw in name):
                    # 获取该主题的热度值（从任意一个股票详情中获取）
                    codes = r.smembers(f"theme:{name}") or set()
                    hot_num = 0
                    if codes:
                        # 取第一个股票代码来获取热度值
                        first_code = next(iter(codes))
                        detail_key = f"theme:detail:{name}:{first_code}"
                        theme_detail = r.hgetall(detail_key) or {}
                        hot_num = int(theme_detail.get('hot_num', 0))
                    
                    themes.append({
                        'name': name,
                        'hot_num': hot_num
                    })
            if cursor == 0:
                break
        
        # 按热度值从高到低排序
        themes.sort(key=lambda x: x['hot_num'], reverse=True)
        return themes
    finally:
        r.close()


def get_theme_codes(theme_name: str) -> list:
    """返回某个主题下的成分股 6 位代码列表。"""
    if not theme_name:
        return []
    r = connect_redis()
    try:
        codes = r.smembers(f"theme:{theme_name}") or set()
        return sorted([c for c in codes if c])
    finally:
        r.close()


def get_theme_stock_details(theme_name: str) -> list:
    """
    仅读取 theme:detail:{theme_name}:{code} 哈希并返回（不合并 code:{code} 字段）。
    返回：[{ code, name, theme, desc, trade_date, ts_code, con_code, hot_num }]
    """
    if not theme_name:
        return []
    r = connect_redis()
    try:
        codes = r.smembers(f"theme:{theme_name}") or set()
        out = []
        for code in codes:
            if not code:
                continue
            detail_key = f"theme:detail:{theme_name}:{code}"
            theme_detail = r.hgetall(detail_key) or {}
            if not theme_detail:
                # 若明细不存在，至少返回 code 字段
                theme_detail = {'code': code, 'theme': theme_name, 'hot_num': '0'}
            # 确保hot_num字段存在，如果不存在则默认为0
            if 'hot_num' not in theme_detail:
                theme_detail['hot_num'] = '0'
            out.append(theme_detail)
        # 稳定输出顺序：按 code 排序
        out.sort(key=lambda x: str(x.get('code', '')))
        return out
    finally:
        r.close()


