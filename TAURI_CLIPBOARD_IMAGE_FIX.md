# Tauri剪切板图片复制功能修复指南

## 📋 问题描述

在Tauri桌面应用中，iframe加载的远程页面无法使用截图复制功能，出现以下错误：

```
⚠️ [Tauri] 原生API复制失败: undefined
⚠️ [剪切板] 复制失败: The Clipboard API has been blocked because of a permissions policy
```

## 🔍 问题根源

1. **权限配置缺失**：iframe远程页面没有剪切板权限
2. **API使用错误**：没有正确使用Tauri 2.x的剪切板API

---

## ✅ 第一步：权限配置（已完成）

以下权限配置已经添加到项目中：

### `src-tauri/capabilities/iframe-capability.json`
```json
{
  "permissions": [
    "clipboard-manager:default",
    "clipboard-manager:allow-write-image",
    "clipboard-manager:allow-write-text",
    "clipboard-manager:allow-read-image",
    "clipboard-manager:allow-read-text"
  ]
}
```

### `src-tauri/capabilities/main-capability.json`
```json
{
  "permissions": [
    "clipboard-manager:allow-write-image",
    "clipboard-manager:allow-read-image"
  ]
}
```

---

## 🔧 第二步：修改页面代码

### 当前代码问题分析

根据错误日志，你的代码可能是这样的：

```javascript
// ❌ 错误的写法
async function copyImageWithTauri(blob) {
  try {
    // 这种写法在Tauri 2.x中不正确
    await window.__TAURI__.clipboard.writeImage(blob);
  } catch (error) {
    console.error('⚠️ [Tauri] 原生API复制失败:', error);
  }
}
```

### 正确的Tauri 2.x剪切板API使用方法

```javascript
// ✅ 正确的写法
import { writeImage } from '@tauri-apps/plugin-clipboard-manager';

async function copyImageWithTauri(blob) {
  try {
    // 方法1：如果blob是Uint8Array
    if (blob instanceof Uint8Array) {
      await writeImage(blob);
      console.log('✅ [Tauri] 图片已复制到剪切板');
      return true;
    }

    // 方法2：如果blob是Blob对象，需要转换
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await writeImage(uint8Array);
    console.log('✅ [Tauri] 图片已复制到剪切板');
    return true;
  } catch (error) {
    console.error('⚠️ [Tauri] 原生API复制失败:', error);
    return false;
  }
}
```

---

## 📝 完整代码示例

### 方案A：在HTML页面中直接使用（推荐）

如果你的页面是 `.html` 文件，需要通过CDN或本地引入Tauri API：

```html
<!DOCTYPE html>
<html>
<head>
  <title>截图复制功能</title>
</head>
<body>
  <button onclick="copyTableScreenshot()">复制截图</button>

  <script type="module">
    // 1. 检测Tauri环境
    const isTauri = window.__TAURI__ !== undefined;

    // 2. 动态导入Tauri API
    let writeImage;
    if (isTauri) {
      try {
        // Tauri 2.x的API导入方式
        const clipboardManager = window.__TAURI_PLUGIN_CLIPBOARD_MANAGER__;
        writeImage = clipboardManager.writeImage;
      } catch (error) {
        console.error('无法加载Tauri剪切板API:', error);
      }
    }

    // 3. 截图复制函数
    async function copyTableScreenshot() {
      console.log('🔍 [截图] 环境检测:', isTauri ? 'Tauri桌面应用' : 'Web浏览器');

      try {
        // 使用html2canvas或其他库生成截图
        const canvas = await html2canvas(document.querySelector('#table-container'));

        // 转换为Blob
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/png');
        });

        // 尝试使用Tauri API
        if (isTauri && writeImage) {
          console.log('📋 [Tauri] 尝试使用原生API复制图片...');

          // 转换Blob为Uint8Array
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // 调用Tauri API
          await writeImage(uint8Array);

          console.log('✅ [Tauri] 图片已成功复制到剪切板');
          alert('截图已复制到剪切板！');
          return;
        }

        // 降级方案：使用浏览器Clipboard API
        console.log('📋 [浏览器] 尝试使用Clipboard API...');
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);

        console.log('✅ [浏览器] 图片已成功复制到剪切板');
        alert('截图已复制到剪切板！');

      } catch (error) {
        console.error('❌ [剪切板] 复制失败:', error);
        alert('复制失败：' + error.message);
      }
    }

    // 暴露到全局作用域
    window.copyTableScreenshot = copyTableScreenshot;
  </script>
</body>
</html>
```

