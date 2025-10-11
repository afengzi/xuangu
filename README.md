# 选股助手系统

## 项目简介

选股助手是一个基于Vue3和Flask的股票筛选分析系统，旨在帮助投资者根据技术面、资金面和基本面指标筛选符合条件的股票。系统提供直观的Web界面，支持多种筛选条件的组合设置，并展示详细的股票分析结果。

## 功能特性

- **多维度筛选**：支持技术面、资金面、基本面三大维度的筛选条件
- **实时数据展示**：展示股票的实时分析数据
- **灵活的筛选配置**：支持多种指标的组合筛选
- **响应式设计**：适配不同设备屏幕尺寸
- **现代化UI**：基于Element Plus组件库构建
- **Docker部署**：支持容器化部署

## 技术栈

### 前端
- Vue 3.5.12
- Element Plus 2.8.4
- Vue Router 4.4.5
- Axios 1.7.4
- Vite 5.4.8

### 后端
- Python 3.10
- Flask 2.3.3
- Redis 7-alpine
- Pandas 1.5.3

## 项目结构

```
.
├── backend/                 # 后端代码
│   ├── app/                 # Flask应用
│   │   ├── __init__.py      # 应用初始化
│   │   ├── config.py        # 配置文件
│   │   ├── routes.py        # API路由
│   │   ├── services/        # 业务逻辑层
│   │   ├── models/          # 数据模型
│   │   ├── utils.py         # 工具函数
│   │   ├── legacy.py        # 兼容性支持
│   │   ├── interface/       # 接口定义
│   │   ├── static/          # 静态文件
│   │   └── templates/       # 模板文件
│   └── data/                # 数据文件
├── frontend/                # 前端代码
│   ├── src/                 # 源代码
│   │   ├── App.vue          # 根组件
│   │   ├── main.js          # 入口文件
│   │   ├── components/      # 组件
│   │   ├── views/           # 页面视图
│   │   ├── api/             # API接口
│   │   ├── router/          # 路由配置
│   │   ├── composables/     # 组合式函数
│   │   ├── utils/           # 工具函数
│   │   └── styles/          # 样式文件
│   ├── package.json         # 前端依赖配置
│   └── vite.config.js       # Vite配置
├── shared/                  # 共享资源
├── Dockerfile               # Docker构建文件
├── docker-compose.yml       # Docker Compose配置
├── requirements.txt         # Python依赖
├── run.py                   # 应用启动文件
└── env.example              # 环境配置示例
```

## Redis数据结构设计

### 元数据存储（Hash）
```
# 键格式：stock:meta:{code}
HSET stock:meta:SH600000 name "平安银行" industry "银行" listing_date "1991-04-03"
```

### 基本面数据（ZSET + Set）
```
# 原始数值存储
ZADD fundamental:revenue 8.5 SH600000  # 营收8.5亿
ZADD fundamental:pe 12.3 SH600000      # 市盈率12.3%

# 范围索引（预计算）
SADD range:revenue:2 SH600000  # 营收5~10亿区间
SADD range:pe:1 SH600000       # 市盈率<10%
```

### 技术面数据（Bitmap）
```
# 当前状态（Bitmap）
SETBIT technical:macd:SH600000 0 1  # 位0=金叉状态
SETBIT technical:macd:SH600000 1 0  # 位1=底背离状态
```

### 资金面数据（ZSET + Set）
```
# 原始数值存储
ZADD capital:big_order_amt 3500 SH600000  # 大单金额3500万

# 范围索引
SADD capital:big_order_amt:3 SH600000  # 1000~5000万区间
```

### 热门概念（Set）
```
SADD concept:人工智能 SH600000 SH600001
SADD concept:5G通信 SH600000
```

## 快速开始

### 环境要求
- Node.js >= 18
- Python >= 3.10
- Docker (可选，用于容器化部署)
- Redis

### 开发环境搭建

1. 克隆项目代码
```bash
git clone <项目地址>
cd xuangu_demo
```

2. 配置环境变量
```bash
cp env.example .env
# 根据需要修改.env文件中的配置
```

