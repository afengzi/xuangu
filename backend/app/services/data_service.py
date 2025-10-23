import pywencai
import redis
import time
import pandas as pd
from ..config import Config

config = Config()

# 当前日期
date = '20250915'
now_date = time.strftime('%Y%m%d', time.localtime(time.time()))
# 新日期
new_date =20250630

def connect_redis():
    """
    连接Redis数据库
    host:str 主机名
    port:int 端口
    db:int 数据库
    password:str 密码
    socket_timeout:int 超时时间
    返回:redis.Redis 连接对象
    """
    try:
        return redis.Redis(
            host=config.REDIS_LOCALHOST,
            port=config.REDIS_PORT, 
            db=config.REDIS_DB,
            password=config.REDIS_PASSWORD,
            socket_timeout=config.REDIS_SOCKET_TIMEOUT,
            decode_responses=True
        )
    except Exception as e:
        print(f"连接redis失败: {e}")
        exit(1)

def technical2factor(factor):
    """ 
    获取技术面因子并且写入redis
    factor:str 因子名称
    返回:None
    """
    try:
        r = connect_redis()
        df = pywencai.get(query=factor, sort_key=factor, sort_order='asc', loop=True)
        if df is not None and 'code' in df.columns and df['code'] is not None:
            for code in df['code']:
                if code is not None and code != '':
                    if code not in r.smembers(f"factor:{factor}"):
                        r.sadd(f"factor:{factor}", code)
                    else: 
                        print(f"{code} 已存在")
        else:
            print(f"{factor} 为空")
        r.close()
    except Exception as e:
        print(f"处理技术面因子 {factor} 失败: {e}")

def capital2code(factor) -> None:
    """
    获取资金面因子并且写入redis
    factor:str 因子名称
    返回:None
    """
    try:
        r = connect_redis()
        df = pywencai.get(query=factor, sort_key=factor, sort_order='asc', loop=True)
        
        if df is None:
            print(f"{factor} 为空")
            return
            
        # 添加类型检查
        if isinstance(df, dict):
            print(f"{factor} 返回的是字典格式，需要特殊处理")
            # 处理字典格式的数据
            return
        elif not hasattr(df, 'iterrows'):
            print(f"{factor} 数据类型不支持: {type(df)}")
            return
            
        # 原有的 DataFrame 处理逻辑
        column = f'dde{factor}[{date}]'
        if column in df.columns:
            for _, row in safe_iterate_data(df, factor):
                if row['code'] != '' and row[column] != '':
                    if factor not in r.hkeys(f"code:{row['code']}"):
                        r.hset(f"code:{row['code']}", mapping={factor: row[column]})
                    else: 
                        print(f"{row['code']} {factor} 已存在")
                else:
                    print(f"{row['code']} {factor} 为空")
        r.close()
    except Exception as e:
        print(f"处理资金面因子 {factor} 失败: {e}")

def capital2factor(factor) -> None:
    """
    获取资金面因子并且写入redis
    factor:str 因子名称
    返回:None
    """
    try:
        r = connect_redis()
        df = pywencai.get(query=factor, sort_key=factor, sort_order='asc', loop=True)
        if df is None:
            print(f"{factor} 为空")
            return
        for _, row in safe_iterate_data(df, factor):
            if row['code'] != '':
                if row['code'] not in r.smembers(f"factor:{factor}"):
                    r.sadd(f"factor:{factor}", row['code'])
                else: 
                    print(f"{row['code']} 已存在")
            else:
                print(f"{row['code']} 为空")
        r.close()
    except Exception as e:
        print(f"处理资金面因子 {factor} 失败: {e}")

