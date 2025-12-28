# 🖥️ Tauri 剪贴板功能集成指南

## 📋 问题背景

在 Tauri 桌面应用中，浏览器的 Clipboard API 会因为权限策略（Permissions Policy）被阻止，导致复制功能失败：

```
[Violation] Permissions policy violation: The Clipboard API has been blocked because
of a permissions policy applied to the current document.
```

## ✅ 解决方案

我们创建了 `tauriClipboard.ts` 工具库，自动检测运行环境并选择最佳实现：

- **浏览器环境**: 使用标准 Clipboard API
- **Tauri 环境**: 使用 Tauri Clipboard Manager 插件
- **降级方案**: 使用传统 `document.execCommand('copy')`

## 🚀 快速使用

### 1. 复制文本到剪贴板

```typescript
import { copyToClipboard } from '@/lib/tauriClipboard';

// 在任何组件中使用
const handleCopy = async () => {
  const success = await copyToClipboard('要复制的文本内容');
  if (success) {
    console.log('复制成功！');
  }
};
```

### 2. 从剪贴板读取文本

```typescript
import { readFromClipboard } from '@/lib/tauriClipboard';

const handlePaste = async () => {
  const text = await readFromClipboard();
  console.log('剪贴板内容:', text);
};
```

### 3. 检测运行环境

```typescript
import { isTauriEnvironment } from '@/lib/tauriClipboard';

if (isTauriEnvironment()) {
  console.log('在 Tauri 桌面应用中运行');
} else {
  console.log('在浏览器中运行');
}
```

## 📦 核心 API

### `copyToClipboard(text: string): Promise<boolean>`

复制文本到剪贴板，支持双环境自动适配。

**参数**:
- `text`: 要复制的文本内容

**返回值**:
- `Promise<boolean>` - 复制成功返回 true，失败返回 false

**示例**:
```typescript
const success = await copyToClipboard('Hello, World!');
```

### `readFromClipboard(): Promise<string>`

从剪贴板读取文本内容。

**返回值**:
- `Promise<string>` - 剪贴板中的文本内容，失败返回空字符串

**示例**:
```typescript
const text = await readFromClipboard();
```

### `isTauriEnvironment(): boolean`

检测当前是否在 Tauri 环境中运行。

**返回值**:
- `boolean` - Tauri 环境返回 true，浏览器返回 false

## 🎯 实现原理

### 环境检测

```typescript
// 检测是否在 Tauri 环境
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.__TAURI__ !== 'undefined' &&
         typeof window.__TAURI__.core !== 'undefined' &&
         typeof window.__TAURI__.core.invoke === 'function';
}

// 检测是否为本地 URL（Tauri 插件仅限本地）
function isLocalUrl(): boolean {
  const url = window.location.href;
  return url.startsWith('tauri://') ||
         url.startsWith('http://tauri.localhost') ||
         url.startsWith('https://tauri.localhost') ||
         url.startsWith('http://localhost') ||
         url.startsWith('file://');
}

// 检测是否可以使用 Tauri 剪贴板 API
function canUseTauriClipboard(): boolean {
  return isTauriEnvironment() && isLocalUrl();
}
```

### 智能路由策略

代码会根据环境自动选择最佳实现：

```
┌─────────────────────────────────────────┐
│         copyToClipboard(text)          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │  环境检测      │
          └───────┬───────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│Tauri本地│ │Tauri远程│ │ 浏览器   │
│  URL    │ │  URL    │ │          │
└────┬────┘ └────┬────┘ └────┬─────┘
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│Tauri API│ │execCmd  │ │Clipboard │
│         │ │(降级)   │ │   API    │
└─────────┘ └─────────┘ └────┬─────┘
                             │失败
                             ▼
                        ┌─────────┐
                        │execCmd  │
                        │(降级)   │
                        └─────────┘
```

### 三层降级策略

1. **Tauri 本地环境**: 使用 `plugin:clipboard-manager|write_text`
   ```typescript
   await window.__TAURI__.core.invoke('plugin:clipboard-manager|write_text', {
     text: text,
   });
   ```

2. **浏览器环境**: 使用 Clipboard API
   ```typescript
   await navigator.clipboard.writeText(text);
   ```

3. **降级方案**: 使用 execCommand（Tauri 远程 URL 或 API 失败时）
   ```typescript
   const textarea = document.createElement('textarea');
   textarea.value = text;
   document.body.appendChild(textarea);
   textarea.select();
   document.execCommand('copy');
   document.body.removeChild(textarea);
   ```

## 🔧 已集成组件

### MessageBubble.tsx

消息气泡组件的复制功能已升级：

```typescript
// 旧实现（仅支持浏览器）
const handleCopy = async () => {
  await navigator.clipboard.writeText(message.content);
  setCopied(true);
};

// 新实现（支持 Tauri + 浏览器）
import { copyToClipboard } from '@/lib/tauriClipboard';

const handleCopy = async () => {
  const success = await copyToClipboard(message.content);
  if (success) {
    setCopied(true);
  }
};
```

