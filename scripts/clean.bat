@echo off
echo 清理项目文件...

echo 清理前端构建文件...
if exist frontend\dist rmdir /s /q frontend\dist
if exist frontend\node_modules rmdir /s /q frontend\node_modules

echo 清理Python缓存...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /r . %%f in (*.pyc) do @if exist "%%f" del /q "%%f"

echo 清理完成！
pause
