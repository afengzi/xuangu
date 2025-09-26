# 项目架构文档

## 整体架构

本项目采用前后端分离的架构设计，支持现代浏览器和IE11兼容性。

```
xuangu_demo/
├── frontend/          # 现代前端 (Vue 3 + Vite)
├── backend/           # 后端服务 (Flask)
├── shared/            # 共享配置和文档
├── scripts/           # 自动化脚本
└── legacy/            # IE11兼容页面
```

## 技术栈

### 前端
- **现代前端**: Vue 3 + Element Plus + Vite
- **IE11兼容**: Vue 2 + Element UI + 原生JS
- **构建工具**: Vite (现代) / 原生 (IE11)

### 后端
- **框架**: Flask
- **数据库**: Redis
- **数据源**: 开盘啦API、问财API

## 目录结构详解

### frontend/ - 现代前端
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/        # 通用组件
│   │   └── business/      # 业务组件
│   ├── views/             # 页面视图
│   ├── api/               # API接口
│   │   └── modules/       # 模块化API
│   ├── utils/             # 工具函数
│   │   ├── helpers/       # 辅助函数
│   │   └── formatters/    # 格式化函数
│   └── composables/       # Vue 3 组合式函数
├── public/                # 静态资源
└── vite.config.js         # Vite配置
```

### backend/ - 后端服务
```
backend/
├── app/
│   ├── services/          # 服务层
│   ├── models/            # 模型层
│   ├── routes.py          # 路由定义
│   ├── config.py          # 配置管理
│   └── utils.py           # 工具函数
├── data/
│   └── sources/           # 数据源
│       └── kaipanla/      # 开盘啦数据源
└── static/                # 静态文件
    └── legacy/            # IE11兼容资源
```

### shared/ - 共享资源
```
shared/
├── config/                # 共享配置
│   ├── factorConfig.js    # 因子配置
│   └── factorMapping.js   # 因子映射
└── docs/                  # 项目文档
```

## 数据流

1. **用户操作** → 前端组件
2. **API调用** → 后端路由
3. **业务逻辑** → 服务层
4. **数据获取** → 数据源/Redis
5. **响应返回** → 前端展示

## 配置管理

- 环境变量: `.env` 文件
- 因子配置: `shared/config/factorConfig.js`
- 映射关系: `shared/config/factorMapping.js`
- Vite配置: `frontend/vite.config.js`

## 部署方案

### 开发环境
```bash
# 启动开发环境
scripts/start_dev.bat
```

### 生产环境
```bash
# 构建生产版本
scripts/build_prod.bat

# Docker部署
docker-compose up -d
```

## 兼容性策略

1. **现代浏览器**: 使用Vue 3 + ES6模块
2. **IE11**: 使用Vue 2 + 全局变量
3. **共享配置**: 同时支持ES6导出和全局变量
4. **API接口**: 统一的后端接口，前端适配层
