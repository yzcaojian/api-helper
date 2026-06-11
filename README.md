# API Helper

Windows 桌面单机 API 调试工具，基于 **Tauri 2 + React + TypeScript + Rust**。

界面简洁，覆盖日常联调最常用的能力：**HTTP GET/POST**、**WebSocket**、**预执行脚本**、**环境变量**、**请求历史** 与 **本地持久化**。

> 打开即用，三秒发请求，一眼看结果。

## 功能概览

| 功能 | 说明 |
|------|------|
| HTTP GET / POST | Rust `reqwest` 发起请求，支持 Params / Headers / JSON Body |
| WebSocket | 连接、断开、文本消息收发，消息时间线展示 |
| 预执行脚本 | `vars.set()`、`env.get()`、`crypto.md5()` 等，支持 `{{var}}` 引用 |
| 环境变量 | 开发 / 测试 / 生产多套变量，URL、Header、Body 自动替换 |
| 请求历史 | 最近 100 条，侧边栏快速复用 |
| 本地持久化 | 环境、历史、请求配置自动保存到本地 JSON |
| 明暗主题 | 跟随系统或手动切换 |

## 环境要求

| 依赖 | 版本 |
|------|------|
| 操作系统 | **Windows 10 / 11**（仅桌面端） |
| [Node.js](https://nodejs.org/) | 18+（推荐 LTS） |
| [Rust](https://www.rust-lang.org/tools/install) | stable（含 rustup、cargo） |
| WebView2 | Windows 10/11 通常已预装 |

## 获取源码

```powershell
git clone https://github.com/yzcaojian/api-helper.git
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
src-tauri/target/release/bundle/
├── msi/    # MSI 安装包
└── nsis/   # NSIS 安装包
```

仅构建前端（不打包桌面应用）：

```powershell
npm run build
```

## 使用说明

### HTTP 请求

1. 协议选择 **HTTP**，方法选 **GET** 或 **POST**
2. 填写 URL，例如 `{{baseUrl}}/get`
3. 在 **Headers / Params / Body** 中配置请求（支持 `{{变量名}}`）
4. 点击 **发送** 或按 `Ctrl+Enter`

默认开发环境变量：

| 变量 | 默认值 |
|------|--------|
| `baseUrl` | `https://httpbin.org` |
| `wsHost` | `echo.websocket.events` |

### WebSocket

1. 协议切换为 **WebSocket**
2. URL 默认 `wss://{{wsHost}}`，可改为任意 `ws://` / `wss://` 地址
3. 点击 **连接**；连接成功后输入消息并 **发送**（或 `Ctrl+Enter`）
4. 右侧面板显示收发消息时间线，支持清空与导出

公共 echo 测试：保持默认 `wsHost`，连接后发送 `{"type":"ping"}` 即可收到回显。

### 预执行脚本

在 **脚本** Tab 中编写 JavaScript，于请求发送前执行：

```javascript
vars.set("timestamp", Date.now());
vars.set("sign", crypto.md5(String(vars.get("timestamp")) + env.get("secret")));
```

Header 中可引用：`X-Timestamp: {{timestamp}}`、`X-Sign: {{sign}}`

按 `Ctrl+R` 可仅运行脚本并查看日志，不发送请求。

### 环境变量

点击顶部 **环境** 按钮，切换开发 / 测试 / 生产，编辑键值对。变量在 URL、Header、Body、脚本中均可通过 `{{key}}` 或 `env.get("key")` 使用。

### 本地持久化

应用会将以下数据保存到本地（`api-helper.json`，由 Tauri Store 管理）：

- 主题、侧边栏状态
- 环境变量与当前选中环境
- 请求历史
- 当前 URL、Headers、Body、脚本、WebSocket 输入等

修改后约 400ms 自动保存；重启应用后自动恢复。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Enter` | HTTP 发送 / WebSocket 连接·断开·发消息 |
| `Ctrl+R` | 仅运行预执行脚本 |
| `Ctrl+L` | 聚焦 URL 输入框 |
| `Ctrl+1` ~ `Ctrl+5` | 切换配置 Tab |

## 项目结构

```
api-helper/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── store/              # Zustand 状态
│   ├── lib/                # HTTP / WS / 脚本 / 持久化
│   └── hooks/              # 持久化、WebSocket 事件
├── src-tauri/              # Tauri + Rust 后端
│   └── src/
│       ├── lib.rs          # HTTP 命令入口
│       └── ws.rs           # WebSocket 实现
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

检查 URL 是否为 `ws://` 或 `wss://`，目标服务是否可达，以及 Headers 是否需要鉴权。

## 文档

- [产品需求（PRD）](docs/PRD.md)
- [UX 设计](docs/UX-DESIGN.md)
- [线框图](docs/WIREFRAME.md)

## License

MIT
