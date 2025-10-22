# 测试因子名称格式是否匹配Redis中的格式

# 模拟Redis中的因子键
redis_factors = [
    "ROE_小于5", "ROE_5~10", "ROE_10~15", "ROE_15~20", "ROE_大于20",
    "净利润_亏损", "净利润_0~1亿", "净利润_1~3亿", "净利润_3~5亿", "净利润_大于5亿",
    "营业收入_小于5亿", "营业收入_5~10亿", "营业收入_10~20亿", "营业收入_20~50亿", "营业收入_大于50亿",
    "市盈率_小于10", "市盈率_10~20", "市盈率_20~30", "市盈率_30~40", "市盈率_大于40",
    "销售毛利率_小于5", "销售毛利率_5~15", "销售毛利率_15~25", "销售毛利率_25~35", "销售毛利率_35~40", "销售毛利率_大于40",
    "市净率_小于1", "市净率_1~1.5", "市净率_1.5~2", "市净率_2~3", "市净率_大于3",
    "资产负债率_小于10", "资产负债率_10~15", "资产负债率_15~30", "资产负债率_大于30",
    "MACD_金叉", "MACD_死叉", "MACD_水上金叉", "MACD_水下死叉",
    "KDJ_金叉", "KDJ_死叉", "KDJ_超卖", "KDJ_超买",
    "BOLL_下轨支撑", "BOLL_上轨阻力", "BOLL_突破上轨", "BOLL_跌破下轨",
    "单k组合_早晨之星", "单k组合_黄昏之星", "单k组合_十字星", "单k组合_锤头线",
    "均线_多头排列", "均线_粘合", "均线_股价站上5日线", "均线_股价站上60日线",
    "大单净量_小于0", "大单净量_0~1", "大单净量_1~3", "大单净量_大于3",
    "大单净额_小于0", "大单净额_0~1000万", "大单净额_1000~5000万", "大单净额_大于5000万",
    "陆股通净流入_小于0", "陆股通净流入_0~1000万", "陆股通净流入_1000~5000万", "陆股通净流入_5000~10000万", "陆股通净流入_大于10000万"
]

# 模拟前端构建的因子名称
def build_frontend_factors():
    factors = []
    
    # 基本面因子
    fundamental_factors = [
        ("ROE", ["小于5", "5~10", "10~15", "15~20", "大于20"]),
        ("净利润", ["亏损", "0~1亿", "1~3亿", "3~5亿", "大于5亿"]),
        ("营业收入", ["小于5亿", "5~10亿", "10~20亿", "20~50亿", "大于50亿"]),
        ("市盈率", ["小于10", "10~20", "20~30", "30~40", "大于40"]),
        ("销售毛利率", ["小于5", "5~15", "15~25", "25~35", "35~40", "大于40"]),
        ("市净率", ["小于1", "1~1.5", "1.5~2", "2~3", "大于3"]),
        ("资产负债率", ["小于10", "10~15", "15~30", "大于30"])
    ]
    
    for metric, ranges in fundamental_factors:
        for range_val in ranges:
            factors.append(f"{metric}_{range_val}")
    
    # 技术面因子
    technical_factors = [
        ("MACD", ["金叉", "死叉", "水上金叉", "水下死叉"]),
        ("KDJ", ["金叉", "死叉", "超卖", "超买"]),
        ("BOLL", ["下轨支撑", "上轨阻力", "突破上轨", "跌破下轨"]),
        ("单k组合", ["早晨之星", "黄昏之星", "十字星", "锤头线"]),
        ("均线", ["多头排列", "粘合", "股价站上5日线", "股价站上60日线"])
    ]
    
    for metric, values in technical_factors:
        for value in values:
            factors.append(f"{metric}_{value}")
    
    # 资金面因子
    capital_factors = [
        ("大单净量", ["小于0", "0~1", "1~3", "大于3"]),
        ("大单净额", ["小于0", "0~1000万", "1000~5000万", "大于5000万"]),
        ("陆股通净流入", ["小于0", "0~1000万", "1000~5000万", "5000~10000万", "大于10000万"])
    ]
    
    for metric, values in capital_factors:
        for value in values:
            factors.append(f"{metric}_{value}")
    
    return factors

# 检查匹配情况
frontend_factors = build_frontend_factors()
redis_factor_set = set(redis_factors)
frontend_factor_set = set(frontend_factors)

# 找出匹配的因子
matched_factors = redis_factor_set.intersection(frontend_factor_set)

# 找出不匹配的因子
redis_only = redis_factor_set - frontend_factor_set
frontend_only = frontend_factor_set - redis_factor_set

print(f"Redis中共有 {len(redis_factors)} 个因子")
print(f"前端构建了 {len(frontend_factors)} 个因子")
print(f"匹配的因子数量: {len(matched_factors)}")
print(f"匹配率: {len(matched_factors)/len(redis_factors)*100:.2f}%")

if redis_only:
    print("\nRedis中有但前端未构建的因子:")
    for factor in sorted(redis_only):
        print(f"  - {factor}")

if frontend_only:
    print("\n前端构建但Redis中没有的因子:")
    for factor in sorted(frontend_only):
        print(f"  - {factor}")

if len(matched_factors) == len(redis_factors):
    print("\nSUCCESS: 所有因子名称格式匹配!")
else:
    print("\nFAILED: 部分因子名称格式不匹配")