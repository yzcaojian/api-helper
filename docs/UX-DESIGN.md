# API Helper — UX 设计说明

> 基于 [UI Design Brain](https://github.com/carmahhawwari/ui-design-brain) · **Enterprise / Corporate** 预设  
> 交互原型：[api-helper-ux.canvas.tsx](../canvases/api-helper-ux.canvas.tsx)（Cursor Canvas，可在聊天旁打开）

---

## 1. 设计方向

| 项 | 决策 |
|----|------|
| 风格预设 | **Enterprise / Corporate** — 信息分区清晰、紧凑间距、键盘优先 |
| 平台 | Windows 10/11 桌面单机，1280×800 基准 |
| 主色 | 单一 accent（发送/连接）；状态用语义 Pill（2xx 绿、4xx 橙、5xx 红） |
| 字体 | UI：系统 UI 字体；代码区：JetBrains Mono / Consolas |
| 间距 | 4 / 8 / 12 / 16 / 24 px（UI Design Brain 企业级紧凑尺度） |

### 反模式（明确避免）

- 彩虹 Badge — 每种状态一种亮色，无语义
- Modal 套 Modal — 环境变量用 **Drawer**，设置用独立窗口
- 占位符当 Label — Headers 表格必须有列标题
- 阻塞弹窗 — 校验与脚本错误用 **Inline Callout + 脚本日志**
- 桌面用 Hamburger — 历史侧栏始终可见，可折叠为窄条

---

## 2. 信息架构

```
主窗口
├── 顶栏（Header）          环境 Select · 变量 Pill · 历史 · 设置
├── 侧栏（Navigation）      历史 / 收藏 · Search input
├── 请求栏                  协议 · 方法 · URL · 运行脚本 · 发送
├── 配置 Tabs               Params | Headers | Body | 预执行脚本 | 变量预览
├── 响应区                  Body | Headers | 脚本日志
└── 状态栏                  快捷键提示 · 脚本状态 · 本地路径

叠加层
├── 环境变量 Drawer（420px，右侧）
└── 设置窗口（Card 分组）
```

---

## 3. 组件映射（UI Design Brain）

| 区域 | 组件 | 关键规则 |
|------|------|----------|
| 顶栏 | Header + Select + Pill | 高度 48px；变量数以 Pill 展示 |
| 历史 | Search input + List | 防抖 200ms；侧栏 220px |
| 协议/方法 | Select × 2 | 固定宽度；WebSocket 时隐藏方法 |
| 主操作 | Button primary | 每区一个 primary：「发送」或「连接」 |
| 次操作 | Button secondary | 「运行脚本」— verb-first |
| 配置 | Tabs（5 个） | 底部激活条；键盘 Ctrl+1~5 |
| Headers / Params | Table + Checkbox | stickyHeader；行启用开关 |
| 脚本 | Toggle + Textarea | Toggle 即时生效；Monaco 语法高亮 |
| 变量 | Table | 来源列 + 引用位置；敏感值掩码 |
| 响应状态 | Pill + Stat | 200 OK / 128ms / 1.2KB 一行扫描 |
| 脚本输出 | Tabs 子页 | 与 Response Body 同级，不混排 |
| 环境 | Drawer | 320–480px；Escape 关闭；dim 背景 |
| 空历史 | Empty state | headline + 「发送第一个请求」CTA |
| 错误 | Alert / Callout | 最多 2 句 + 「跳转脚本」链接 |

---

## 4. 核心用户流程

### 4.1 带签名的 HTTP 请求

```
1. 环境变量中配置 apiSecret
2. 预执行脚本生成 timestamp、sign
3. Headers 填写 X-Timestamp: {{timestamp}}、X-Sign: {{sign}}
4. 变量预览 Tab 确认替换值
5. Ctrl+Enter 发送
6. 脚本日志 Tab 确认执行成功
```

### 4.2 仅调试脚本（不发请求）

```
1. 打开「预执行脚本」Tab
2. 点击「运行脚本」或 Ctrl+R
3. 查看脚本日志 + 变量预览
4. 修正后再次运行
```

### 4.3 WebSocket

```
1. 切换协议 WebSocket
2. （可选）预执行脚本生成 Authorization
3. 连接 → 消息区时间线收发
4. 断开
```

---

## 5. 屏幕清单

| ID | 屏幕 | Canvas 按钮 |
|----|------|-------------|
| W-01 | HTTP 主界面 | HTTP 主界面 |
| W-02 | 预执行脚本 | 预执行脚本 |
| W-03 | 变量预览 | 变量预览 |
| W-04 | WebSocket | WebSocket |
| W-05 | 环境变量 Drawer | 环境变量 |
| W-06 | 设置 | 设置 |
| — | 流程 + 组件表 | 概览 |

---

## 6. 无障碍与键盘

| 快捷键 | 行为 |
|--------|------|
| Ctrl+Enter | 发送 / WS 发消息 |
| Ctrl+R | 仅运行脚本 |
| Ctrl+L | 聚焦 URL |
| Ctrl+1~5 | 切换配置 Tab |
| Escape | 关闭 Drawer |
| Tab | 表格行内顺序聚焦 |

- 焦点环：所有 Button、Tab、Input 可见 focus ring
- 对比度：WCAG AA；状态不仅靠颜色（Pill 含文字）

---

## 7. 关联文档

- [PRD.md](./PRD.md) — 功能需求
- [WIREFRAME.md](./WIREFRAME.md) — ASCII 线框
- Canvas 交互原型 — 见 IDE 中 `canvases/api-helper-ux.canvas.tsx`
