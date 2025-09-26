# 多阶段构建
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

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

# 复制后端代码
COPY backend/ ./backend/
COPY shared/ ./shared/
COPY run.py .

# 复制前端构建文件
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 复制配置文件
COPY env.example .env

EXPOSE 5000

CMD ["python", "run.py"]
