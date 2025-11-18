import tushare as ts

ts.set_token("43748a5da1339b43a4956da729ae791f4e25ce9a15a356060658ffe6")
pro = ts.pro_api()
df = pro.kpl_concept_cons(trade_date="20251111")
print(df)