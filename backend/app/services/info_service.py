import time
import requests
from .data_service import connect_redis

# 题材缓存
_themes_cache = None
_themes_cache_time = 0
CACHE_DURATION = 300  # 缓存5分钟

def get_zhibiao_set(zhibiao: str) -> set:
    """
    获取指标因子对应的股票代码集合
    zhibiao:str 指标因子名称
    返回:set 指标因子对应的股票代码集合
    """
    r = connect_redis()
    codes = r.smembers(f"zhibiao:{zhibiao}")
    r.close()
    return codes

def get_zhibiao_info(zhibiao: str) -> list:
    """
    获取指标因子对应的股票代码集合
    zhibiao:str 指标因子名称
    返回:list 指标因子对应的股票代码集合
    """
    r = connect_redis()
    codes = r.smembers(f"zhibiao:{zhibiao}")
    if not codes:
        return []
    info = {}
    for code in codes:
        info[code] = {}
        info[code]['股票简称'] = r.hmget(f"code:{code}", "股票简称")[0]
        info[code]['股票代码'] = code
        info[code]['特色指标'] = zhibiao
    r.close()
    return info

def capital_factor2key(factors: list) -> list:
    """
    获取资金面因子对应的键
    factors:list 因子名称
    返回:list 资金面因子对应的键
    """
    capital_keys = []
    # 资金面因子
    capital_factors1 = ['陆股通净流入_小于0', '陆股通净流入_0~1000万', '陆股通净流入_1000~5000万', '陆股通净流入_5000~10000万', '陆股通净流入_大于10000万']
    capital_factors2 = ['大单净额_小于0', '大单净额_0~1000万', '大单净额_1000~5000万', '大单净额_大于5000万']
    capital_factors3 = ['大单净量_小于0', '大单净量_0~1', '大单净量_1~3', '大单净量_大于3']
    # 资金面因子对应的键
    capital_codes = ['陆股通净流入', '大单净额', '大单净量']
    for factor in factors:
        if factor in capital_factors1:
            capital_keys.append(f"{capital_codes[0]}")
        if factor in capital_factors2:
            capital_keys.append(f"{capital_codes[1]}")
        if factor in capital_factors3:
            capital_keys.append(f"{capital_codes[2]}")
        else:
            continue
    return capital_keys


def fundamental_factor2key(factors: list) -> list:
    """
    获取基本面因子对应的键
    factors:list 因子名称
    返回:list 基本面因子对应的键
    """
    fundamental_keys = []
    # 基本面因子
    fundamental_factors1 = ['营业收入_小于5亿', '营业收入_5~10亿', '营业收入_10~20亿', '营业收入_20~50亿', '营业收入_大于50亿']
    fundamental_factors2 = ['市盈率_小于10', '市盈率_10~20', '市盈率_20~30', '市盈率_30~40', '市盈率_大于40']
    fundamental_factors3 = ['销售毛利率_小于5', '销售毛利率_5~20', '销售毛利率_20~35', '销售毛利率_35~40', '销售毛利率_大于40']
    fundamental_factors4 = ['ROE_小于5', 'ROE_5~10', 'ROE_10~20', 'ROE_大于20']
    fundamental_factors5 = ['净利润_亏损', '净利润_0~1亿', '净利润_1~3亿', '净利润_3~5亿', '净利润_大于5亿']
    fundamental_factors6 = ['市净率_小于1', '市净率_1~1.5', '市净率_1.5~2', '市净率_2~3', '市净率_大于3']
    fundamental_factors7 = ['资产负债率_小于10', '资产负债率_10~15', '资产负债率_15~30', '资产负债率_大于30']
    fundamental_codes = ['营业收入', '市盈率', '销售毛利率', 'ROE', '净利润', '市净率', '资产负债率']
    for factor in factors:
        if factor in fundamental_factors1:
            fundamental_keys.append(f"{fundamental_codes[0]}")
        if factor in fundamental_factors2:
            fundamental_keys.append(f"{fundamental_codes[1]}")
        if factor in fundamental_factors3:
            fundamental_keys.append(f"{fundamental_codes[2]}")
        if factor in fundamental_factors4:
            fundamental_keys.append(f"{fundamental_codes[3]}")
        if factor in fundamental_factors5:
            fundamental_keys.append(f"{fundamental_codes[4]}")
        if factor in fundamental_factors6:
            fundamental_keys.append(f"{fundamental_codes[5]}")
        if factor in fundamental_factors7:
            fundamental_keys.append(f"{fundamental_codes[6]}")
        else:
            continue
    return fundamental_keys


