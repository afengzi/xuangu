import sys
import os

# 获取当前文件的目录
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

# 将父目录添加到Python路径
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# 使用延迟导入避免循环导入
def get_main_blueprint():
    from routes import main
    return main

__all__ = ['get_main_blueprint']