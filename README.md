# API Helper

Windows 桌面单机 API 调试工具，基于 **Tauri 2 + React + TypeScript + Rust**。

界面简洁、全中文，覆盖日常联调最常用的能力：**HTTP GET/POST**、**WebSocket**、**预执行脚本**、**环境变量**、**导入导出**、**请求历史** 与 **本地持久化**。

> 打开即用，三秒发请求，一眼看结果。

**当前版本：v1.0.0**

## 功能概览

| 功能 | 说明 |
|------|------|
| HTTP GET / POST | Rust `reqwest` 发起请求，支持参数、请求头、JSON / 纯文本请求体 |
| WebSocket | 连接、断开、消息收发；与 HTTP 共用同一套配置与结果面板布局 |
| 预执行脚本 | `vars.set()`、`env.get()`、`crypto.md5()` 等，支持 `{{var}}` 引用 |
| 环境变量 | 开发 / 测试 / 生产多套变量，URL、请求头、请求体自动替换 |
| 导入 / 导出 | Postman 集合、Apipost 项目、环境变量 JSON；Tauri 原生文件对话框 |
| 请求历史 | 最近 100 条，收藏、单条删除、清空；WebSocket 同地址复用一条记录 |
| 本地持久化 | 环境、历史、请求配置自动保存到本地 JSON |
| 明暗主题 | 跟随系统或手动切换 |

## 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│ 顶栏：环境 · 环境变量 · 导入/导出 · 历史 · 设置              │
├──────────┬──────────────────────────────────────────────────┤
│          │ 请求栏：协议 · 方法 · URL · 发送/连接              │
│  历史    ├──────────────────────────────────────────────────┤
│  侧边栏  │ 配置区：参数 | 请求头 | 请求体 | 脚本 | 变量       │
│          ├──────────────────────────────────────────────────┤
│          │ 结果区：HTTP 响应 / WebSocket 消息 · 脚本日志      │
└──────────┴──────────────────────────────────────────────────┘
│ 状态栏：快捷键提示                                            │
└─────────────────────────────────────────────────────────────┘
```

- **HTTP 与 WebSocket 统一交互**：上方编辑请求，下方查看结果；WebSocket 请求体与 HTTP POST 使用相同编辑器（JSON / 纯文本 / 无）。
- **结果面板合并**：HTTP 显示响应体 / 响应头 / 脚本日志；WebSocket 显示消息记录 / 脚本日志，支持清空与导出。
- **历史侧边栏**：全部 / 收藏筛选，点击复用 URL，支持 ☆ 收藏、× 删除、一键清空。

## 环境要求

| 依赖 | 版本 |
|------|------|
| 操作系统 | **Windows 10 / 11**（仅桌面端） |
| [Node.js](https://nodejs.org/) | 18+（推荐 LTS） |
| [Rust](https://www.rust-lang.org/tools/install) | stable（含 rustup、cargo） |
| WebView2 | Windows 10/11 通常已预装 |

## 获取源码

```powershell
git clone git@github.com:yzcaojian/api-helper.git
cd api-helper
```

## 安装依赖

```powershell
npm install
```

首次编译 Rust 后端会下载 crates，耗时取决于网络。项目已配置 [中科大 crates 镜像](.cargo/config.toml)，国内环境一般更快。

若 Rust 尚未安装：

```powershell
winget install Rustlang.Rustup
rustup default stable
```

## 开发运行

```powershell
npm run tauri dev
```

- 前端开发服务器：`http://localhost:1420`
- 修改前端代码热更新；修改 Rust 代码会自动重新编译

## 构建发布包

```powershell
npm run tauri build
```

安装包输出目录：

```
src-tauri/target/release/bundle/nsis/
└── API Helper_1.0.0_x64-setup.exe
```

仅构建前端（不打包桌面应用）：

```powershell
npm run build
```

正式版启动时不显示 CMD 黑窗口。

## 使用说明

### HTTP 请求

1. 协议选择 **HTTP**，方法选 **GET** 或 **POST**
2. 填写 URL，例如 `{{baseUrl}}/get`
3. 在 **参数 / 请求头 / 请求体** 中配置（支持 `{{变量名}}`）
4. 点击 **发送** 或按 `Ctrl+Enter`
5. 下方 **响应** 面板查看响应体、响应头、脚本日志

默认开发环境变量：

| 变量 | 默认值 |
|------|--------|
| `baseUrl` | `https://httpbin.org` |
| `apiSecret` | `demo-secret` |

### WebSocket

1. 协议切换为 **WebSocket**
2. 默认测试地址：`wss://echo-websocket.hoppscotch.io`
3. 在 **请求体** 标签填写要发送的消息，例如 `{"message":"hello"}`
4. 点击 **连接**；成功后点击 **发送**（或 `Ctrl+Enter`）
5. 已连接时可点 **断开** 结束会话
6. 下方 **消息** 面板查看收发记录，支持清空与导出 JSON

