import tushare as ts
from token_manager import get_valid_token

token = get_valid_token()
ts.set_token(token)
pro = ts.pro_api()

def add_stock_prefix(stock_code):
    """
    为股票代码添加适当的前缀
    规则：
    - 00和30开头的股票代码添加'sz'（深圳）
    - 60和68开头的股票代码添加'sh'（上海）
    - 8和9开头的股票代码添加'bj'（北京）
    - 已包含前缀的代码直接返回

    :param stock_code: 股票代码字符串
    :return: 带前缀的股票代码
    """
    # 如果已经包含前缀，直接返回
    if stock_code.startswith(('sz', 'sh', 'bj')):
        return stock_code

    # 获取纯数字部分
    pure_code = stock_code

    # 根据开头数字添加前缀
    if pure_code.startswith(('00', '30')):  # 深圳股票
        return 'sz' + pure_code
    elif pure_code.startswith(('60', '68')):  # 上海股票
        return 'sh' + pure_code
    elif pure_code.startswith(('8', '9')):  # 北京股票
        return 'bj' + pure_code
    else:
        # 对于不符合规则的代码，原样返回
        return stock_code

for date in range(20250901, 20250916):
    df = pro.daily(trade_date=str(date))
    df = df[['ts_code','trade_date','amount']].sort_values(by='amount', ascending=False).head(100)
    df['amount'] = df['amount']*1000
    # df['ts_code'] = df['ts_code'].apply(add_stock_prefix)
    df.to_csv(f'成交额前一百{date}.csv', index=False)
    # print(df)