def special1_fundamental2code() -> None:
    """
    获取净利润,roe并且写入redis
    返回:None
    """
    try:
        r = connect_redis()
        df1 = pywencai.get(query='净利润', sort_key='净利润', sort_order='asc', loop=True)
        if df1 is None:
            print(f"净利润 为空")
            return
        column1 = f'归属于母公司所有者的净利润[{new_date}]'
        column2 = f'净资产收益率roe(加权,公布值)[{new_date}]'
        for _, row in safe_iterate_data(df1, '净利润'):
            if row['code'] != '':
                # 处理空值，用 'nan' 替代
                profit = row[column1] if pd.notna(row[column1]) else 'nan'
                if column1 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'净利润': profit})
                else: 
                    print(f"{row['code']} 净利润 已存在")

        df2 = pywencai.get(query='ROE', sort_key='ROE', sort_order='asc', loop=True)
        if df2 is None:
            print(f"ROE 为空")
            return
        for _, row in safe_iterate_data(df2, 'ROE'):
            if row['code'] != '':
                # 处理空值，用 'nan' 替代
                roe = row[column2] if pd.notna(row[column2]) else 'nan'
                if column2 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'ROE': roe})
                else: 
                    print(f"{row['code']} ROE 已存在")
        r.close()
    except Exception as e:
        print(f"处理基本面因子 净利润,roe 失败: {e}")

def normal_fundamental2code() -> None:
    """
    获取营业收入,销售毛利率,资产负债率并且写入redis
    返回:None
    """
    try:
        r = connect_redis()
        df1 = pywencai.get(query='销售毛利率', sort_key='销售毛利率', sort_order='asc' , loop=True)
        if df1 is None:
            print(f"销售毛利率为空")
            return
            
        column1 = f'销售毛利率[{new_date}]'
        column2 = f'营业收入[{new_date}]'
        column3 = '股票简称'
        column4 = f'资产负债率[{new_date}]'
        
        
        for _, row in safe_iterate_data(df1, '销售毛利率'):
            if row['code'] != '':
                # 处理空值，用 'nan' 替代
                sales_margin = row[column1] if pd.notna(row[column1]) else 'nan'
                revenue = row[column2] if pd.notna(row[column2]) else 'nan'
                
                if column1 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'销售毛利率': sales_margin})
                else: 
                    print(f"{row['code']} 销售毛利率 已存在")
                    
                if column2 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'营业收入': revenue})
                else: 
                    print(f"{row['code']} 营业收入 已存在")
                if column3 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'股票简称': row[column3]})
                else: 
                    print(f"{row['code']} 股票简称 已存在")
            else:
                print(f"{row['code']} 为空")
                
        # 资产负债率
        df2 = pywencai.get(query='资产负债率', sort_key='资产负债率', sort_order='asc' , loop=True)
        if df2 is None:
            print(f"资产负债率为空")
            return
            
        for _, row in safe_iterate_data(df2, '资产负债率'):
            if row['code'] != '':
                debt_ratio = row[column4] if pd.notna(row[column4]) else 'nan'
                
                if column3 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'资产负债率': debt_ratio})
                else: 
                    print(f"{row['code']} 资产负债率 已存在")
            else:
                print(f"{row['code']} 为空")
                
        r.close()
    except Exception as e:
        print(f"处理基本面因子 营业收入,销售毛利率,资产负债率 失败: {e}")

def special2_fundamental2code() -> None:
    """
    获取市净率,市盈率并且写入redis
    返回:None
    """
    try:
        r = connect_redis()
        df = pywencai.get(query='市净率', sort_key='市净率', sort_order='asc', loop=True)
        if df is None:
            print(f"市净率 为空")
            return
        column1 = f'市净率(pb)[{now_date}]'
        column2 = f'市盈率(pe)[{now_date}]'

        for _, row in safe_iterate_data(df, '市净率'):
            if row['code'] != '':
                # 处理空值，用 'nan' 替代
                pb = row[column1] if pd.notna(row[column1]) else 'nan'
                pe = row[column2] if pd.notna(row[column2]) else 'nan'
                if column1 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'市净率': pb})
                else: 
                    print(f"{row['code']} 市净率 已存在")
                if column2 not in r.hkeys(f"code:{row['code']}"):
                    r.hset(f"code:{row['code']}", mapping={'市盈率': pe})
                else: 
                    print(f"{row['code']} 市盈率 已存在")
        r.close()
    except Exception as e:
        print(f"处理基本面因子 市净率,市盈率 失败: {e}")

