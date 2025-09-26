@echo off
echo 构建生产环境...

echo 安装后端依赖...
pip install -r requirements.txt

echo 构建前端...
cd frontend
npm install
npm run build
cd ..

echo 生产环境构建完成！
echo 前端构建文件位于: frontend/dist/
pause
