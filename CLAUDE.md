# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个纯前端的智能排班管理系统,采用单文件HTML架构。每个HTML文件都是自包含的完整应用,无需构建工具或后端服务。

### 核心模块
1. **index.html** - 导航系统首页,提供统一入口
2. **排班表系统.html** - 运营部排班系统(7人,智能互补算法)
3. **销售部大扫除安排表.html** - 公司清洁任务分配系统(23人,20任务)

## 如何运行

这是纯静态HTML项目,无需安装依赖:

```bash
# 方法1:直接用浏览器打开任意HTML文件

# 方法2:使用本地服务器(推荐,避免CORS问题)
python -m http.server 8000
# 访问 http://localhost:8000/

# 方法3:VS Code Live Server
# 右键HTML文件 -> Open with Live Server
```

## 架构设计

### 单文件架构
每个HTML文件包含完整的应用逻辑:
- `<style>` 标签内的CSS(约800行)
- `<script>` 标签内的JavaScript(约600-1000行)
- 所有依赖通过CDN加载(Font Awesome, Google Fonts, SheetJS)

### 外部依赖
```html
<!-- 图标库 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- 字体系统 -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Excel导出(仅排班系统使用) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

### 数据持久化
使用`localStorage`保存数据,格式如下:
```javascript
// 排班系统数据结构
{
  "schedule_timestamp": {
    "员工姓名": {
      "星期一": "上班",
      "星期二": "休息",
      // ...
    }
  }
}

// 大扫除系统数据结构
{
  "cleaning_assignments": {
    "大厅-扫地-1": "胡双双",
    "总经理室-洗茶具": "王涛",
    // ...
  },
  "rest_employees": ["张三", "李四"]
}
```

## 核心算法实现

### 1. 排班系统:2天互补排班算法

**位置**: `排班表系统.html` 中的 `generateTwoDaySchedule()` 函数(约1237行)

**核心逻辑**:
```javascript
// 第一步:处理星期天特殊规则
// - 从运营组随机选1人
// - 从美工组随机选1人
const sundayWorkers = [randomOperation, randomDesign]; // 共2人

// 第二步:应用互补原则
// - 星期天上班的人 → 另一天必须休息
// - 星期天休息的人 → 另一天必须上班
const otherDayWorkers = employees.filter(emp => !sundayWorkers.includes(emp));

// 第三步:验证规则
// - 每人恰好工作1天,休息1天
// - 星期天恰好2人上班
```

**关键约束**:
- 星期天永远只有2人上班(1运营+1美工)
- 选择2天排班时,每人工作天数和休息天数必须相等
- 严格的互补原则:A天上班→B天休息,A天休息→B天上班

### 2. 大扫除系统:右键菜单分配

**位置**: `销售部大扫除安排表.html` 中的 `handleContextMenu()` 和相关函数

**交互流程**:
```
1. 右键点击人员标签 → 显示上下文菜单
2. 选择"分配到任务" → 高亮所有可用任务格
3. 点击目标任务格 → 完成分配,从拖拽区移除该人员
4. 双击已分配任务格 → 删除分配,人员返回拖拽区
```

**固定分配规则**:
```javascript
// 在 setFixedAssignment() 中定义
{
  "前台-前台清洁-1": "吴思湘",    // 吴思湘固定负责前台
  "大厅角落-大厅角落清洁-1": "徐晓辉"  // 徐晓辉固定负责大厅角落
}
```

## 人员配置(当前版本)

### 运营部排班系统(7人)
```javascript
// 位置:排班表系统.html 约第982-984行
const employees = ['王郡江', '杨有淇', '张玉莲', '彭润梅', '王涛', '王清月', '曾衡'];
const operationGroup = ['王郡江', '杨有淇', '张玉莲', '彭润梅']; // 运营组4人
const designGroup = ['王涛', '王清月', '曾衡']; // 美工组3人
```

### 公司大扫除系统(23人)
```javascript
// 位置:销售部大扫除安排表.html 约第834-838行
const companyEmployees = [
    '胡双双', '韩大武', '王涛', '赵永鸿', '梁智', '朱文雯',
    '王清月', '王郡江', '陶思雨', '杨有淇', '蒋序楚', '冯杉杉',
    '曾衡', '吴思湘', '陈吉姝', '屈维涛', '袁丽妮',
    '向文强', '陈冉', '张玉莲', '徐晓辉', '彭润梅', '左冉'
]; // 总计23人