def append_technical_info(factors: list) -> str:
    """
    添加技术面因子对应的信息
    factors:list 因子名称
    功能:添加技术面因子对应的信息
    返回:dict 技术面因子对应的信息
    """
    info = {}
    technical_factors1 = ['MACD_金叉','MACD_底背离','MACD_拐头向上','MACD_0轴金叉']
    technical_factors2 = ['KDJ_金叉','KDJ_底背离','KDJ_拐头向上']
    technical_factors3 = ['BOLL_突破上轨','BOLL_突破下轨','BOLL_突破中轨','BOLL_开口向上']
    technical_factors4 = ['单k组合_大阳线','单k组合_小阳星','单k组合_向上跳空缺口','单k组合_向下跳空','单k组合_长下影线','单k组合_长上影线']
    technical_factors5 = ['均线_多头排列','均线_粘合','股价站上5日线','均线_股价站上60日线']

    for factor in factors:
        if factor in technical_factors1:
            info['MACD'] = factor
        if factor in technical_factors2:
            info['KDJ'] = factor
        if factor in technical_factors3:
            info['BOLL'] = factor
        if factor in technical_factors4:
            info['单k组合'] = factor
        if factor in technical_factors5:
            info['均线'] = factor
        else:
            continue
    return info

def preprocess_factor_keys(factors: list) -> list:
    """
    预处理因子键
    factors:多个因子名称
    返回:list 多个因子名称
    """
    all_factor_keys = []
    for factor in factors:
        # 基本面
        f_keys = fundamental_factor2key([factor])
        if isinstance(f_keys, list) and len(f_keys) > 0:
            all_factor_keys.extend(f_keys)
            continue
        # 资金面
        c_keys = capital_factor2key([factor])
        if isinstance(c_keys, list) and len(c_keys) > 0:
            all_factor_keys.extend(c_keys)
            continue
        # 技术面
        t_keys = technical_factor2key([factor])
        if isinstance(t_keys, list) and len(t_keys) > 0:
            all_factor_keys.extend(t_keys)
            continue
    return all_factor_keys

# 新增：技术面因子 -> 字段键 映射
def technical_factor2key(factors: list) -> list:
    """
    获取技术面因子对应的字段键
    factors:list 因子名称（如 'MACD_金叉'）
    返回:list 技术面字段键（如 ['MACD']）
    """
    keys = []
    technical_factors1 = ['MACD_金叉','MACD_底背离','MACD_拐头向上','MACD_0轴金叉']
    technical_factors2 = ['KDJ_金叉','KDJ_底背离','KDJ_拐头向上']
    technical_factors3 = ['BOLL_突破上轨','BOLL_突破下轨','BOLL_突破中轨','BOLL_开口向上']
    technical_factors4 = ['单k组合_大阳线','单k组合_小阳星','单k组合_向上跳空缺口','单k组合_向下跳空','单k组合_长下影线','单k组合_长上影线']
    technical_factors5 = ['均线_多头排列','均线_粘合','股价站上5日线','均线_股价站上60日线']
    for factor in factors:
        if factor in technical_factors1:
            keys.append('MACD')
        if factor in technical_factors2:
            keys.append('KDJ')
        if factor in technical_factors3:
            keys.append('BOLL')
        if factor in technical_factors4:
            keys.append('单k组合')
        if factor in technical_factors5:
            keys.append('均线')
        else:
            continue
    return keys

