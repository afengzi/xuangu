#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os

# 添加后端目录到系统路径
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from app import create_app

app = create_app()

if __name__ == '__main__':
    print("启动后端服务...")
    print("服务地址: http://localhost:5000")
    print("API文档: http://localhost:5000/api/docs")
    print("按 Ctrl+C 停止服务")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )