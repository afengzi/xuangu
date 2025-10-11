import schedule
import time
from datetime import datetime

from ..services.data_service import main as update_factors
from ...data.sources.kaipanla.theme_to_redis import theme_to_redis

def update_all_data():
    """
    每日更新所有数据：题材、技术面、资金面、基本面因子及指标
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始每日数据更新...")
    
    try:
        # 1. 更新题材数据
        print("正在更新题材数据...")
        theme_to_redis()
        print("题材数据更新完成")
        
        # 2. 更新因子和指标数据
        print("正在更新因子和指标数据...")
        update_factors()
        print("因子和指标数据更新完成")
        
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 每日数据更新完成")
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 数据更新失败: {e}")

def main():
    # 设置每天8:30执行更新任务
    schedule.every().day.at("08:30").do(update_all_data)
    
    print("每日数据更新定时器已启动...")
    print("下次执行时间:", schedule.next_run())
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)  # 每分钟检查一次
    except KeyboardInterrupt:
        print("定时器已停止")
    except Exception as e:
        print(f"定时器运行失败: {e}")

if __name__ == "__main__":
    main()