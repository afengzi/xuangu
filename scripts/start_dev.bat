@echo off
echo 启动开发环境...

echo 启动后端服务...
start "Backend Server" cmd /k "cd /d %~dp0.. && python run.py"

echo 等待后端启动...
timeout /t 3 /nobreak > nul

echo 启动前端服务...
start "Frontend Server" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo 开发环境启动完成！
echo 后端: http://localhost:5000
echo 前端: http://localhost:3000
pause
