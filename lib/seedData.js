const seedCompanies = [
  {
    key: 'wuhan',
    name: '武汉公司',
    subtitle: '武汉清洁任务分配系统',
    storageKey: 'whClean2',
    employees: [
      '王娟', '王盼', '李梓萱', '向文强',
      '武力力', '柯松', '韩大武', '张兴岚',
      '李晨雨', '阳莲心', '屈维涛', '肖锐',
      '盛亚娥', '罗鹰', '张新业'
    ],
    areas: [
      { name: '办公区', tasks: [{ name: '地面吸尘' }, { name: '擦桌椅及摆放' }, { name: '擦饮水机' }, { name: '擦冰箱及清理' }] },
      { name: '财务办公室', tasks: [{ name: '洗茶具' }, { name: '擦桌椅、沙发及物品归位' }, { name: '地面吸尘' }] },
      { name: '会议室', tasks: [{ name: '地面吸尘' }, { name: '擦桌椅及摆放' }] },
      { name: '人事办公室', tasks: [{ name: '人事办公室清洁（固定：盛亚娥）' }] },
      { name: '其它', tasks: [{ name: '绿植浇水（换水）' }] },
      { name: '休息区', tasks: [{ name: '擦荣誉墙' }, { name: '擦桌椅及摆放' }, { name: '地面吸尘' }] }
    ],
    fixedAssignments: [
      { areaName: '人事办公室', taskName: '人事办公室清洁（固定：盛亚娥）', employeeName: '盛亚娥' }
    ]
  },
  {
    key: 'yichang',
    name: '宜昌公司',
    subtitle: '宜昌清洁任务分配系统',
    storageKey: 'ycClean2',
    employees: [
      '胡双双', '王涛', '梁智', '朱文雯',
      '王清月', '陶思雨', '杨有淇', '冯杉杉',
      '吴思湘', '陈吉姝', '袁丽妮',
      '陈冉', '徐晓辉', '秦金城',
      '赵春艳', '周广鑫', '周红莲'
    ],
    areas: [
      { name: '大厅', tasks: [{ name: '扫地' }, { name: '拖地（第1人）' }, { name: '拖地（第2人）' }, { name: '擦桌椅墙饰饮水机（第1人）' }, { name: '擦桌椅墙饰饮水机（第2人）' }] },
      { name: '总经理室', tasks: [{ name: '洗茶具，擦桌椅' }, { name: '擦所有玻璃' }, { name: '扫地拖地' }] },
      { name: '会议室，仓库，贵宾室', tasks: [{ name: '扫地及凳子摆放整齐' }, { name: '擦桌椅门窗及微波炉' }, { name: '拖地' }] },
      { name: '前台', tasks: [{ name: '前台清洁（固定：吴思湘）' }] },
      { name: '其他', tasks: [{ name: '绿植浇水，换垃圾袋' }] },
      { name: '大厅角落', tasks: [{ name: '大厅角落清洁（固定：徐晓辉）' }] }
    ],
    fixedAssignments: [
      { areaName: '前台', taskName: '前台清洁（固定：吴思湘）', employeeName: '吴思湘' },
      { areaName: '大厅角落', taskName: '大厅角落清洁（固定：徐晓辉）', employeeName: '徐晓辉' }
    ]
  }
];

const seedScheduleSystem = {
  key: 'operations',
  name: '排班表系统',
  storageKey: 'schedule_v2',
  employees: ['杨有淇', '陈吉舒', '王涛', '王清月', '袁丽妮', '陈冉'],
  dayNames: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期天'],
  defaultSelectedDayIndexes: [5, 6],
  rules: {
    sundayWorkCount: 2,
    twoDayComplement: true
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSeedCompanies() {
  return clone(seedCompanies);
}

function getSeedScheduleSystem() {
  return clone(seedScheduleSystem);
}

module.exports = {
  getSeedCompanies,
  getSeedScheduleSystem
};