def get_factors_set(factors) -> set:
    """
    获取多个因子对应的股票代码集合
    factors:list 因子名称
    功能:获取多个因子对应的股票代码集合的交集
    返回:set 多个因子对应的股票代码集合的交集
    """
    try:
        r = connect_redis()
        if len(factors) == 1:
            codes = r.smembers(f"factor:{factors[0]}")
        else:
            # 计算所有因子的交集
            factor_keys = [f"factor:{factor}" for factor in factors]
            codes = r.sinter(*factor_keys)
        r.close()
        return codes
    except Exception as e:
        print(f"获取因子 {factors} 对应的股票代码集合失败: {e}")
        return set()


def convert_factor_value(factor_name: str, value) -> float:
    """
    转换因子数值到相应单位
    factor_name: 因子名称
    value: 原始数值
    返回: 转换后的数值（保留两位小数）
    """
    # 统一处理空值/NaN 字符串
    try:
      import math
    except Exception:
      math = None

    if value is None or value == '' or value == 'None':
        return 0.0
    # 字符串 'nan' 处理
    if isinstance(value, str) and value.strip().lower() == 'nan':
        return 0.0

    try:
        # 转换为浮点数
        num_value = float(value)
        # 浮点 NaN 处理
        if math and isinstance(num_value, float):
            try:
                if math.isnan(num_value):
                    return 0.0
            except Exception:
                pass
        
        # 根据因子名称进行单位转换
        if factor_name in ['营业收入', '净利润']:
            # 转换为亿元，保留两位小数
            return round(num_value / 100000000, 2)
        elif factor_name in ['大单净额', '陆股通净流入']:
            # 转换为万元，保留两位小数
            return round(num_value / 10000, 2)
        elif factor_name in ['销售毛利率', '资产负债率', 'ROE', '市盈率']:
            # 百分比数据，保留两位小数
            return round(num_value, 2)
        elif factor_name in ['市净率', '大单净量']:
            # 普通数值，保留两位小数
            return round(num_value, 2)
        else:
            # 其他数据，保留两位小数
            return round(num_value, 2)
    except (ValueError, TypeError):
        return 0.0


def get_factors_info(factors: list) -> dict:
    """
    获取股票代码对应的所有因子信息（优化版本，使用Pipeline批量查询）
    factors:list 因子名称
    功能:获取股票代码对应的所有因子信息
    返回:dict 股票代码对应的所有因子信息
    """
    try:
        r = connect_redis()
        info = {}
        list_factors = []
        # 基本面因子对应的键
        list_factors = fundamental_factor2key(factors)
        # 资金面因子对应的键
        list_factors = list_factors + capital_factor2key(factors)
        # 获取多个因子对应的股票代码集合
        code_set = get_factors_set(factors)
        
        if not code_set:
            r.close()
            return {}
        
        # 使用Pipeline批量获取数据，减少网络往返
        pipe = r.pipeline()
        
        # 为每个股票代码批量添加查询命令
        for code in code_set:
            # 获取股票简称
            pipe.hmget(f"code:{code}", "股票简称")
            # 批量获取所有因子数据
            if list_factors:
                pipe.hmget(f"code:{code}", *list_factors)
            else:
                pipe.hmget(f"code:{code}", "dummy")  # 占位符，避免空列表
        
        # 执行批量查询
        results = pipe.execute()
        
        # 处理批量查询结果
        result_index = 0
        for code in code_set:
            info[code] = {}
            
            # 处理股票简称
            stock_name = results[result_index]
            if isinstance(stock_name, list) and len(stock_name) > 0 and stock_name[0]:
                info[code]['股票简称'] = stock_name[0]
            result_index += 1
            
            # 处理因子数据
            if list_factors:
                factor_values = results[result_index]
                if isinstance(factor_values, list):
                    for i, factor in enumerate(list_factors):
                        if i < len(factor_values) and factor_values[i] is not None:
                            # 转换单位
                            converted_value = convert_factor_value(factor, factor_values[i])
                            info[code][factor] = converted_value
                result_index += 1
            else:
                result_index += 1
            
            # 添加技术面信息
            factor_info = append_technical_info(factors)
            info[code].update(factor_info)
        
        r.close()
        return info
    except Exception as e:
        print(f"获取股票代码 {factors} 信息失败: {e}")
        return {}


