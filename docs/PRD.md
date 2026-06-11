# API Helper — 产品需求文档（PRD）

> 版本：v1.1  
> 日期：2026-06-11  
> 定位：Windows 单机桌面 API 调试工具（对标 Postman / Apipost 核心能力，界面更简洁）  
> 平台：**仅 Windows 桌面应用**，本地单机运行，无需联网账号

---

## 1. 项目概述

### 1.1 背景

开发者在联调 HTTP / WebSocket 接口时，常依赖 Postman、Apipost 等工具。这些工具功能全面，但界面复杂、学习成本高。本项目旨在提供一款**界面简洁、上手即用**的 API 调试工具，覆盖日常开发中最常用的 **GET、POST、WebSocket** 三类请求。

### 1.2 产品愿景

> 打开即用，三秒发请求，一眼看结果。

### 1.3 产品边界

| 范围内 | 范围外（v1 不做） |
|--------|-------------------|
| GET / POST HTTP 请求 | PUT / PATCH / DELETE 等（可后续扩展） |
| WebSocket 连接与消息收发 | GraphQL、gRPC、SSE |
| 请求历史与简单收藏 | 团队协作、云端同步 |
| 环境变量（基础） | Mock 服务、自动化测试套件 |
| **预执行脚本**（生成动态参数） | 复杂 OAuth2 授权流程 |
| JSON / Form / Raw Body | Web 版、云端同步、团队协作 |

---

## 2. 目标用户

| 用户类型 | 典型场景 | 核心诉求 |
|----------|----------|----------|
| 前端开发 | 联调后端 REST 接口 | 快速改参数、看响应 |
| 后端开发 | 自测接口、排查问题 | 自定义 Header、Body |
| 全栈 / 独立开发者 | 本地服务调试 | 轻量、无需账号登录 |
| 测试人员 | 冒烟验证 | 可复用历史请求 |

---

## 3. 设计原则

1. **简洁优先**：主界面一屏完成「填 URL → 发请求 → 看结果」，无多余面板。
2. **渐进披露**：高级选项（Header、Cookie、超时）默认折叠，需要时再展开。
3. **即时反馈**：请求进行中、成功、失败状态清晰可见。
4. **本地优先**：数据默认存本地，无需注册即可使用。
5. **键盘友好**：`Ctrl+Enter` 发送请求等快捷操作。

---

## 4. 功能需求

### 4.1 通用能力

#### 4.1.1 请求编辑区

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| F-001 | URL 输入框 | P0 | 支持完整 URL；支持 `{{变量名}}` 占位符 |
| F-002 | 协议类型切换 | P0 | Tab 或下拉：`HTTP` / `WebSocket` |
| F-003 | 发送按钮 | P0 | 主操作按钮，HTTP 显示「发送」，WS 显示「连接」/「断开」 |
| F-004 | 请求取消 | P1 | HTTP 请求进行中可取消 |
| F-005 | 复制为 cURL | P2 | 一键复制当前请求为 cURL 命令 |

#### 4.1.2 环境变量

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| F-010 | 环境管理 | P1 | 支持「开发 / 测试 / 生产」等多套变量 |
| F-011 | 变量替换 | P1 | URL、Header、Body 中 `{{baseUrl}}` 自动替换 |
| F-012 | 变量编辑 | P1 | 键值对表格编辑，支持导入/导出 JSON |

#### 4.1.3 请求历史

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| F-020 | 自动记录 | P0 | 每次成功/失败请求写入历史（最近 100 条） |
| F-021 | 历史列表 | P0 | 侧边栏或下拉展示：方法、URL、时间、状态码 |
| F-022 | 一键复用 | P0 | 点击历史项恢复完整请求配置 |
| F-023 | 收藏 | P1 | 历史项可「收藏」，单独分组展示 |
| F-024 | 清空历史 | P2 | 支持清空全部或单条删除 |

#### 4.1.4 预执行脚本（Pre-request Script）

