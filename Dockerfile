# 多阶段构建 - 优化版
# 第一阶段：构建前端静态资源
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
# 只复制package文件以利用Docker缓存
COPY frontend/package*.json ./
# 使用npm ci进行更快、更可靠的安装
RUN npm ci --only=production
# 复制前端源代码
COPY frontend/ ./
# 构建生产版本
RUN npm run build

# 第二阶段：构建后端应用
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY backend/ ./backend/
COPY shared/ ./shared/
COPY run.py .

# 复制前端构建文件
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 复制配置文件
COPY env.example .env

EXPOSE 5000

# 启动应用
CMD ["python", "run.py"]
