#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# 打印所有与端口相关的环境变量
print("=== 环境变量检查 ===")
print(f"APP_PORT: {os.getenv('APP_PORT')}")
print(f"PORT: {os.getenv('PORT')}")

# 检查配置文件中的端口设置
print("\n=== 配置文件检查 ===")
try:
    from backend.app.config import Config
    print(f"Config.APP_PORT: {Config.APP_PORT}")
except Exception as e:
    print(f"配置文件加载失败: {e}")

# 检查run_web_server函数中的端口设置
print("\n=== main.py中的端口设置 ===")
with open(os.path.join(project_root, 'main.py'), 'r', encoding='utf-8') as f:
    content = f.read()
    import re
    match = re.search(r'app\.run\(.*?port=(\d+)', content, re.DOTALL)
    if match:
        print(f"main.py中设置的端口: {match.group(1)}")

# 检查run.py中的端口设置
print("\n=== run.py中的端口设置 ===")
run_py_path = os.path.join(project_root, 'backend', 'run.py')
if os.path.exists(run_py_path):
    with open(run_py_path, 'r', encoding='utf-8') as f:
        content = f.read()
        match = re.search(r'app\.run\(.*?port=(\d+)', content, re.DOTALL)
        if match:
            print(f"run.py中设置的端口: {match.group(1)}")

# 检查是否有其他进程占用了5000端口
print("\n=== 端口占用检查 ===")
try:
    import subprocess
    if sys.platform == 'win32':
        # Windows系统检查端口占用
        result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if ':5000' in line and 'LISTENING' in line:
                print(f"端口5000被占用: {line}")
    else:
        # Unix系统检查端口占用
        result = subprocess.run(['lsof', '-i', ':5000'], capture_output=True, text=True)
        if result.stdout:
            print(f"端口5000被占用:\n{result.stdout}")
except Exception as e:
    print(f"端口占用检查失败: {e}")

print("\n=== 测试完成 ===")