> 在每次「发送 / 连接」前运行 JavaScript，动态生成变量，供 URL、Headers、Body、Query 通过 `{{变量名}}` 引用。

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| S-001 | 脚本编辑器 | P0 | 每请求独立脚本；语法高亮；启用/禁用开关 |
| S-002 | 变量输出 | P0 | `vars.set(key, value)` 写入请求级变量 |
| S-003 | Header 引用 | P0 | Headers 值支持 `{{token}}`、`{{sign}}` 等占位符 |
| S-004 | 全字段引用 | P0 | 变量可作用于 URL、Query、Headers、Body |
| S-005 | 环境变量读取 | P0 | `env.get(key)` 读取当前环境变量（如 secret） |
| S-006 | 内置 crypto | P0 | `crypto.md5()` / `crypto.sha256()` 等常用摘要 |
| S-007 | 脚本日志 | P0 | `console.log` 输出到响应区「脚本日志」Tab |
| S-008 | 独立试运行 | P0 | 「运行脚本」按钮：只执行脚本，不发请求 |
| S-009 | 失败策略 | P0 | 脚本报错默认**阻止**后续请求；可在设置中改为仍继续 |
| S-010 | 脚本超时 | P1 | 默认 5s，可配置 |
| S-011 | 脚本模板 | P1 | 内置模板：时间戳、MD5 签名、Bearer Token |
| S-012 | 变量预览 | P0 | 独立 Tab 展示环境 + 脚本变量及引用位置 |
| S-013 | async/await | P1 | 脚本内支持异步（如 await 获取 Token） |

**执行顺序：**

```
用户点击发送
  → 1. 执行预执行脚本（若启用）
  → 2. 合并环境变量 + 脚本变量
  → 3. 替换 URL / Params / Headers / Body 中的 {{var}}
  → 4. 发出 HTTP 请求或建立 WebSocket 连接
```

**脚本 API 概要：**

```javascript
vars.set('timestamp', Date.now().toString());  // 设置变量
vars.get('timestamp');                         // 读取变量
env.get('apiSecret');                          // 读环境变量
crypto.md5('content');                         // MD5  hex
crypto.sha256('content');                      // SHA256 hex
console.log('debug info');                     // 脚本日志
```

---

### 4.2 HTTP — GET 请求

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| H-001 | 方法固定 GET | P0 | 选择 HTTP + GET |
| H-002 | Query 参数 | P0 | 键值对表格，支持启用/禁用单行 |
| H-003 | Query 与 URL 同步 | P1 | 编辑表格自动更新 URL；URL 粘贴后自动解析 Query |
| H-004 | Headers | P0 | 键值对表格；支持 `{{变量}}`；常用 Header 快捷添加 |
| H-005 | 响应展示 | P0 | 状态码、耗时、响应大小、响应 Headers、响应 Body |
| H-006 | Body 格式化 | P0 | JSON 自动高亮与折叠；非 JSON 纯文本展示 |
| H-007 | 响应预览 | P1 | JSON 树形视图 / Raw 文本切换 |

**GET 交互流程：**

```
输入 URL →（可选）预执行脚本 → Query / Headers → 点击发送 → 展示响应
```

---

### 4.3 HTTP — POST 请求

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| P-001 | 方法固定 POST | P0 | 选择 HTTP + POST |
| P-002 | Query 参数 | P0 | 同 GET |
| P-003 | Headers | P0 | 同 GET |
| P-004 | Body 类型 | P0 | 支持：`none` / `JSON` / `Form Data` / `Raw` |
| P-005 | JSON Body | P0 | 编辑器 + JSON 语法校验；非法 JSON 发送前提示 |
| P-006 | Form Data | P1 | 键值对，支持 Text / File（File 为 P2） |
| P-007 | Raw Body | P1 | 纯文本，可选手动指定 Content-Type |
| P-008 | 响应展示 | P0 | 同 GET |

**Body 类型默认规则：**

- 选择 JSON 时，自动添加 `Content-Type: application/json`（用户可覆盖）
- 选择 Form 时，自动使用 `multipart/form-data` 或 `application/x-www-form-urlencoded`（用户可选）

