# xl_calculator_tool - 星落角色数值计算器

一款面向手游《星落》的浏览器端角色属性计算器，可精确计算角色在配置不同养成系统后的最终属性面板。

## 运行方式

1. 运行 `start.bat`（通过 `npx serve` 启动本地 HTTP 服务器）
2. 浏览器访问 `http://localhost:3000`

> 直接打开 `index.html` 会因浏览器 CORS 策略导致 JSON 数据加载失败，需通过 HTTP 服务器运行。

## 功能特性

### 角色属性计算
综合以下养成系统，计算角色的 13 种属性（生命、攻击、防御、暴击率、暴击伤害、格挡率、格挡强度、闪避、移速、攻速、攻击距离、治疗加成等）：

- **等级与突破**：5 个突破层级（突破 0-4），对应等级上限 30/40/60/90/120
- **被动技能**：每角色最多 3 个被动技能（等级 0-3），含加算与百分比乘算属性
- **觉醒技能**：每角色最多 5 个觉醒技能，按顺序激活
- **徽章系统**：11 个套装（2 件套 + 3 件套效果），3 个部位，主属性 + 4 条副属性
- **刻印系统**：4 职业（坚甲/异刃/言灵/猎影），大刻印（等级 + 段位）+ 小刻印（3 槽位）
- **事迹星级**：0-999 星，每 5 星为一个周期的属性加成

### 辅助功能
- **角色筛选**：按星级、职业、元素属性过滤角色
- **属性来源展示**：可切换显示每种属性由哪个养成系统贡献
- **数据来源于游戏**：所有数据通过 Lua 源文件转换而来，与游戏内数值一致

## 项目结构

```
xl_calculator_tool/
├── index.html                # 主页面
├── css/style.css             # 样式（深色主题 + 毛玻璃效果）
├── js/
│   ├── main.js               # 主入口，状态管理与事件绑定
│   ├── dataLoader.js         # JSON 数据异步加载
│   ├── calculator.js         # 核心属性计算引擎
│   ├── charUI.js             # 角色选择 UI
│   ├── badgeUI.js            # 徽章系统 UI
│   ├── sealUI.js             # 刻印系统 UI
│   ├── skillUI.js            # 技能系统 UI
│   └── uiUtils.js            # 通用 UI 工具
├── data/
│   ├── characters_base.json  # 角色基础属性 (53 个角色)
│   ├── level_up.json         # 等级成长数据
│   ├── quality_up.json       # 突破加成数据
│   ├── skill_level_up.json   # 技能等级数据
│   ├── badge_config.json     # 徽章配置数据
│   └── seal_data.json        # 刻印系统数据
├── assets/
│   ├── badge/                # 徽章图标
│   ├── card/                 # 角色头像
│   ├── seal/                 # 刻印素材
│   └── grow&passive/         # 技能图标
├── 批量处理脚本/
│   ├── lua_to_json.py        # Lua 数据转 JSON
│   ├── convert_seal.py       # 刻印数据转换
│   ├── run.bat               # 一键运行转换脚本
│   └── *.lua.lua             # 游戏原始 Lua 数据文件
└── start.bat                 # 启动本地服务器
```

## 数据维护

`批量处理脚本/` 目录下的 Python 脚本用于将游戏原始 Lua 数据转换为应用所需的 JSON 格式：

```bash
cd 批量处理脚本
run.bat
```

这会依次执行 `lua_to_json.py` 和 `convert_seal.py`，生成 `data/` 目录下的 JSON 文件。

## 技术栈

- 原生 HTML5 + CSS3 + JavaScript（ES6 模块，无框架）
- 无后端，所有数据由静态 JSON 文件提供
- Python 3（数据转换脚本）