def get_themes_set(themes: list) -> set:
    """
    获取题材对应的股票代码集合
    themes:list 题材名称
    功能:获取题材对应的股票代码集合
    返回:set 题材对应的股票代码集合
    """
    r = connect_redis()
    try:
        if len(themes) == 1:
            codes = r.smembers(f"theme:{themes[0]}")
        else:
            # 获取多个题材对应的股票代码的交集
            theme_keys = [f"theme:{theme}" for theme in themes]
            codes = r.sinter(*theme_keys)
        r.close()
        return codes
    except Exception as e:
        print(f"获取题材 {themes} 对应的股票代码集合失败: {e}")
        return set()

def get_themes_key() -> list:
    """
    获取题材名称和人气值（优化版本，带缓存）
    返回:list 包含题材名称和人气值的字典列表
    """
    global _themes_cache, _themes_cache_time
    
    # 检查缓存
    current_time = time.time()
    if _themes_cache and (current_time - _themes_cache_time) < CACHE_DURATION:
        return _themes_cache
    
    r = connect_redis()
    try:
        # 使用SCAN代替KEYS，避免阻塞Redis
        theme_stats = {}
        cursor = 0
        
        while True:
            # 使用SCAN命令分批获取键，避免一次性获取所有键
            cursor, keys = r.scan(cursor, match="theme:detail:*", count=1000)
            
            if not keys:
                break
                
            # 批量获取所有键的数据，减少网络往返
            if keys:
                # 使用pipeline批量获取数据
                pipe = r.pipeline()
                for key in keys:
                    pipe.hget(key, 'hot_num')
                hot_nums = pipe.execute()
                
                # 处理数据
                for key, hot_num in zip(keys, hot_nums):
                    # theme:detail:题材名:股票代码
                    parts = key.split(':')
                    if len(parts) >= 3:
                        theme_name = parts[2]
                        hot_num = int(hot_num) if hot_num else 0
                        
                        if theme_name not in theme_stats:
                            theme_stats[theme_name] = {
                                'name': theme_name,
                                'stock_count': 0,
                                'max_hot_num': 0,
                                'total_hot_num': 0
                            }
                        
                        theme_stats[theme_name]['stock_count'] += 1
                        theme_stats[theme_name]['max_hot_num'] = max(theme_stats[theme_name]['max_hot_num'], hot_num)
                        theme_stats[theme_name]['total_hot_num'] += hot_num
            
            if cursor == 0:
                break
        
        # 转换为列表并按热度值排序（优先按最大热度值，然后按总热度值，最后按股票数量）
        themes = list(theme_stats.values())
        themes.sort(key=lambda x: (x['max_hot_num'], x['total_hot_num'], x['stock_count']), reverse=True)
        
        # 更新缓存
        _themes_cache = themes
        _themes_cache_time = current_time
        
        r.close()
        return themes
    except Exception as e:
        print(f"获取题材信息失败: {e}")
        return []

