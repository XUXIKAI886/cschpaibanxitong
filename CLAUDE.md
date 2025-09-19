# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于HTML5的智能排班管理系统，采用纯前端架构，包含三个核心模块：

1. **导航系统首页** (`index.html`) - 统一的系统导航入口
2. **运营部排班系统** (`排班表系统.html`) - 智能排班算法和拖拽操作
3. **公司大扫除系统** (`销售部大扫除安排表.html`) - 清洁任务分配管理

## 技术架构

### 前端技术栈
- **框架**: 原生HTML5 + CSS3 + JavaScript (ES6+)
- **字体系统**: Google Fonts (Noto Sans SC + Inter)
- **图标库**: Font Awesome 6.4.0 
- **拖拽功能**: HTML5 Drag and Drop API
- **数据导出**: SheetJS (xlsx) 库
- **数据存储**: localStorage（浏览器本地存储）
- **样式系统**: CSS Grid + Flexbox + CSS变量 + 渐变动画

### 核心功能模块
- **智能排班算法**: 支持2天互补排班、星期天特殊规则
- **拖拽式操作**: 直观的拖拽界面进行排班调整
- **大扫除管理**: 星期六自动生成清洁任务分配
- **数据导出**: Excel格式排班表和任务分配表导出
- **响应式设计**: 完美适配桌面、平板和移动设备

## 常用开发命令

由于这是纯前端项目，无需特殊构建命令，直接运行即可：

```bash
# 方法1：直接双击HTML文件在浏览器中打开
# 方法2：使用Python本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000/

# 方法3：使用VS Code Live Server扩展
# 右键HTML文件 -> Open with Live Server
```

## 核心文件结构

```
智能排班管理系统/
├── index.html                        # 导航系统首页
├── 排班表系统.html                    # 运营部排班系统
├── 销售部大扫除安排表.html            # 销售部大扫除系统
├── cschpaibanxitong/                 # 备份文件夹（如果存在）
│   ├── index.html
│   ├── 排班表系统.html
│   └── 销售部大扫除安排表.html
├── README.md                         # 详细文档
├── UI设计规范文档.md                  # UI设计规范
└── CLAUDE.md                         # 本文件
```

## 关键技术实现

### 排班算法核心函数
- `generateRandomSchedule()` - 主排班生成函数
- `generateTwoDaySchedule()` - 2天互补排班算法（确保每人工作1天休息1天）
- `generateRegularSchedule()` - 常规排班算法
- `assignCleaningTasks()` - 大扫除任务自动分配算法

### 数据管理核心函数
- `exportToExcel()` - Excel导出功能（使用SheetJS）
- `setScheduleStatus()` - 设置排班状态
- `getSaturdayWorkers()` - 获取星期六工作人员

### 拖拽功能核心函数
- `handleDragStart()` - 拖拽开始处理
- `handleDrop()` - 拖拽放置处理
- `setAssignment()` - 任务分配设置

## 配置与规则

### 团队人员配置
运营部人员存储在各HTML文件的JavaScript部分：
- **运营组**: `operationGroup` 数组（4人）
- **美工组**: `designGroup` 数组（3人） 
- **公司人员**: `companyEmployees` 数组（23人）

### 排班业务规则
- **星期天**: 固定1运营+1美工（总计2人）
- **2天互补**: 选择2天时每人工作1天休息1天
- **大扫除**: 星期六上班时自动分配清洁任务
- **人数范围**: 常规排班2-5人

### 配置修改方法
```javascript
// 修改人员名单 - 编辑对应HTML文件中的JavaScript数组
// 修改排班参数 - 调整 sundayWorkCount 等常量
// 自定义大扫除任务 - 修改 cleaningTasks 配置
```

## CSS设计系统

项目使用统一的CSS变量系统，支持主题定制：

```css
:root {
    --primary-color: #6366f1;      /* 主品牌色 */
    --success-color: #10b981;      /* 成功/上班状态 */
    --warning-color: #f59e0b;      /* 警告/休息状态 */
    --radius-md: 0.5rem;           /* 标准圆角 */
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

## 开发注意事项

### 文件编码
- 所有HTML文件使用UTF-8编码
- 支持中文文件名和路径

### 浏览器兼容性
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- 需要HTML5拖拽API支持
- 需要localStorage支持

### 响应式断点
```css
/* 移动端适配 */
@media (max-width: 768px) {
    /* 移动端样式调整 */
}
```

### 数据格式
- 排班数据存储格式：`{employeeName: {day: status}}`
- 任务分配数据格式：`{taskId: employeeName}`
- 状态值：`'work'`（上班）、`'rest'`（休息）、`null`（未安排）

## 常见开发任务

### 修改员工名单
在对应HTML文件的`<script>`部分找到相关数组并修改：
- 运营部系统：修改`operationGroup`（当前4人）、`designGroup`（当前3人）
- 大扫除系统：修改`companyEmployees`（当前23人）

### 调整排班算法
核心算法函数位于`排班表系统.html`：
- `generateTwoDaySchedule()` - 2天互补排班
- `generateRegularSchedule()` - 常规随机排班
- 测试时注意验证特殊规则（星期天2人限制等）

### 自定义UI样式
所有系统使用统一的CSS变量系统，修改时保持一致性：
- 主色调：`--primary-color`
- 功能色：`--success-color`, `--warning-color`等
- 详细规范参考`UI设计规范文档.md`

## 故障排除

### 常见问题
- **拖拽失效**: 检查HTML5拖拽API支持
- **导出失败**: 验证SheetJS库加载状态
- **字体异常**: 确认Google Fonts网络访问
- **数据丢失**: 检查localStorage权限和存储空间