---

### 4.4 WebSocket

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| W-001 | WS URL | P0 | 支持 `ws://` 与 `wss://` |
| W-002 | 连接 / 断开 | P0 | 明确连接状态：未连接 / 连接中 / 已连接 / 已断开 / 错误 |
| W-003 | 发送消息 | P0 | 输入框 + 发送；支持 Text（P0）与 JSON（P1，格式化发送） |
| W-004 | 消息记录 | P0 | 时间线展示收/发消息，区分方向（↑ 发送 / ↓ 接收） |
| W-005 | 子协议 | P2 | 可选 `Sec-WebSocket-Protocol` |
| W-006 | Headers | P1 | 连接时自定义 Header（如 Authorization） |
| W-007 | 心跳展示 | P2 | 显示 ping/pong（若可检测） |
| W-008 | 清空消息 | P1 | 清空当前会话消息列表 |
| W-009 | 自动重连 | P2 | 断线后可选自动重连（次数、间隔可配） |
| W-010 | 导出消息 | P2 | 导出当前会话为 JSON 文件 |

**WebSocket 交互流程：**

```
输入 ws(s) URL →（可选）预执行脚本 → Headers → 连接 → 收发消息 → 断开
```

---

### 4.5 响应与错误处理

| 编号 | 需求 | 优先级 | 说明 |
|------|------|--------|------|
| R-001 | 状态码着色 | P0 | 2xx 绿、3xx 蓝、4xx 橙、5xx 红 |
| R-002 | 网络错误 | P0 | 超时、DNS 失败、CORS（浏览器版）等友好提示 |
| R-003 | 耗时统计 | P0 | 毫秒级，显示在状态栏 |
| R-004 | 响应大小 | P1 | 自动计算 Body 字节数 |
| R-005 | 下载响应 | P2 | 大文件 / 二进制响应支持下载 |

---

## 5. 界面与交互需求

### 5.1 布局（推荐）

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  API Helper          [环境: 开发 ▼]    [历史] [设置] │
├──────────────┬──────────────────────────────────────────────┤
│              │  [HTTP ▼]  [GET ▼]  [URL 输入框...........] [发送] │
│   历史/收藏   │  ──────────────────────────────────────────── │
│   （可折叠）  │  [Params][Headers][Body*][预执行脚本][变量预览]  │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │  请求配置区域                            │ │
│              │  └─────────────────────────────────────────┘ │
│              │  ──────────────────────────────────────────── │
│              │  Response  200 OK  128ms  1.2KB              │
│              │  [Body] [Headers]                            │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │  响应内容（JSON 高亮 / WS 消息流）        │ │
│              │  └─────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────┘
```

WebSocket 模式下：方法下拉隐藏；Body 区替换为「消息输入 + 发送」；响应区为消息时间线。

### 5.2 视觉规范

| 项 | 要求 |
|----|------|
| 风格 | 现代简约，浅色/深色主题 |
| 主色 | 单一品牌色用于主按钮与焦点 |
| 字体 | 代码区等宽字体（如 JetBrains Mono、Consolas） |
| 间距 | 充足留白，避免 Postman 式密集 Tab |
| 默认主题 | 跟随系统；可手动切换 |

### 5.3 交互细节

- URL 框获焦时全选，便于快速粘贴
- 发送后自动滚动到响应区
- 表单校验失败时在字段旁提示，不弹阻塞性对话框
- 空状态：历史为空时显示引导文案「发送第一个请求吧」

---

## 6. 非功能需求

### 6.1 性能

| 指标 | 目标 |
|------|------|
| 冷启动 | Windows 桌面 < 2s |
| 请求 UI 响应 | 点击发送后 100ms 内进入 loading |
| 大响应 Body | > 1MB 时虚拟滚动或分页，避免卡顿 |
| 历史加载 | 100 条 < 200ms |

### 6.2 平台与兼容性

- **仅支持 Windows 10 / 11** 桌面应用（x64）
- 单机本地运行：无需安装数据库服务，无需登录
- 安装方式：`.exe` 安装包或绿色便携版（单目录解压即用）
- 无 CORS 限制，可直接请求任意 HTTP / WebSocket 地址

### 6.3 安全

- 敏感 Header（Authorization、Cookie）默认部分掩码显示
- 本地存储可选择「不记录 Authorization」
- 不向第三方上传请求数据（v1 无云功能）
- HTTPS / WSS 默认优先

### 6.4 可用性

- 新用户无需教程即可完成首次 GET 请求（< 1 分钟）
- 关键操作支持快捷键（见下表）

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Enter` | 发送请求 / WS 发送消息 |
| `Ctrl + R` | 仅运行预执行脚本 |
| `Ctrl + S` | 收藏当前请求 |
| `Ctrl + H` | 打开/关闭历史面板 |
| `Ctrl + L` | 聚焦 URL 输入框 |