def get_themes_info(themes: list) -> dict:
    """
    获取题材对应的股票代码及其对应的信息（优化版本，使用Pipeline批量查询）
    themes:list 题材名称
    功能:获取题材对应的股票代码及其对应的信息
    返回:dict 题材对应的股票代码及其对应的信息
    """
    try:
        r = connect_redis()
        codes = get_themes_set(themes)
        
        if not codes:
            r.close()
            return {}
        
        info = {}
        
        # 使用Pipeline批量获取数据
        pipe = r.pipeline()
        
        for code in codes:
            # 为每个股票代码批量获取所有题材的详情信息
            for theme in themes:
                pipe.hmget(f"theme:detail:{theme}:{code}", "desc", "theme", "name", "hot_num", "trade_date")
        
        # 执行批量查询
        results = pipe.execute()
        
        # 处理批量查询结果
        result_index = 0
        for code in codes:
            info[code] = {}
            
            # 获取所有选中题材的详情信息
            all_themes_info = []
            for theme in themes:
                theme_detail = results[result_index]
                if isinstance(theme_detail, list) and len(theme_detail) >= 5 and theme_detail[0]:
                    all_themes_info.append({
                        'theme': theme,
                        'desc': theme_detail[0],
                        'name': theme_detail[2] if len(theme_detail) > 2 else '',
                        'hot_num': theme_detail[3] if len(theme_detail) > 3 else 0,
                        'trade_date': theme_detail[4] if len(theme_detail) > 4 else ''
                    })
                result_index += 1
            
            if all_themes_info:
                # 如果有多个题材，合并题材名称
                if len(all_themes_info) > 1:
                    info[code]['题材'] = '、'.join([t['theme'] for t in all_themes_info])
                    info[code]['题材描述'] = '；'.join([f"{t['theme']}:{t['desc']}" for t in all_themes_info])
                else:
                    info[code]['题材'] = all_themes_info[0]['theme']
                    info[code]['题材描述'] = all_themes_info[0]['desc']
                
                # 使用第一个题材的股票简称和热度值
                info[code]['股票简称'] = all_themes_info[0]['name']
                info[code]['热度值'] = all_themes_info[0]['hot_num']
                info[code]['交易日期'] = all_themes_info[0]['trade_date']
        
        r.close()
        return info
    except Exception as e:
        print(f"获取题材 {themes} 信息失败: {e}")
        return {}


def get_multi_theme_and_factor_all_info(themes, factors) -> dict:
    """
    获取多个题材和多个因子交集的股票代码及其对应的信息（优化版本，使用Pipeline批量查询）
    themes:多个题材名称
    factors:多个因子名称
    功能:获取多个题材和多个因子交集的股票代码及其对应的信息
    返回:dict 题材和因子交集的股票代码及其对应的信息
    """
    try:
        info = {}
        r = connect_redis()
        themes_set = get_themes_set(themes)
        factors_set = get_factors_set(factors)  
        codes = themes_set & factors_set
        if not codes:
            r.close()
            return {}
        
        # 预处理因子键  
        all_factor_keys = preprocess_factor_keys(factors)
        if not all_factor_keys:
            r.close()
            return {}
        
        # 使用Pipeline批量获取数据
        pipe = r.pipeline()
        
        for code in codes:
            # 获取股票简称
            pipe.hmget(f"code:{code}", "股票简称")
            
            # 获取题材信息
            if themes:
                pipe.hmget(f"theme:detail:{themes[0]}:{code}", "desc", "theme")
            
            # 批量获取因子数据
            if all_factor_keys:
                pipe.hmget(f"code:{code}", *all_factor_keys)
        
        # 执行批量查询
        results = pipe.execute()
        
        # 处理批量查询结果
        result_index = 0
        for code in codes:
            info[code] = {}
            
            # 处理股票简称
            stock_name = results[result_index]
            if isinstance(stock_name, list) and len(stock_name) > 0 and stock_name[0]:
                info[code]['股票简称'] = stock_name[0]
            result_index += 1
            
            # 处理题材信息
            if themes:
                theme_data = results[result_index]
                if isinstance(theme_data, list) and len(theme_data) >= 2:
                    if theme_data[0]:
                        info[code]['题材描述'] = theme_data[0]
                    if theme_data[1]:
                        info[code]['主题'] = theme_data[1]
                result_index += 1
            
            # 处理因子数据
            if all_factor_keys:
                factor_values = results[result_index]
                if isinstance(factor_values, list):
                    for i, factor_key in enumerate(all_factor_keys):
                        if i < len(factor_values) and factor_values[i] is not None:
                            # 转换单位
                            converted_value = convert_factor_value(factor_key, factor_values[i])
                            info[code][factor_key] = converted_value
                result_index += 1
            
            # 添加技术面信息
            for factor in factors:
                t_info = append_technical_info([factor])
                if isinstance(t_info, dict) and len(t_info) > 0:
                    info[code].update(t_info)
        
        r.close()
        return info
    except Exception as e:
        print(f"获取多个题材和多个因子交集的股票代码及其对应的信息失败: {e}")
        return {}