// 清洁任务配置:8个区域,20个具体任务
// 固定分配:吴思湘→前台,徐晓辉→大厅角落
```

**注意**:已删除离职人员"孙文龙"、"朱春玖"、"魏祯宇"、"田昊",已添加新员工"左冉",当前为23人配置。

## 修改人员配置

### 修改排班系统人员
1. 打开 `排班表系统.html`
2. 找到约第982-984行的人员数组
3. 修改 `employees`, `operationGroup`, `designGroup` 数组
4. 保存后刷新浏览器即可生效

### 修改大扫除系统人员
1. 打开 `销售部大扫除安排表.html`
2. 找到约第834-838行的 `companyEmployees` 数组
3. 添加或删除人员姓名
4. 更新页面标题中的员工数量说明(约第710行)
5. 如需修改固定分配,编辑 `setFixedAssignment()` 函数
6. 保存后刷新浏览器即可生效

## CSS设计系统

所有系统使用统一的CSS变量:

```css
:root {
    --primary-color: #6366f1;      /* 主品牌色 */
    --success-color: #10b981;      /* 上班状态 */
    --warning-color: #f59e0b;      /* 休息状态 */
    --danger-color: #ef4444;       /* 删除操作 */
    --radius-md: 0.5rem;           /* 圆角 */
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

修改主题色时,搜索 `:root` 并修改对应的CSS变量值。

## 核心函数索引

### 排班系统(`排班表系统.html`)
| 函数名 | 位置(约) | 功能描述 |
|--------|---------|---------|
| `initScheduleTable()` | 990行 | 初始化7x7排班表格 |
| `generateTwoDaySchedule()` | 1237行 | **2天互补排班核心算法** |
| `generateRegularSchedule()` | 1387行 | 常规随机排班算法 |
| `setScheduleStatus()` | 1109行 | 设置单元格状态(上班/休息/清空) |
| `exportToExcel()` | 1461行 | 导出Excel排班表 |
| `handleDragDrop()` | 1096行 | 处理拖拽放置事件 |

### 大扫除系统(`销售部大扫除安排表.html`)
| 函数名 | 位置(约) | 功能描述 |
|--------|---------|---------|
| `initCleaningTable()` | 938行 | 初始化清洁任务表格 |
| `handleContextMenu()` | 1067行 | **右键菜单核心逻辑** |
| `setAssignment()` | 1017行 | 设置任务分配 |
| `randomAssignTasks()` | 1403行 | 随机分配所有任务 |
| `setFixedAssignment()` | 891行 | 设置固定分配(吴思湘、徐晓辉) |
| `exportToExcel()` | 1493行 | 导出Excel任务分配表 |

## 常见开发任务

### 添加新员工
1. 找到对应HTML文件中的人员数组(见"人员配置"章节)
2. 在数组末尾添加新员工姓名
3. 排班系统需同时更新 `employees` 和对应的组数组
4. 保存并刷新浏览器测试

### 修改排班规则
1. 找到 `generateRandomSchedule()` 函数(排班系统约1196行)
2. 修改星期天人数限制:`sundayWorkCount = 2`
3. 修改常规排班人数:`workCount = Math.floor(Math.random() * 4) + 2`
4. 测试时注意验证2天互补算法的约束条件

### 添加新清洁任务
1. 打开 `销售部大扫除安排表.html`
2. 找到 `cleaningAreas` 对象(约第793行)
3. 在对应区域的 `tasks` 数组中添加新任务
4. 任务总数会自动更新到界面

### 自定义主题颜色
1. 搜索 `:root` (约第21行)
2. 修改CSS变量值
3. 建议同时修改所有三个HTML文件保持一致性

## 技术限制与注意事项

### 浏览器兼容性
- 需要Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- 必须支持HTML5 Drag and Drop API
- 必须支持localStorage

### 数据安全性
- 所有数据存储在浏览器localStorage中
- 清除浏览器数据会导致排班记录丢失
- 建议定期使用"导出Excel"功能备份数据

### 性能考虑
- 单文件HTML约1500-2000行,加载速度快
- 拖拽操作在移动端可能不够流畅
- localStorage有5-10MB存储限制

### 文件编码
- 所有HTML文件必须使用UTF-8编码
- 支持中文文件名和路径
- 在Windows系统上开发时注意文件路径分隔符

## 调试技巧

### 查看排班算法日志
2天互补排班算法会输出详细的控制台日志:
```javascript
console.log('=== 开始2天互补排班算法 ===');
// ... 详细的排班过程日志
console.log('=== 排班验证 ===');
// ... 验证结果
```
打开浏览器开发者工具(F12)查看Console面板。

### 检查localStorage数据
```javascript
// 在浏览器控制台执行
localStorage.getItem('latest_schedule')  // 查看最新排班
localStorage.getItem('cleaning_assignments')  // 查看大扫除分配
```

### 测试排班算法
在排班系统中:
1. 勾选"星期六"+"星期天"
2. 点击"生成随机排班"
3. 打开控制台查看验证日志
4. 确认每人恰好工作1天休息1天
