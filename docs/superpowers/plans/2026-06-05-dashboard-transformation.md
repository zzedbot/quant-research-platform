# Dashboard 改造为量化研究平台 — 执行计划

日期：2026-06-05

## 目标
将当前 FIA Quant Dashboard（实时行情监控台）改造为符合设计文档的量化研究平台第一版。

## 当前状态
- 前端：React CDN + Babel 单HTML文件
- 后端：FastAPI + Uvicorn (0.0.0.0:7030)
- 数据：新浪+腾讯API实时拉取，无持久化
- 功能：指数/个股行情、K线图、技术指标、信号检测、信号级回测、智能对话

## 设计文档核心要求
- Python 研究内核 + Web UI 混合架构
- 数据分层：Raw/Clean/Feature (Parquet)
- Experiment 实验体系
- 组合级回测
- 数据中心、股票池、因子库、实验管理、报表中心
- 数据质量检查
- Notebook API

## 改造范围（MVP 1+2+3）
第一版聚焦：数据闭环 → 研究闭环 → 组合级回测基础

## 执行步骤

### Phase 1: 项目骨架重构
1.1 建立 `quant-research-platform/` 目录结构
1.2 初始化 `quant_core` Python 包
1.3 数据适配器统一接口（MarketDataAdapter）
1.4 AkShare 适配器实现

### Phase 2: 数据存储层
2.1 Parquet 存储引擎
2.2 SQLite 元数据库
2.3 数据分层：Raw/Clean/Feature
2.4 数据更新流程
2.5 数据质量检查基础版

### Phase 3: 数据中心 Web UI
3.1 数据中心页面（数据状态/更新/质量）
3.2 数据更新 API
3.3 手动触发数据更新

### Phase 4: 股票池 & 因子 & 技术指标
4.1 股票池模型（Universe）
4.2 股票池管理页面
4.3 技术指标计算框架
4.4 内置技术指标（MA/EMA/MACD/RSI/BOLL/ATR）
4.5 技术指标信号生成

### Phase 5: Experiment 体系
5.1 Experiment 数据模型
5.2 实验创建/配置 API
5.3 Web UI 实验管理页
5.4 Notebook API 示例

### Phase 6: 组合级回测
6.1 组合级回测引擎
6.2 交易成本模型
6.3 回测结果对象统一结构
6.4 回测任务 API
6.5 Web UI 回测任务页

### Phase 7: 报表工作台
7.1 单回测报告页
7.2 多实验对比
7.3 核心图表（净值/回撤/持仓/交易）
7.4 导出功能（HTML/CSV）

### Phase 8: 现有功能迁移
8.1 智能对话 → 保留
8.2 实时行情侧边栏 → 保留
8.3 选股筛选器 → 改造为股票池规则引擎

## 技术约束
- 保留 FastAPI 后端
- 前端保持 React（引入 TypeScript）
- Parquet + DuckDB + SQLite 存储
- 数据源：AkShare 为主
- A 股 + 港股覆盖

## 验收标准
- 能拉取并存储 A 股/港股日频数据
- 能创建股票池
- 能计算技术指标并生成信号
- 能创建 Experiment 并运行回测
- 能查看回测报告和对比实验
