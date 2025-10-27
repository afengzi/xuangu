# 后端服务Dockerfile
FROM python:3.10-slim

# 创建非root用户以提高安全性
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# 安装系统依赖，包括编译Python包所需的依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    pkg-config \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 配置pip镜像源以加速依赖安装
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 升级pip到最新版本
RUN pip install --upgrade pip

# 复制requirements.txt并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY backend/ ./backend/
COPY run.py .

# 创建数据目录并设置权限
RUN mkdir -p ./data && chown -R appuser:appgroup /app && chown -R appuser:appgroup ./data

# 切换到非root用户
USER appuser

# 设置环境变量
ENV FLASK_ENV=production
ENV FLASK_DEBUG=False
ENV APP_HOST=0.0.0.0
ENV APP_PORT=8075

EXPOSE 8075

# 启动应用
CMD ["python", "run.py"]