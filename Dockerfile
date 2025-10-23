# 多阶段构建 - Ubuntu 24优化版
# 第一阶段：构建前端静态资源
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 只复制package文件以利用Docker缓存
COPY frontend/package*.json ./frontend/
# 进入前端目录并安装依赖
WORKDIR /app/frontend
RUN npm ci --only=production

# 复制前端源代码
COPY frontend/ ./

# 构建生产版本
RUN npm run build

# 第二阶段：构建后端应用
FROM python:3.10-slim

# 创建非root用户以提高安全性
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# 安装系统依赖，包括curl用于健康检查
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY backend/ ./backend/
# 移除shared目录复制，已在前端构建中包含
COPY run.py .
COPY env.example .env

# 复制前端构建文件
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 创建数据目录并设置权限
RUN mkdir -p ./data && chown -R appuser:appgroup /app && chown -R appuser:appgroup ./data

# 切换到非root用户
USER appuser

# 设置环境变量
ENV FLASK_ENV=production
ENV FLASK_DEBUG=False
ENV APP_HOST=0.0.0.0
ENV APP_PORT=5000

EXPOSE 5000

# 启动应用
CMD ["python", "run.py"]
