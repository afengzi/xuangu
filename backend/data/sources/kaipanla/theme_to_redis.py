from token_manager import get_valid_token
import tushare as ts
from datetime import datetime, timedelta
import schedule
import time
# 把项目根目录加入 sys.path，便于复用 Redis 连接
import sys
import os
# 获取backend目录路径（包含app模块的目录）
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_ROOT not in sys.path:
    sys.path.append(BACKEND_ROOT)

from app.services.data_service import connect_redis

def init_tushare():
    """
    初始化 tushare
    """
    token = get_valid_token()
    ts.set_token(token)
    pro = ts.pro_api()
    return pro

def get_concept_cons(pro, trade_date: str | None = None):
    """
    获取题材成分股数据
    trade_date: 交易日期，格式 YYYYMMDD；默认取昨天
    返回：DataFrame
    """
    # 获取昨天的日期
    date = trade_date or (datetime.now() - timedelta(days=1)).strftime('%Y%m%d')
    df = pro.kpl_concept_cons(trade_date=date)
    return df

def _first_six(code: str) -> str:
    """提取股票代码前六位（忽略后缀，如 .SZ/.SH/.KP）。"""
    if not code:
        return ''
    # 可能是 300651.SZ 或 000233.KP
    head = code.split('.')[0]
    return head[:6]

def theme_to_redis(trade_date: str | None = None):
    """
    将题材数据写入 Redis：
    - 集合：theme:{题材名} -> 成分股 6 位代码集合
    - 哈希：theme:detail:{题材名}:{代码} -> { code, name, theme, desc, trade_date, ts_code, con_code }
    """
    pro = init_tushare()
    df = get_concept_cons(pro, trade_date)
    if df is None or df.empty:
        return None

    # 删除redis中的数据
    delete_redis()

    r = connect_redis()

    try:
        for _, row in df.iterrows():
            # tushare 字段示例： name(题材名), con_code, con_name(股票名), desc, trade_date, hot_num
            con_code = (row.get('con_code') or '')
            stock_name = (row.get('con_name') or '')
            theme_name = (row.get('name') or '')
            description = (row.get('desc') or '')
            date = (row.get('trade_date') or '')
            hot_num = (row.get('hot_num') or None)

            code6 = _first_six(con_code)
            if not code6 or not theme_name:
                continue

            # 1) 题材 -> 成分股集合
            r.sadd(f"theme:{theme_name}", code6)

            # 2) 题材+个股 -> 详情哈希
            r.hset(
                f"theme:detail:{theme_name}:{code6}",
                mapping={
                    'code': code6,
                    'name': stock_name,
                    'theme': theme_name,
                    'desc': description,
                    'trade_date': str(date),
                    'con_code': con_code,
                    'hot_num': str(hot_num),
                },
            )
        print(f"写入 {len(df)} 个键")
        return df
    finally:
        r.close()

def delete_redis():
    """
    删除redis中的数据
    """
    r = connect_redis()

    prefix = 'theme:'

    # 使用管道批量删除
    cursor = '0'
    pipe = r.pipeline()
    count = 0

    while cursor != 0:
        cursor, keys = r.scan(cursor=cursor, match=f'{prefix}*')
        if keys:
            pipe.delete(*keys)
            count += len(keys)

    # 执行所有删除命令
    pipe.execute()
    print(f"删除 {count} 个键")
    r.close()

if __name__ == '__main__':
    # 执行写入（默认取昨天）
    # schedule.every().day.at("08:29").do(delete_redis)
    schedule.every().day.at("08:30").do(theme_to_redis)
    print("定时器开始启动...")
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except Exception as e:
        print(f"定时器运行失败: {e}")
    print("定时器结束")
    # delete_redis()
    # theme_to_redis()
    # df = pro.query('daily', ts_code='000001.SZ', start_date='20180701', end_date='20180718')
    # df = pro.daily(trade_date='20250909')
    # print(df)

