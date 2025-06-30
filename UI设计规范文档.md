# 智能排班系统 UI 设计规范文档

## 📋 目录
- [设计系统概述](#设计系统概述)
- [颜色系统](#颜色系统)
- [字体系统](#字体系统)
- [间距系统](#间距系统)
- [组件规范](#组件规范)
- [布局规范](#布局规范)
- [交互规范](#交互规范)
- [响应式规范](#响应式规范)

## 🎨 设计系统概述

### 设计理念
- **现代化**：采用现代扁平化设计风格
- **专业性**：企业级应用的视觉标准
- **易用性**：直观的用户界面和交互体验
- **一致性**：统一的设计语言和视觉元素

### 技术栈
- **CSS变量系统**：便于主题定制和维护
- **Font Awesome 6.4.0**：专业图标库
- **Google Fonts Inter**：现代化字体
- **CSS Grid + Flexbox**：响应式布局
- **CSS3动画**：流畅的交互效果

## 🎨 颜色系统

### 主色调
```css
:root {
    --primary-color: #6366f1;      /* 主要品牌色 - 靛蓝 */
    --primary-dark: #4f46e5;       /* 主色深色变体 */
    --secondary-color: #8b5cf6;    /* 次要色 - 紫色 */
}
```

### 功能色彩
```css
:root {
    --success-color: #10b981;      /* 成功/上班状态 - 绿色 */
    --warning-color: #f59e0b;      /* 警告/休息状态 - 橙色 */
    --danger-color: #ef4444;       /* 危险/删除操作 - 红色 */
    --info-color: #3b82f6;         /* 信息/导出功能 - 蓝色 */
}
```

### 中性色彩
```css
:root {
    --light-bg: #f8fafc;           /* 浅色背景 */
    --card-bg: #ffffff;            /* 卡片背景 */
    --text-primary: #1e293b;       /* 主要文字 */
    --text-secondary: #64748b;     /* 次要文字 */
    --border-color: #e2e8f0;       /* 边框颜色 */
}
```

### 阴影系统
```css
:root {
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

## 🔤 字体系统

### 字体族
```css
font-family: 'Inter', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 字体大小层级
```css
/* 标题层级 */
h1: 2rem (32px)           /* 主标题 */
h2: 1.125rem (18px)       /* 区域标题 */
h3: 0.9375rem (15px)      /* 卡片标题 */

/* 正文层级 */
body: 1rem (16px)         /* 标准正文 */
small: 0.875rem (14px)    /* 按钮文字 */
caption: 0.8125rem (13px) /* 说明文字 */
tiny: 0.75rem (12px)      /* 移动端小字 */
```

### 字重规范
```css
font-weight: 300;  /* Light - 辅助信息 */
font-weight: 400;  /* Regular - 正文内容 */
font-weight: 500;  /* Medium - 次要标题 */
font-weight: 600;  /* SemiBold - 主要标题 */
font-weight: 700;  /* Bold - 重要标题 */
```

## 📏 间距系统

### 圆角规范
```css
:root {
    --radius-sm: 0.375rem (6px);   /* 小圆角 - 表格单元格 */
    --radius-md: 0.5rem (8px);     /* 中圆角 - 按钮 */
    --radius-lg: 0.75rem (12px);   /* 大圆角 - 卡片 */
    --radius-xl: 1rem (16px);      /* 超大圆角 - 容器 */
}
```

### 间距规范
```css
/* 内边距 (padding) */
xs: 0.25rem (4px)    /* 极小间距 */
sm: 0.5rem (8px)     /* 小间距 */
md: 0.75rem (12px)   /* 中间距 */
lg: 1rem (16px)      /* 大间距 */
xl: 1.25rem (20px)   /* 超大间距 */
2xl: 1.5rem (24px)   /* 特大间距 */

/* 外边距 (margin) */
gap-sm: 0.5rem (8px)     /* 小间隙 */
gap-md: 1rem (16px)      /* 中间隙 */
gap-lg: 1.5rem (24px)    /* 大间隙 */
```

## 🧩 组件规范

### 按钮组件
```css
/* 基础按钮样式 */
.btn-base {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* 按钮变体 */
.btn-primary { background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); }
.btn-success { background: linear-gradient(135deg, var(--success-color), #059669); }
.btn-warning { background: linear-gradient(135deg, var(--warning-color), #d97706); }
.btn-danger { background: linear-gradient(135deg, var(--danger-color), #dc2626); }
.btn-info { background: linear-gradient(135deg, var(--info-color), #2563eb); }
```

### 卡片组件
```css
.card {
    background: var(--card-bg);
    padding: 1rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}
```

### 表格组件
```css
.table {
    width: 100%;
    border-collapse: collapse;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
}

.table th {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 0.75rem 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
}

.table td {
    border: 1px solid var(--border-color);
    padding: 0.75rem 0.5rem;
    min-height: 3rem;
    background: var(--card-bg);
}
```

### 状态指示器
```css
.status-work {
    background: linear-gradient(135deg, var(--success-color), #059669);
    color: white;
    box-shadow: var(--shadow-sm);
}

.status-rest {
    background: linear-gradient(135deg, var(--warning-color), #d97706);
    color: white;
    box-shadow: var(--shadow-sm);
}
```

## 📐 布局规范

### 容器规范
```css
.container {
    max-width: 1400px;
    margin: 0 auto;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 区域布局
```css
/* 头部区域 */
.header {
    padding: 1.25rem;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    text-align: center;
}

/* 内容区域 */
.content-area {
    padding: 1.25rem;
    background: var(--light-bg);
    border-bottom: 1px solid var(--border-color);
}

/* 底部区域 */
.footer-area {
    padding: 1.25rem;
    background: var(--light-bg);
    border-top: 1px solid var(--border-color);
}
```

### 网格系统
```css
/* Flexbox 布局 */
.flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}
```

## 🎭 交互规范

### 悬停效果
```css
.interactive:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}
```

### 点击反馈
```css
.clickable:active {
    transform: translateY(0);
    transition: transform 0.1s;
}
```

### 光泽效果
```css
.shimmer::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.shimmer:hover::before {
    left: 100%;
}
```

### 拖拽状态
```css
.drag-over {
    background-color: #dbeafe;
    border: 2px dashed var(--info-color);
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
}
```

## 📱 响应式规范

### 断点系统
```css
/* 移动端 */
@media (max-width: 768px) {
    body { padding: 0.5rem; }
    .container { margin: 0; border-radius: var(--radius-md); }
    .header { padding: 1rem; }
    .content-area { padding: 1rem; }
}
```

### 移动端适配
```css
@media (max-width: 768px) {
    /* 字体缩放 */
    h1 { font-size: 1.75rem; }
    .btn { padding: 0.625rem 1.25rem; font-size: 0.8125rem; }
    
    /* 间距调整 */
    .gap-lg { gap: 0.75rem; }
    .gap-md { gap: 0.5rem; }
    
    /* 表格适配 */
    .table { min-width: 600px; }
    .table th, .table td { padding: 0.5rem 0.25rem; font-size: 0.75rem; }
}
```

## 🎯 图标规范

### 图标库
- **Font Awesome 6.4.0**：主要图标库
- **尺寸规范**：
  - 小图标：0.875rem (14px)
  - 标准图标：1rem (16px)
  - 大图标：1.125rem (18px)
  - 标题图标：1.75rem (28px)

### 常用图标映射
```css
/* 功能图标 */
.icon-calendar: fa-calendar-alt     /* 排班/日历 */
.icon-drag: fa-hand-paper          /* 拖拽操作 */
.icon-work: fa-briefcase           /* 上班状态 */
.icon-rest: fa-bed                 /* 休息状态 */
.icon-magic: fa-magic              /* 智能功能 */
.icon-dice: fa-dice                /* 随机生成 */
.icon-users: fa-users              /* 团队/组织 */
.icon-palette: fa-palette          /* 设计/美工 */
.icon-list: fa-clipboard-list      /* 规则/列表 */
.icon-trash: fa-trash-alt          /* 删除操作 */
.icon-excel: fa-file-excel         /* Excel导出 */
.icon-save: fa-save                /* 保存功能 */
```

## 🔄 动画规范

### 过渡动画
```css
/* 标准过渡 */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* 快速过渡 */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* 缓慢过渡 */
transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

### 关键帧动画
```css
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.pulse-animation {
    animation: pulse 2s infinite;
}
```

---

## 📝 使用指南

### 1. 新项目初始化
1. 引入必要的外部资源（Font Awesome、Google Fonts、SheetJS）
2. 复制CSS变量系统到项目中
3. 按照组件规范构建UI组件

### 2. 颜色使用原则
- 主色调用于品牌元素和主要操作
- 功能色彩用于状态指示和操作反馈
- 中性色彩用于背景和文字

### 3. 间距使用原则
- 保持一致的间距比例
- 移动端适当减少间距
- 重要元素使用更大间距突出层次

### 4. 组件复用
- 优先使用已定义的组件样式
- 保持组件的一致性和可维护性
- 新组件应遵循现有设计规范

## 🛠 实用代码片段

### HTML结构模板
```html
<!-- 标准页面结构 -->
<div class="container">
    <!-- 头部区域 -->
    <div class="header">
        <h1><i class="fas fa-calendar-alt"></i> 系统标题</h1>
        <p>系统描述信息</p>
    </div>

    <!-- 操作区域 -->
    <div class="content-area">
        <div class="section-title">
            <i class="fas fa-magic"></i>
            区域标题
        </div>
        <div class="controls">
            <!-- 控制组件 -->
        </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-area">
        <!-- 主要内容 -->
    </div>

    <!-- 底部操作区域 -->
    <div class="footer-area">
        <div class="action-buttons">
            <!-- 操作按钮 -->
        </div>
    </div>
</div>
```

### 按钮组件模板
```html
<!-- 主要操作按钮 -->
<button class="btn btn-primary">
    <i class="fas fa-magic"></i>
    <span>主要操作</span>
</button>

<!-- 危险操作按钮 -->
<button class="btn btn-danger">
    <i class="fas fa-trash-alt"></i>
    <span>删除操作</span>
</button>

<!-- 信息操作按钮 -->
<button class="btn btn-info">
    <i class="fas fa-file-excel"></i>
    <span>导出数据</span>
</button>
```

### 表格组件模板
```html
<table class="table">
    <thead>
        <tr>
            <th>列标题1</th>
            <th>列标题2</th>
            <!-- 更多列 -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="cell-name">数据1</td>
            <td>
                <div class="cell-content status-work">
                    <i class="fas fa-briefcase"></i>
                    上班
                </div>
            </td>
        </tr>
    </tbody>
</table>
```

### 卡片组件模板
```html
<div class="card">
    <div class="card-title">
        <i class="fas fa-users"></i>
        卡片标题
    </div>
    <div class="card-content">
        卡片内容
    </div>
</div>
```

## 🎨 主题定制指南

### 自定义颜色主题
```css
/* 蓝色主题 */
:root {
    --primary-color: #3b82f6;
    --primary-dark: #2563eb;
    --secondary-color: #06b6d4;
}

/* 绿色主题 */
:root {
    --primary-color: #10b981;
    --primary-dark: #059669;
    --secondary-color: #34d399;
}

/* 紫色主题 */
:root {
    --primary-color: #8b5cf6;
    --primary-dark: #7c3aed;
    --secondary-color: #a78bfa;
}
```

### 深色模式适配
```css
@media (prefers-color-scheme: dark) {
    :root {
        --light-bg: #1f2937;
        --card-bg: #374151;
        --text-primary: #f9fafb;
        --text-secondary: #d1d5db;
        --border-color: #4b5563;
    }
}
```

## 📋 组件清单

### 必需组件
- [x] 容器组件 (Container)
- [x] 头部组件 (Header)
- [x] 按钮组件 (Button)
- [x] 卡片组件 (Card)
- [x] 表格组件 (Table)
- [x] 状态指示器 (Status)

### 可选组件
- [x] 拖拽组件 (Drag & Drop)
- [x] 右键菜单 (Context Menu)
- [x] 选择器组件 (Selector)
- [x] 加载状态 (Loading)
- [x] 消息提示 (Message)

## 🔍 质量检查清单

### 视觉一致性
- [ ] 颜色使用符合规范
- [ ] 字体大小层级正确
- [ ] 间距使用一致
- [ ] 圆角规范统一
- [ ] 阴影效果适当

### 交互体验
- [ ] 悬停效果流畅
- [ ] 点击反馈明确
- [ ] 加载状态清晰
- [ ] 错误提示友好
- [ ] 操作流程顺畅

### 响应式适配
- [ ] 移动端布局正常
- [ ] 平板端显示良好
- [ ] 桌面端体验优秀
- [ ] 字体大小适配
- [ ] 触摸操作友好

### 可访问性
- [ ] 颜色对比度充足
- [ ] 键盘导航支持
- [ ] 屏幕阅读器友好
- [ ] 焦点状态明确
- [ ] 语义化标签使用

## 🚀 最佳实践

### 1. 开发流程
1. **设计阶段**：参考UI规范确定视觉风格
2. **开发阶段**：使用组件模板快速构建
3. **测试阶段**：按照质量检查清单验证
4. **优化阶段**：根据用户反馈持续改进

### 2. 代码组织
```
styles/
├── variables.css      # CSS变量定义
├── base.css          # 基础样式
├── components.css    # 组件样式
├── layout.css        # 布局样式
├── responsive.css    # 响应式样式
└── animations.css    # 动画效果
```

### 3. 性能优化
- 使用CSS变量减少重复代码
- 合理使用CSS动画和过渡
- 优化图标加载和缓存
- 压缩CSS文件大小

### 4. 维护建议
- 定期更新设计规范
- 收集用户反馈优化体验
- 保持组件库的一致性
- 文档化所有变更

---

## 📞 技术支持

### 常见问题
1. **Q: 如何自定义主题颜色？**
   A: 修改CSS变量中的颜色值即可实现主题定制

2. **Q: 移动端适配有问题怎么办？**
   A: 检查响应式断点设置和移动端专用样式

3. **Q: 如何添加新的组件？**
   A: 参考现有组件规范，保持设计一致性

### 更新日志
- **v1.0.0** (2025-6): 初始版本发布
- 包含完整的设计系统和组件规范
- 支持响应式设计和主题定制

---

**版本信息：** v1.0.0
**创建日期：** 2025年6月
**适用项目：** 排班系统、管理系统、企业应用
**维护者：** 开发团队
**文档类型：** UI设计规范
**更新频率：** 根据项目需求定期更新
