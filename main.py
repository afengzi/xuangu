#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目主入口文件
用于解决模块导入问题，确保所有模块都能正确导入
"""

import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(project_root, 'backend')

# 确保项目根目录和backend目录在Python路径中
if project_root not in sys.path:
    sys.path.insert(0, project_root)

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def run_daily_update():
    """运行每日数据更新任务"""
    try:
        from backend.app.models.daily_updater import update_all_data
        print("开始执行每日数据更新任务...")
        update_all_data()
        print("每日数据更新任务执行完成")
    except Exception as e:
        print(f"执行每日数据更新任务失败: {e}")
        import traceback
        traceback.print_exc()

def run_theme_update():
    """运行题材数据更新任务"""
    try:
        from backend.data.sources.kaipanla.theme_to_redis import theme_to_redis
        print("开始执行题材数据更新任务...")
        theme_to_redis()
        print("题材数据更新任务执行完成")
    except Exception as e:
        print(f"执行题材数据更新任务失败: {e}")
        import traceback
        traceback.print_exc()

def run_web_server():
    """运行Web服务器"""
    try:
        from backend.app import create_app
        app = create_app()
        print("启动Web服务器...")
        app.run(debug=True, host='0.0.0.0', port=5001)
    except Exception as e:
        print(f"启动Web服务器失败: {e}")
        import traceback
        traceback.print_exc()

def run_daily_scheduler():
    """启动每日定时更新服务"""
    try:
        from backend.app.models.daily_updater import main as daily_main
        print("启动每日定时更新服务...")
        daily_main()
    except Exception as e:
        print(f"启动每日定时更新服务失败: {e}")
        import traceback
        traceback.print_exc()

def show_help():
    """显示帮助信息"""
    print("""
使用说明:
    python main.py [command]

可用命令:
    daily      - 运行每日数据更新任务
    theme      - 运行题材数据更新任务
    server     - 启动Web服务器
    scheduler  - 启动每日定时更新服务
    help       - 显示此帮助信息

示例:
    python main.py daily     # 运行每日数据更新
    python main.py theme     # 运行题材数据更新
    python main.py server    # 启动Web服务器
    python main.py scheduler # 启动每日定时更新服务
    python main.py help      # 显示帮助信息
    """)

if __name__ == "__main__":
    # 获取命令行参数
    if len(sys.argv) < 2:
        show_help()
        sys.exit(0)
    
    command = sys.argv[1].lower()
    
    if command == "daily":
        run_daily_update()
    elif command == "theme":
        run_theme_update()
    elif command == "server":
        run_web_server()
    elif command == "scheduler":
        run_daily_scheduler()
    elif command == "help":
        show_help()
    else:
        print(f"未知命令: {command}")
        show_help()