---

### 方案B：使用Base64编码（兼容性更好）

如果Uint8Array方式不工作，可以尝试Base64编码：

```javascript
async function copyImageWithTauriBase64(canvas) {
  try {
    // 1. 转换canvas为Base64
    const base64Data = canvas.toDataURL('image/png').split(',')[1];

    // 2. Base64转Uint8Array
    const binaryString = atob(base64Data);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    // 3. 调用Tauri API
    await window.__TAURI_PLUGIN_CLIPBOARD_MANAGER__.writeImage(uint8Array);

    console.log('✅ [Tauri] 图片已复制（Base64方式）');
    return true;
  } catch (error) {
    console.error('⚠️ [Tauri] Base64方式失败:', error);
    return false;
  }
}
```

---

## 🎯 修改步骤总结

### 步骤1：找到你的截图复制函数

在 `销售部大扫除安排表.html` 文件中，找到类似这样的函数：
- `copyTableScreenshot()`
- `copyImageWithTauri()`
- 或其他处理截图复制的函数

### 步骤2：替换Tauri API调用

将原来的代码：
```javascript
// 旧代码
await window.__TAURI__.clipboard.writeImage(blob);
```

替换为：
```javascript
// 新代码
const arrayBuffer = await blob.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);
await window.__TAURI_PLUGIN_CLIPBOARD_MANAGER__.writeImage(uint8Array);
```

### 步骤3：添加错误处理

确保有完整的try-catch错误处理：
```javascript
try {
  // Tauri API调用
  await window.__TAURI_PLUGIN_CLIPBOARD_MANAGER__.writeImage(uint8Array);
  console.log('✅ 复制成功');
  alert('截图已复制到剪切板！');
} catch (error) {
  console.error('❌ 复制失败:', error);
  alert('复制失败：' + error.message);
}
```

---

## 🧪 测试验证

### 1. 重启Tauri开发服务器

```bash
npm run tauri:dev
```

### 2. 打开工具页面

在应用中打开"销售部大扫除安排表"工具。

### 3. 测试复制功能

点击"复制截图"按钮，检查：
- ✅ 浏览器控制台（F12）没有错误
- ✅ 出现"截图已复制到剪切板"提示
- ✅ 可以在其他应用（微信、Word）中粘贴

### 4. 检查控制台输出

正确的输出应该是：
```
🔍 [截图] 环境检测: Tauri桌面应用
📋 [Tauri] 尝试使用原生API复制图片...
✅ [Tauri] 图片已成功复制到剪切板
```

---

## 🔧 常见问题排查

### 问题1：仍然提示 "undefined"

**原因**：Tauri插件未正确加载

**解决方案**：
1. 检查 `src-tauri/Cargo.toml` 是否包含：
   ```toml
   tauri-plugin-clipboard-manager = "2"
   ```

2. 检查 `src-tauri/src/lib.rs` 是否注册插件：
   ```rust
   .plugin(tauri_plugin_clipboard_manager::init())
   ```

### 问题2：提示 "writeImage is not a function"

**原因**：API调用方式错误

**解决方案**：
使用正确的API路径：
```javascript
window.__TAURI_PLUGIN_CLIPBOARD_MANAGER__.writeImage
```

### 问题3：图片格式不支持

**原因**：Tauri只支持PNG格式

**解决方案**：
确保生成PNG格式的图片：
```javascript
canvas.toBlob(blob => {
  // 处理blob
}, 'image/png'); // 必须是 'image/png'
```

---

## 📚 参考资料

- [Tauri 2.x Clipboard Manager Plugin](https://v2.tauri.app/plugin/clipboard-manager/)
- [Tauri Capabilities配置](https://v2.tauri.app/security/capabilities/)
- [HTML Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 📞 技术支持

如果按照本文档修改后仍然有问题，请提供：
1. 完整的错误日志（浏览器控制台F12）
2. 修改后的代码片段
3. Tauri版本信息

---

**文档版本**: v1.0
**最后更新**: 2025-12-28
**适用版本**: Tauri 2.x