---

## 7. 数据模型（概要）

### 7.1 请求快照（RequestSnapshot）

```typescript
interface RequestSnapshot {
  id: string;
  name?: string;           // 收藏名称
  protocol: 'http' | 'websocket';
  method?: 'GET' | 'POST';
  url: string;
  query: KeyValue[];
  headers: KeyValue[];
  body?: {
    type: 'none' | 'json' | 'form' | 'raw';
    content: string | KeyValue[];
  };
  preRequestScript?: {
    enabled: boolean;
    code: string;
  };
  createdAt: number;
  isFavorite?: boolean;
}
```

### 7.2 历史记录（HistoryItem）

```typescript
interface HistoryItem extends RequestSnapshot {
  response?: {
    status?: number;
    statusText?: string;
    durationMs: number;
    headers: Record<string, string>;
    body: string;
    error?: string;
  };
}
```

### 7.3 WebSocket 消息（WsMessage）

```typescript
interface WsMessage {
  id: string;
  direction: 'sent' | 'received';
  content: string;
  timestamp: number;
}
```

### 7.4 环境（Environment）

```typescript
interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
}
```

**存储：** Windows 本地 `%AppData%\API Helper\`（SQLite 或 JSON 文件），完全离线。

---

## 8. 技术方案（Windows 单机）

| 层级 | 选型 | 说明 |
|------|------|------|
| 桌面壳 | **Tauri 2** | 体积小（~5–10MB）、原生 Windows 体验 |
| UI | React + TypeScript + Tailwind | 组件化，便于 Tab 布局 |
| HTTP | Rust `reqwest`（Tauri 侧） | 无 CORS，支持超时、取消 |
| WebSocket | Rust `tokio-tungstenite` 或 Tauri 插件 | 稳定长连接 |
| 预执行脚本 | **QuickJS** 或 **Boa**（Rust 嵌入 JS 引擎） | 沙箱执行，超时可控 |
| 存储 | SQLite（`rusqlite`）+ 本地文件 | 历史、收藏、环境、脚本 |
| 编辑器 | CodeMirror 6 | 脚本 / JSON 高亮 |

**数据目录（默认）：**

```
%AppData%\API Helper\
  ├── config.json          # 主题、超时、脚本策略
  ├── data.db              # 历史、收藏、环境
  └── logs\                # 可选调试日志