def get_zhibiao_factor_theme_info(zhibiao: str, themes: list, factors: list) -> dict:
    """
    获取多个题材和多个因子交集的股票代码及其对应的信息（优化版本，使用Pipeline批量查询）
    zhibiao:特色指标名称
    themes:多个题材名称
    factors:多个因子名称
    功能:获取特色指标和多个题材和多个因子交集的股票代码及其对应的信息
    返回:dict 题材和因子交集的股票代码及其对应的信息
    """
    try:
        info = {}
        r = connect_redis()
        # 以指标集合为基础，按需与题材/因子集合相交
        zhibiao_set = get_zhibiao_set(zhibiao)
        codes = set(zhibiao_set) if zhibiao_set else set()
        if themes and len(themes) > 0:
            themes_set = get_themes_set(themes)
            codes = codes & themes_set
        if factors and len(factors) > 0:
            factors_set = get_factors_set(factors)
            codes = codes & factors_set

        if not codes:
            r.close()
            return {}

        # 预处理需要读取的特色指标字段（由因子键派生），可为空
        all_factor_keys = preprocess_factor_keys(factors) if (factors and len(factors) > 0) else []

        # Pipeline 批量读取：每个 code 读取2~4次（视题材/因子是否存在而定）
        pipe = r.pipeline()
        for code in codes:
            # 基础信息
            pipe.hmget(f"code:{code}", "股票简称")
            # 题材细节（可选）
            if themes and len(themes) > 0:
                pipe.hmget(f"theme:detail:{themes[0]}:{code}", "desc", "theme")
            # 指标热度值
            pipe.hmget(f"zhibiao:{zhibiao}:{code}", "热度值")
            # 基本面/资金面/技术面键值（存放于 code:{code}，可选）
            if all_factor_keys:
                pipe.hmget(f"code:{code}", *all_factor_keys)
        results = pipe.execute()

        # 结果解析：每个代码对应 2~4 条结果
        idx = 0
        for code in codes:
            base = results[idx]; idx += 1  # [股票简称]
            theme_detail = None
            if themes and len(themes) > 0:
                theme_detail = results[idx]; idx += 1  # [desc, theme]
            zhibiao_vals = results[idx]; idx += 1  # [热度值]
            factor_values = None
            if all_factor_keys:
                factor_values = results[idx]; idx += 1  # [factor values]

            info[code] = {}
            info[code]['股票简称'] = base[0] if base else None
            if theme_detail:
                info[code]['题材描述'] = theme_detail[0]
                info[code]['题材'] = theme_detail[1]
            info[code]['特色指标'] = zhibiao

            # 热度值
            if zhibiao_vals and len(zhibiao_vals) > 0 and zhibiao_vals[0] is not None:
                info[code]['热度值'] = zhibiao_vals[0]

            # 因子值（来自 code:{code}）
            if isinstance(factor_values, list) and all_factor_keys:
                for i, factor_key in enumerate(all_factor_keys):
                    val = factor_values[i] if i < len(factor_values) else None
                    if val is not None:
                        converted_value = convert_factor_value(factor_key, val)
                        info[code][factor_key] = converted_value

            # 追加技术面信息（若有）
            if factors and len(factors) > 0:
                for factor in factors:
                    t_info = append_technical_info([factor])
                    if isinstance(t_info, dict) and len(t_info) > 0:
                        info[code].update(t_info)

        r.close()
        return info
    except Exception as e:
        print(f"获取特色指标、多个题材和多个因子交集的股票代码及其对应的信息失败: {e}")
        return {}


def get_detail_info_by_code(code: str) -> dict:
    """
    获取股票代码对应的所有信息
    code:str 股票代码
    功能:获取股票代码对应的所有信息
    返回:dict 股票代码对应的所有信息
    """
    try:
        response = requests.get(f"http://192.168.1.188:8077/get-stock-analysis?stock_code={code}")
        if response.status_code == 200:
            return response.json()
        else:
            return {}
    except Exception as e:
        print(f"获取股票代码 {code} 信息失败: {e}")
        return {}

