# 部署指南

## 环境要求

### 开发环境
- Node.js 18+
- Python 3.11+
- Redis 6+
- npm/yarn

### 生产环境
- Docker & Docker Compose
- 或直接部署到服务器

## 开发环境部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd xuangu_demo
```

### 2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，配置Redis等信息
```

### 3. 安装依赖
```bash
# 安装后端依赖
pip install -r requirements.txt

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 4. 启动服务
```bash
# 使用脚本启动（推荐）
scripts/start_dev.bat

# 或手动启动
# 启动后端
python run.py

# 启动前端（新终端）
cd frontend
npm run dev
```

### 5. 访问应用
- 现代前端: http://localhost:3000
- IE11兼容: http://localhost:5000/legacy
- 后端API: http://localhost:5000/api

## 生产环境部署

### 方式一：Docker部署（推荐）

1. **构建镜像**
```bash
docker build -t xuangu-demo .
```

2. **启动服务**
```bash
docker-compose up -d
```

3. **访问应用**
- 应用: http://localhost:5000
- Redis: localhost:6379

### 方式二：直接部署

1. **构建前端**
```bash
cd frontend
npm install
npm run build
cd ..
```

2. **配置生产环境**
```bash
# 复制并配置环境变量
cp env.example .env
# 修改 .env 中的 FLASK_ENV=production
```

3. **启动后端**
```bash
python run.py
```

## 配置说明

### 环境变量
```bash
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# JWT配置
JWT_SECRET_KEY=your-secret-key-here

# Flask配置
FLASK_ENV=production
FLASK_DEBUG=False
```

### Nginx配置（可选）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # IE11兼容页面
    location /legacy {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 监控和维护

### 日志查看
```bash
# Docker部署
docker-compose logs -f app

# 直接部署
tail -f app.log
```

### 数据备份
```bash
# Redis数据备份
redis-cli --rdb backup.rdb
```

### 性能监控
- 使用 `backend/app/utils.py` 中的性能监控工具
- 监控Redis连接状态
- 监控API响应时间

## 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务是否启动
   - 验证连接配置

2. **前端构建失败**
   - 检查Node.js版本
   - 清除node_modules重新安装

3. **API请求失败**
   - 检查CORS配置
   - 验证JWT Token

### 调试模式
```bash
# 启用调试模式
export FLASK_DEBUG=True
python run.py
```

## 更新部署

1. **拉取最新代码**
```bash
git pull origin main
```

2. **重新构建**
```bash
# Docker方式
docker-compose down
docker-compose up -d --build

# 直接部署方式
scripts/build_prod.bat
```
