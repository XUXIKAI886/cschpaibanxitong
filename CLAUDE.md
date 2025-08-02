# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于HTML5的智能排班管理系统，包含三个核心模块：

1. **导航系统首页** (`index.html`) - 统一的系统导航入口
2. **运营部排班系统** (`排班表系统.html`) - 智能排班算法和拖拽操作
3. **销售部大扫除系统** (`销售部大扫除安排表.html`) - 清洁任务分配管理

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
├── cschpaibanxitong/                 # 备份文件夹
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

## 团队配置

### 运营部人员
```javascript
const operationGroup = ['王郡江', '杨有淇', '张玉莲'];
const designGroup = ['王涛', '单龙龙', '曾衡'];
```

### 销售部人员
```javascript
const salesEmployees = [
    '韩大武', '赵永鸿', '梁智', '屈维涛', '胡双双',
    '朱雯雯', '陈吉姝', '陶思雨', '吴思湘', '蒋序楚', '冯姗姗'
];
```

## 排班规则配置

### 特殊排班规则
- **星期天规则**: 固定1个运营+1个美工（2人总数）
- **2天互补规则**: 选择2天排班时，每人恰好工作1天休息1天
- **大扫除规则**: 星期六有人上班时自动分配清洁任务（2人拖地+1人扫地+1人擦桌子）

### 可配置参数
```javascript
// 排班人数配置
const sundayWorkCount = 2;  // 星期天上班人数
const normalWorkRange = [2, 5];  // 常规排班人数范围

// 大扫除任务配置
const cleaningTasks = [
    { name: '拖地', maxCount: 2, icon: 'fas fa-hand-sparkles' },
    { name: '扫地', maxCount: 1, icon: 'fas fa-broom' },
    { name: '擦桌子', maxCount: 1, icon: 'fas fa-spray-can' }
];
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

## 常见任务

### 修改员工名单
1. 编辑对应HTML文件中的JavaScript部分
2. 修改`operationGroup`、`designGroup`或`salesEmployees`数组
3. 保存文件即可生效

### 调整排班规则
1. 找到`generateTwoDaySchedule()`或`generateRegularSchedule()`函数
2. 修改相关算法逻辑
3. 测试新规则是否符合预期

### 自定义大扫除任务
1. 编辑`cleaningTasks`配置数组
2. 修改任务名称、图标、人数限制
3. 更新对应的分配算法

### 添加新功能模块
1. 参考现有HTML文件结构
2. 使用统一的CSS变量系统
3. 遵循响应式设计原则
4. 确保返回首页功能正常

## 故障排除

### 常见问题
1. **拖拽不工作**: 检查浏览器是否支持HTML5拖拽API
2. **Excel导出失败**: 确认SheetJS库正常加载
3. **字体显示异常**: 检查Google Fonts网络连接
4. **数据丢失**: 检查localStorage是否被清理

### 调试技巧
- 使用浏览器开发者工具查看控制台错误
- 检查网络面板确认外部资源加载
- 使用localStorage查看器检查数据存储
- 在移动端使用远程调试功能

## UI设计规范

参考`UI设计规范文档.md`获取完整的设计系统说明，包括：
- 颜色系统和主题配置
- 组件规范和使用指南  
- 响应式设计断点
- 动画和交互效果规范