## 🧪 测试工具

### ClipboardTest 组件

我们提供了专门的测试组件 `<ClipboardTest />`，可以实时测试剪贴板功能。

**使用方法**:
```typescript
import { ClipboardTest } from '@/components/debug/ClipboardTest';

// 在需要调试的页面添加
<ClipboardTest />
```

**功能**:
- ✅ 显示当前运行环境（Tauri/浏览器）
- ✅ 测试复制文本到剪贴板
- ✅ 测试从剪贴板读取文本
- ✅ 实时状态反馈

## 📝 开发注意事项

### 1. Tauri 配置要求

确保 Tauri 配置文件中启用了 Clipboard Manager 插件：

```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "clipboard-manager": {
      "enabled": true
    }
  }
}
```

### 2. 权限配置

如果需要读取剪贴板，可能需要额外的权限配置：

```json
{
  "permissions": [
    "clipboard:allow-read-text",
    "clipboard:allow-write-text"
  ]
}
```

### 3. 错误处理

始终处理可能的错误情况：

```typescript
const handleCopy = async () => {
  try {
    const success = await copyToClipboard(text);
    if (success) {
      // 成功提示
      showToast('复制成功！');
    } else {
      // 失败提示
      showToast('复制失败，请重试');
    }
  } catch (error) {
    console.error('Clipboard error:', error);
    showToast('复制出错');
  }
};
```

## 🐛 常见问题

### Q1: 在浏览器中测试时提示权限错误？

**A**: 某些浏览器需要 HTTPS 才能使用 Clipboard API。本地开发时会自动使用降级方案（execCommand）。

### Q2: Tauri 环境中显示"检测到远程URL，使用降级方案"？

**A**: 这是正常现象！Tauri 剪贴板插件仅在本地 URL 下可用（安全限制）。

**Tauri 权限策略**:
- ✅ **本地 URL**: `tauri://localhost`、`http://localhost`、`file://`
- ❌ **远程 URL**: `https://www.yujinkeji.me/` 等线上地址

**控制台日志示例**:
```
🔍 [剪贴板] 环境检测: Tauri桌面应用
⚠️ [Tauri] 检测到远程URL，使用降级方案: https://www.yujinkeji.me/
✅ [降级方案] 文本复制成功 (execCommand)
```

**解决方案**: 降级方案（execCommand）完全可用，功能不受影响！

### Q3: 为什么 Tauri 环境不使用原生 API？

**A**:
- **本地应用**（tauri://localhost）: 使用 Tauri 原生剪贴板 API
- **远程网页**（https://xxx）: 受权限策略限制，自动使用 execCommand 降级方案
- **浏览器环境**: 优先使用 Clipboard API，失败时降级

这是 Tauri 的安全设计，防止远程网页滥用系统权限。

### Q4: 如何知道复制功能使用了哪种实现？

**A**: 在控制台中查看日志：

**本地 Tauri**:
```
🔍 [剪贴板] 环境检测: Tauri桌面应用
📋 [Tauri] 使用原生剪贴板 API
✅ [Tauri] 文本复制成功
```

**远程 Tauri**:
```
🔍 [剪贴板] 环境检测: Tauri桌面应用
⚠️ [Tauri] 检测到远程URL，使用降级方案
✅ [降级方案] 文本复制成功 (execCommand)
```

**浏览器**:
```
🔍 [剪贴板] 环境检测: 浏览器
✅ [浏览器] 文本复制成功 (Clipboard API)
```

## 🎨 最佳实践

### 1. 用户反馈

复制操作要有明确的视觉反馈：

```typescript
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  const success = await copyToClipboard(text);
  if (success) {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
};

// UI 反馈
{copied ? <Check className="text-green-600" /> : <Copy />}
```

### 2. 性能优化

避免频繁调用剪贴板 API：

```typescript
// 使用防抖
const debouncedCopy = debounce(async (text) => {
  await copyToClipboard(text);
}, 300);
```

### 3. 日志记录

在生产环境中保留关键日志：

```typescript
const success = await copyToClipboard(text);
if (!success) {
  analytics.track('clipboard_copy_failed', {
    environment: isTauriEnvironment() ? 'tauri' : 'browser',
  });
}
```

## 📚 相关资源

- [Tauri Clipboard Manager 文档](https://tauri.app/plugin/clipboard-manager)
- [Web Clipboard API 规范](https://w3c.github.io/clipboard-apis/)
- [项目中的实现代码](./src/lib/tauriClipboard.ts)

## 🔄 版本历史

- **v1.0.0** (2025-01-19): 初始版本，支持 Tauri 和浏览器双环境
- 新增 `copyToClipboard()` 和 `readFromClipboard()` API
- 集成到 MessageBubble 组件
- 提供测试工具组件

---

## 💡 提示

如果遇到问题或有改进建议，请查看项目文档或提交 Issue。