公共 echo 测试：保持默认 Hoppscotch 地址，连接后发送 `{"message":"hello"}` 即可收到回显。

### 预执行脚本

在 **脚本** 标签中编写 JavaScript，于请求发送前执行：

```javascript
vars.set("timestamp", Date.now());
vars.set("sign", crypto.md5(String(vars.get("timestamp")) + env.get("apiSecret")));
```

请求头中可引用：`X-Timestamp: {{timestamp}}`、`X-Sign: {{sign}}`

在脚本标签点击 **试运行**，或按 `Ctrl+R` 仅运行脚本并查看日志，不发送请求。

### 环境变量

顶栏选择 **开发 / 测试 / 生产** 环境，点击 **环境变量** 编辑键值对。

变量在 URL、请求头、请求体、脚本中均可通过 `{{key}}` 或 `env.get("key")` 使用。在 **变量** 标签可预览当前解析结果。

### 导入 / 导出

顶栏 **导入 / 导出** 菜单：

| 操作 | 说明 |
|------|------|
| 导入 JSON 文件 | 支持 Postman 集合、Apipost 项目、环境变量、单请求 JSON |
| 导出 Postman 集合 | 保存为 `.json`，可导入 Postman |
| 导出 Apipost 项目 | 保存为 Apipost 兼容格式 |
| 导出环境变量 | 导出全部环境的变量 JSON |

桌面版通过系统文件对话框选择路径，Web 预览版回退为浏览器文件选择。

### 请求历史

- 点击顶栏 **历史** 展开 / 收起侧边栏
- 点击历史项复用 URL 与协议
- **☆** 收藏常用请求，**×** 删除单条，**清空** 删除全部
- WebSocket 同一 URL 多次连接只更新一条历史，不会重复堆积

### 本地持久化

应用将以下数据保存到本地（`api-helper.json`，由 Tauri Store 管理）：

- 主题、侧边栏状态、面板分割比例
- 环境变量与当前选中环境
- 请求历史（含收藏）
- 当前 URL、参数、请求头、请求体、脚本等

修改后约 400ms 自动保存；重启应用后自动恢复。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Enter` | HTTP 发送 / WebSocket 连接或发送消息 |
| `Ctrl+R` | 仅运行预执行脚本 |
| `Ctrl+L` | 聚焦 URL 输入框 |
| `Ctrl+1` ~ `Ctrl+5` | 切换配置标签（参数 / 请求头 / 请求体 / 脚本 / 变量） |

## 项目结构

```
api-helper/
├── src/                    # React 前端
│   ├── components/         # UI 组件（布局、抽屉、设置）
│   ├── store/              # Zustand 状态
│   ├── lib/                # HTTP / WS / 脚本 / 导入导出 / 持久化
│   └── hooks/              # 持久化、WebSocket 事件
├── src-tauri/              # Tauri + Rust 后端
│   └── src/
│       ├── lib.rs          # HTTP 命令入口
│       └── ws.rs           # WebSocket 实现
├── scripts/                # 构建辅助脚本
├── docs/                   # PRD、UX、线框图
└── .cargo/config.toml      # Rust crates 镜像（可选）
```

## 常见问题

**`npm` / `cargo` 找不到**

确认 Node.js 与 Rust 已安装并加入 PATH，重新打开终端后再试。

**Rust 编译下载超时**

项目已配置 USTC 镜像。仍失败时可手动设置：

```powershell
$env:RUSTUP_DIST_SERVER = "https://mirrors.ustc.edu.cn/rust-static"
$env:RUSTUP_UPDATE_ROOT = "https://mirrors.ustc.edu.cn/rust-static/rustup"
```

**WebSocket 连接失败**

- 确认 URL 为 `ws://` 或 `wss://`（不能用 `http://`）
- 若提示 HTTP 200 而非 101，说明地址不是 WebSocket 端点
- 检查网络与请求头鉴权

**WebSocket 发送报错 `sessionId`**

请使用 v1.0.0 及以上安装包，旧版本可能存在参数兼容问题。

**导出没有反应**

请使用桌面安装版；导出依赖 Tauri 原生保存对话框，浏览器预览模式不支持。

## 更新日志

### v1.0.0

- 统一 HTTP / WebSocket 界面布局与中文文案
- 合并结果面板，精简顶栏、历史栏、状态栏冗余元素
- WebSocket 请求体与 HTTP 共用编辑器，修复发送与历史重复问题
- 导入 / 导出（Postman、Apipost、环境变量）与历史删除
- 正式版隐藏 CMD 窗口

## 文档

- [产品需求（PRD）](docs/PRD.md)
- [UX 设计](docs/UX-DESIGN.md)
- [线框图](docs/WIREFRAME.md)

## License

MIT