3. 启动后端服务
```bash
# 安装Python依赖
pip install -r requirements.txt

# 启动后端服务
python run.py
```

4. 启动前端服务
```bash
# 进入前端目录
cd frontend

# 安装前端依赖
npm install

# 启动前端开发服务器
npm run dev
```

### Docker部署

使用Docker Compose一键部署：

```bash
docker-compose up -d
```

该命令会启动以下服务：
- Redis数据库服务（端口6379）
- 主应用服务（端口5000）

## 使用说明

### 基本使用流程

1. **用户登录**
   - 访问系统登录页面
   - 输入用户名和密码进行登录

2. **选择筛选条件**
   - 在筛选面板中选择技术面、资金面、基本面等筛选条件
   - 可设置多个条件进行组合筛选

3. **管理筛选条件**
   - 可添加、删除、修改筛选条件
   - 支持条件的保存和复用

4. **查看筛选结果**
   - 系统根据筛选条件实时展示符合条件的股票列表
   - 结果以表格形式展示，包含股票代码、名称、各项指标值

5. **查看股票详情**
   - 点击股票代码可查看该股票的详细信息
   - 展示更详细的指标分析和数据图表

6. **退出登录**
   - 点击页面右上角的退出按钮完成退出操作

### 界面功能

#### 筛选面板
- 提供技术面、资金面、基本面三大类筛选条件
- 支持条件的动态添加和删除
- 实时显示筛选结果数量

#### 结果展示
- 以表格形式展示筛选结果
- 包含股票代码、名称、各项指标值
- 支持表格的排序和分页

## API接口

### 主要接口

- `POST /api/stock/filter/search` - 股票筛选接口
- `GET /api/stock/detail/{code}` - 股票详情接口
- `GET /api/stock/concepts` - 概念列表接口

### Mock数据

系统内置了Mock数据，便于前端开发和测试。

## 开发规范

### 代码规范
- 遵循PEP8 Python代码规范
- Vue组件使用Composition API
- 使用ESLint和Prettier进行代码格式化

### 文件命名
- 组件文件使用PascalCase命名法
- 其他文件使用camelCase或kebab-case命名法

### 样式规范
- 使用CSS Modules避免样式冲突
- 遵循BEM命名规范

## 项目特色

- **高性能**：基于Redis的高效数据存储和查询
- **易扩展**：模块化设计，便于功能扩展
- **易维护**：清晰的代码结构和详细的注释
- **用户友好**：直观的操作界面和实时反馈

## 更新日志

### v1.5.0 (2025-01-15)
- 🎨 **界面布局优化**
  - 移除AppHeader组件的固定定位，使其随页面滚动
  - 优化页面滚动体验，避免头部元素遮挡内容

### v1.4.0 (2025-01-14)
- 🔗 **新增股票代码链接功能**
  - 筛选结果表格中的股票代码现在显示为可点击链接
  - 点击股票代码可跳转到对应的外部股票详情页面
  - 链接格式：`http://localhost:3000/stock-filter/code_{股票代码}`
  - 支持常规筛选模式和主题模式下的股票代码链接
  - 添加悬停效果和视觉反馈，提升用户体验
  - 响应式设计，移动端自适应显示

### v1.3.0 (2025-01-13)
- 🚀 **性能优化**
  - 优化了大数据量下的渲染性能
  - 实现了虚拟滚动，提升表格渲染效率
  - 添加了内存监控和优化机制

### v1.2.0 (2025-01-12)
- 🎨 **UI改进**
  - 重新设计了筛选面板，提升用户体验
  - 优化了表格展示效果，增加列宽自适应功能
  - 添加了主题切换功能

### v1.1.0 (2025-01-11)
- ✨ **新功能**
  - 添加了股票详情对话框
  - 实现了筛选条件的记忆功能
  - 增加了数据范围选择器组件

### v1.0.0 (2025-01-10)
- 🎉 **初始版本发布**
  - 实现了基本的股票筛选功能
  - 支持技术面、资金面、基本面筛选
  - 提供了完整的前后端实现