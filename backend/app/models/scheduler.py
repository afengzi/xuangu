import schedule  
import time  
from app.services.data_service import main

schedule.every().day.at("08:30").do(main)  # 每天早上8点30分执行一次main函数
if __name__ == "__main__":
    print("定时器开始启动...") 
    try:
        while True:
            schedule.run_pending()  # 运行待执行的任务队列  
            time.sleep(1)  # 暂停1秒钟，等待下一个任务执行
    except Exception as e:
        print(f"定时器运行失败: {e}")
    print("定时器结束")