def fundamental2factor(factor) -> None:
    """
    获取基本面因子并且写入redis
    factor:str 因子名称
    返回:None
    """
    try:
        r = connect_redis()
        df = pywencai.get(query=factor, sort_key=factor, sort_order='asc', loop=True)
        if df is None:
            print(f"{factor} 为空")
            return
        for _, row in safe_iterate_data(df, factor):
            if row['code'] != '':
                if row['code'] not in r.smembers(f"factor:{factor}"):
                    r.sadd(f"factor:{factor}", row['code'])
                else: 
                    print(f"{row['code']} 已存在")
            else:
                print(f"{row['code']} 为空")
        r.close()
    except Exception as e:
        print(f"处理基本面因子 {factor} 失败: {e}")

def safe_iterate_data(data, factor_name):
    """
    安全地遍历数据，处理不同的数据格式
    """
    if data is None:
        return []
    
    # 如果是字典格式
    if isinstance(data, dict):
        if 'code' in data and data['code'] is not None:
            codes = data['code'] if isinstance(data['code'], list) else [data['code']]
            return [(None, {'code': code}) for code in codes if code and code != '']
        else:
            print(f"{factor_name} 数据格式不正确")
            return []
    
    # 如果是DataFrame格式
    elif hasattr(data, 'iterrows'):
        return data.iterrows()
    
    # 其他格式
    else:
        print(f"{factor_name} 返回数据类型不支持: {type(data)}")
        return []

# 示例使用（取消注释以运行）

# 技术面因子
technical_factors = ['MACD_金叉','MACD_底背离','MACD_拐头向上','MACD_0轴金叉',
'KDJ_金叉','KDJ_底背离','KDJ_拐头向上',
'BOLL_突破上轨','BOLL_突破下轨','BOLL_突破中轨','BOLL_开口向上',
'单k组合_大阳线','单k组合_小阳星','单k组合_向上跳空缺口','单k组合_向下跳空','单k组合_长下影线','单k组合_长上影线',
'均线_多头排列','均线_粘合','股价站上5日线','均线_股价站上60日线']

# 资金面因子
capital_factors = ['陆股通净流入_小于0', '陆股通净流入_0~1000万', '陆股通净流入_1000~5000万', '陆股通净流入_5000~10000万', '陆股通净流入_大于10000万', 
'大单净额_小于0', '大单净额_0~1000万', '大单净额_1000~5000万', '大单净额_大于5000万',
'大单净量_小于0', '大单净量_0~1', '大单净量_1~3', '大单净量_大于3',
]
capital_codes = ['陆股通净流入', '大单净额', '大单净量']

# 基本面因子
fundamental_factors = ['营业收入_小于5亿', '营业收入_5~10亿', '营业收入_10~20亿', '营业收入_20~50亿', '营业收入_大于50亿',
'市盈率_小于10', '市盈率_10~20', '市盈率_20~30', '市盈率_30~40', '市盈率_大于40',
'销售毛利率_小于5', '销售毛利率_5~20', '销售毛利率_20~35', '销售毛利率_35~40', '销售毛利率_大于40',
'ROE_小于5', 'ROE_5~10', 'ROE_10~20', 'ROE_大于20',
'净利润_亏损', '净利润_0~1亿', '净利润_1~3亿', '净利润_3~5亿', '净利润_大于5亿',
'市净率_小于1', '市净率_1~1.5', '市净率_1.5~2', '市净率_2~3', '市净率_大于3',
'资产负债率_小于10', '资产负债率_10~15', '资产负债率_15~30', '资产负债率_大于30',
]
fundamental_codes = ['营业收入', '市盈率', '销售毛利率', 'ROE', '净利润', '市净率', '资产负债率']