```

**打包：** `tauri build` 产出 Windows `.msi` / `.exe` 安装包。

---

## 9. MVP 范围（v1.0）

### 9.1 必须交付（P0）

- [ ] HTTP GET：URL、Query、Headers、响应展示
- [ ] HTTP POST：JSON Body、Headers、Query、响应展示
- [ ] WebSocket：连接、断开、文本消息收发、消息列表
- [ ] **预执行脚本**：编辑、运行、变量写入、`{{var}}` 替换
- [ ] **Headers 引用脚本变量**（如 `Authorization: Bearer {{token}}`）
- [ ] 变量预览 Tab + 脚本日志 Tab
- [ ] 请求历史（自动记录 + 一键复用，含脚本）
- [ ] 简洁主界面 + 明暗主题
- [ ] Windows 本地持久化（`%AppData%`）
- [ ] `Ctrl+Enter` 发送 · `Ctrl+R` 运行脚本

### 9.2 第一版可选（P1）

- [ ] 环境变量与 `{{var}}` 替换
- [ ] 收藏请求
- [ ] POST Form Data
- [ ] WS 连接 Headers
- [ ] JSON 响应树形视图
- [ ] 复制为 cURL

### 9.3 后续版本（P2+）

- [ ] PUT / DELETE / PATCH
- [ ] 导入 Postman Collection
- [ ] 请求文件夹分组
- [ ] 代理设置
- [ ] 多 Tab 并发请求
- [ ] 插件扩展

---

## 10. 验收标准

### 10.1 功能验收

1. 用户输入 `https://httpbin.org/get?id=1` 发起 GET，能看到 200 响应及 Query 回显。
2. 用户 POST JSON 到 `https://httpbin.org/post`，响应中 `json` 字段与发送内容一致。
3. 用户连接公共 WS 测试地址（如 `wss://echo.websocket.events`），发送消息后能收到 echo。
4. 关闭应用再打开，最近 10 条历史仍可加载并复用。
5. 切换环境变量后，URL 中 `{{baseUrl}}` 被正确替换。
6. 预执行脚本 `vars.set('sign', ...)` 后，Header `X-Sign: {{sign}}` 发送值为脚本输出。
7. 脚本报错时请求被阻止，脚本日志展示行号与原因。

### 10.2 体验验收

1. 新用户从打开应用到完成首次 GET 请求，无需阅读文档，耗时 < 1 分钟。
2. 主界面核心操作区域不超过 2 屏高度（1080p 显示器）。
3. 无阻塞性弹窗；错误信息可读、可行动（如「JSON 格式错误，第 3 行缺少引号」）。

---

## 11. 里程碑建议

| 阶段 | 周期 | 交付 |
|------|------|------|
| M1 — 原型 | 1 周 | 静态 UI + 路由；GET 请求打通 |
| M2 — HTTP 完整 | 1 周 | POST + Headers + 历史 |
| M3 — WebSocket | 1 周 | WS 连接与消息流 |
| M4 —  polish | 1 周 | 主题、环境变量、收藏、cURL |
| **v1.0 发布** | **约 4 周** | MVP + P1 部分 |

---

## 12. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 脚本安全 | 恶意脚本访问本地 | QuickJS 沙箱；禁文件系统；仅暴露 vars/env/crypto API |
| 大响应内存 | 应用卡顿 | 限制展示大小 + 下载到文件 |
| WS 断线 | 用户困惑 | 明确状态指示 + 可选自动重连 |
| 与 Postman 功能差距 | 用户预期过高 | 定位「轻量日常调试」，文档写清边界 |

---

## 13. 术语表

| 术语 | 说明 |
|------|------|
| Query / Params | URL `?` 后的键值对参数 |
| Header | HTTP 请求头 |
| Body | POST 请求体 |
| 环境变量 | 多套可切换的全局键值配置 |
| 预执行脚本 | 发送前运行的 JS，用于动态生成 Header 等参数 |
| 请求级变量 | 脚本通过 `vars.set` 写入，仅当前请求有效 |
| 历史 / 收藏 | 历史为自动记录；收藏为用户主动保存 |

---

## 14. 附录：竞品对比（简要）

| 能力 | Postman | Apipost | API Helper v1 |
|------|---------|---------|---------------|
| 学习成本 | 高 | 中 | **低** |
| GET/POST | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ |
| 团队协作 | ✅ | ✅ | ❌ |
| 自动化测试 | ✅ | ✅ | ❌ |
| 界面简洁 | ❌ | ❌ | **✅** |
| 本地免登录 | 部分 | 部分 | **✅** |

---

**文档维护：** 随迭代更新 MVP 勾选状态与优先级。  
**关联文档：** [UI 线框图（WIREFRAME.md）](./WIREFRAME.md)
