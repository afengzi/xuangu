# 前端服务Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 配置npm镜像源以加速依赖安装
RUN npm config set registry https://registry.npmmirror.com

# 只复制package文件以利用Docker缓存
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 使用nginx作为生产服务器
FROM nginx:alpine

# 复制构建产物到nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]