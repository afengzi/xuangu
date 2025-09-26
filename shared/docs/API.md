# API 接口文档

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **认证方式**: JWT Token
- **数据格式**: JSON

## 认证接口

### 登录
```http
POST /api/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

## 股票筛选接口

### 因子筛选
```http
POST /api/stock/filter/factors
Content-Type: application/json

{
  "factors": {
    "基本面": {
      "PE": [10, 20],
      "PB": [1, 3]
    },
    "技术面": {
      "MACD_金叉": true,
      "RSI": [30, 70]
    },
    "资金面": {
      "主力净流入": [1000000, 5000000]
    }
  }
}
```

**响应**:
```json
{
  "data": {
    "000001": {
      "code": "000001",
      "name": "平安银行",
      "price": 12.34,
      "change": 0.12,
      "changePercent": 0.98
    }
  },
  "count": 1
}
```

### 题材筛选
```http
POST /api/stock/filter/themes
Content-Type: application/json

{
  "themes": ["人工智能", "新能源"]
}
```

### 指标筛选
```http
POST /api/stock/filter/zhibiao
Content-Type: application/json

{
  "zhibiao": "打板"
}
```

### 组合筛选
```http
POST /api/stock/filter/themes-factors-zhibiao
Content-Type: application/json

{
  "themes": ["人工智能"],
  "factors": {
    "基本面": {
      "PE": [10, 20]
    }
  },
  "zhibiao": "打板"
}
```

## 题材接口

### 获取题材列表
```http
GET /api/theme/list
```

**响应**:
```json
{
  "themes": [
    {
      "name": "人工智能",
      "count": 150,
      "description": "人工智能相关概念股"
    }
  ]
}
```

### 获取题材详情
```http
GET /api/theme/detail?theme=人工智能
```

## 股票详情接口

### 获取股票详情
```http
GET /api/stock/detail?code=000001
```

**响应**:
```json
{
  "code": "000001",
  "name": "平安银行",
  "price": 12.34,
  "change": 0.12,
  "changePercent": 0.98,
  "volume": 1000000,
  "turnover": 12340000,
  "marketCap": 1234567890,
  "pe": 8.5,
  "pb": 1.2
}
```

## 错误响应

所有接口在出错时返回统一格式：

```json
{
  "error": "错误信息",
  "code": 400
}
```

## 状态码

- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `404`: 资源不存在
- `500`: 服务器内部错误