zhibiao_factors = ['涨幅大于7.5 市值大于150亿  多头排列', '涨幅大于4 量比大于2 上影线小于1', '跌幅大于4 量比小于0.8  下影线小于2', '最近十日涨停数量大于5']
zhibiaos = ['打板', '追涨', '低吸', '龙头']
def zhibiao2factor():
    """
    获取指标因子并且写入redis
    """
    try:
        r = connect_redis()
        # 遍历指标因子和对应的指标名称
        for factor, zhibiao in zip(zhibiao_factors, zhibiaos):
            df = pywencai.get(query=factor, sort_key=factor, sort_order='asc',loop=True)
            if df is not None:
                for _, row in safe_iterate_data(df, factor):
                    if row['code'] != '':
                        if row['code'] not in r.smembers(f"zhibiao:{zhibiao}"):
                            r.sadd(f"zhibiao:{zhibiao}", row['code'])
                        else:
                            print(f"{row['code']} 已存在")
            else:
                print(f"{factor} 为空")
        r.close()
    except Exception as e:
        print(f"处理指标因子失败: {e}")

def delete_fundamental_redis():
    """
    删除redis中的数据
    """
    r = connect_redis()
    
    # 删除factor下所有因子
    cursor = '0'
    pipe = r.pipeline()
    count = 0
    
    # 删除所有code:开头的键
    while cursor != 0:
        cursor, keys = r.scan(cursor=cursor, match='code:*')
        if keys:
            pipe.delete(*keys)
            count += len(keys)

    # 执行所有删除命令
    pipe.execute()
    print(f"删除 {count} 个键")
    r.close()

def update_fundamental_code():
    """
    获取基本面数据并且写入redis
    """
    delete_fundamental_redis()
    special1_fundamental2code()
    special2_fundamental2code()
    normal_fundamental2code()
    print("基本面代码处理完成")

def main():
    delete_technical_and_capital_redis()
    # 处理基本面代码
    # special1_fundamental2code()
    # special2_fundamental2code()
    # normal_fundamental2code()
    # print("基本面代码处理完成")
    zhibiao2factor()

    # 处理技术面因子
    for factor in technical_factors:
        technical2factor(factor)
    print("技术面因子处理完成")
    
    # # 处理资金面代码
    # for factor in capital_codes:
    #     capital2code(factor)
    # print("资金面代码处理完成")

    # 处理资金面因子
    for factor in capital_factors:
        capital2factor(factor)
    print("资金面因子处理完成")

    # 处理基本面因子
    for factor in fundamental_factors:
        fundamental2factor(factor)
    print("基本面因子处理完成")

def delete_technical_and_capital_redis():
    """
    删除redis中的数据
    """
    r = connect_redis()
    
    # 删除factor下所有因子
    cursor = '0'
    pipe = r.pipeline()
    count = 0
    
    # 删除所有factor:开头的键
    while cursor != 0:
        cursor, keys = r.scan(cursor=cursor, match='factor:*')
        if keys:
            pipe.delete(*keys)
            count += len(keys)
    
    # 删除所有zhibiao:开头的键
    cursor = '0'
    while cursor != 0:
        cursor, keys = r.scan(cursor=cursor, match='zhibiao:*')
        if keys:
            pipe.delete(*keys)
            count += len(keys)
    
    # 执行所有删除命令
    pipe.execute()
    print(f"删除 {count} 个键")
    r.close()

# if __name__ == "__main__":
    # main()
    # df = pywencai.get(query='涨幅大于7.5 市值大于150亿  多头排列', sort_key='涨幅大于7.5 市值大于150亿  多头排列', sort_order='asc')
    # for _, row in safe_iterate_data(df, '涨幅大于7.5 市值大于150亿  多头排列'):
    #     print(row)
    # zhibiao2factor()
    # df = pywencai.get(query='市净率', sort_key='市净率', sort_order='asc')
    # print(df['市净率(pb)[20250915]'])