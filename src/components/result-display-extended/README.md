# ResultDisplayExtended 组件

扩展的结果显示组件，用于显示 API 响应结果，支持媒体预览、WebSocket 实时更新等功能。

## 文件结构

```
result-display-extended/
├── index.tsx              # 主组件，整合所有子组件
├── types.ts               # TypeScript 类型定义
├── utils.ts               # 工具函数（媒体类型判断、时间格式化等）
├── use-websocket.ts       # WebSocket 连接和管理 hook
├── output-card.tsx        # 输出卡片组件（显示任务状态和媒体）
├── media-thumbnail.tsx    # 媒体缩略图组件
├── media-preview.tsx      # 媒体预览组件
└── preview-dialog.tsx     # 预览对话框组件
```

## 组件说明

### index.tsx
主组件，负责：
- 数据初始化和状态管理
- 整合所有子组件
- 键盘事件处理
- 倒计时逻辑

### types.ts
类型定义：
- `Root`: API 响应根类型
- `Data`: 任务数据类型
- `Output`: 输出项类型
- `MediaType`: 媒体类型枚举

### utils.ts
工具函数：
- `getMediaType(url)`: 根据 URL 后缀判断媒体类型
- `formatRemainingTime(ms)`: 格式化倒计时时间

### use-websocket.ts
WebSocket hook：
- 管理 WebSocket 连接
- 处理消息接收和 DOM 更新
- 自动重连逻辑

### output-card.tsx
输出卡片组件：
- 显示任务状态（generating/waiting/failed/finished）
- 显示媒体缩略图（已完成状态）
- 显示队列号和倒计时

### media-thumbnail.tsx
媒体缩略图组件：
- 根据媒体类型显示不同的缩略图
- 支持图片、视频、音频和其他文件类型

### media-preview.tsx
媒体预览组件：
- 全屏预览媒体内容
- 支持图片、视频、音频播放
- 其他文件类型显示下载链接

### preview-dialog.tsx
预览对话框组件：
- 全屏媒体预览
- 左右切换按钮
- 底部指示器
- 键盘导航支持

## 使用方式

```tsx
import { ResultDisplayExtended } from "@/components/result-display-extended";
import type { FetchResult } from "@/openapi/playground/fetcher";

<ResultDisplayExtended data={fetchResult} />
```

## 特性

- ✅ 支持多种媒体类型（图片、视频、音频）
- ✅ WebSocket 实时更新任务状态
- ✅ 倒计时显示
- ✅ 全屏预览功能
- ✅ 键盘导航支持
- ✅ 模块化设计，易于维护和扩展
