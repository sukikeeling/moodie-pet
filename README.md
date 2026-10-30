# 🐾 Moodie Pet / Sonnet Bot v2.0 — 系统感知伴侣 · 四主题大一统

<div align="center">

> **从「定时表情」跃迁为「系统感知伴侣」**  
> **四大主题分身（🌈 彩色可爱 / ⚫ Sonnet 极简 / 🏺 3D 骨瓷天使球 / 🫧 深海驾驶舱全息球）**  
> **本地 HTTP REST + RFC 6455 WebSocket 实时系统与 Agent 感知引擎 (`127.0.0.1:17530`)**  
> **8 大人工盯帧连贯动作 · 压感彩色蜡笔流星与环绕引擎 · 贝塞尔弹簧 Morph · 透明置顶 · 桌面穿透**

[![Version](https://img.shields.io/badge/Version-v2.0.0%20(System%20Companion)-ff5d9e?style=for-the-badge&logo=electron)](https://github.com/sukikeeling/moodie-pet/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%20Portable%20(.exe)-success?style=for-the-badge&logo=windows)](https://github.com/sukikeeling/moodie-pet/releases)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20r184%20(WebGL)-000000?style=for-the-badge&logo=threedotjs)](https://github.com/sukikeeling/moodie-pet)
[![Verification](https://img.shields.io/badge/Gate%20Tests-24%2F24%20PASS-brightgreen?style=for-the-badge)](verify.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

![Sonnet Bot](docs/preview.svg)

<br/>

🌐 **[在线试玩预览](https://sukikeeling.github.io/moodie-pet/)** &nbsp;&nbsp; | &nbsp;&nbsp; ⬇️ **[下载 Windows 免安装绿色版 (.exe)](https://github.com/sukikeeling/moodie-pet/releases)** &nbsp;&nbsp; | &nbsp;&nbsp; 🎮 **控制台调试 `window.playAction(1~8)`**

</div>

---

## 🌟 v2.0.0 重磅跃迁：从“定时表情”到“系统感知伴侣”

过去，桌宠主要靠预设的时间间隔随机轮换表情与动作；而在 **v2.0.0** 中，Moodie Pet 正式跃迁为具有**真实环境与 Agent 生产工作流感知能力的桌面智能生命体**：

```
┌───────────────────────────────────────────────────────────────────────────┐
│              外部 Agent / CLI / IDE 编译任务 / 操作系统内核                 │
│     (moodie-cli.js / HTTP POST / WebSocket / CPU差分 & 进程扫描 & 空闲检测)  │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │ 127.0.0.1:17530 (HTTP REST + RFC 6455 WS)
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│         SystemSensorEngine (system-sensor.js · 零依赖原生感知守护)         │
│  • 自动感知：CPU 差分负载、活跃编译进程 (cargo/tsc/vite/pytest/claude...)   │
│  • 状态归一：coding (专注搬砖) | error (异常警告) | sleep (柔光呼吸) | normal│
└─────────────────┬──────────────────────────────────────┬──────────────────┘
                  │ Electron IPC (main.js / preload.js)  │ WebSocket 实时帧广播
                  ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                   Moodie Pet v2.0 统一渲染舞台 (pet.html)                  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 1. 系统感知联动调度器 (applySystemPerception & #system-hud 胶囊)     │  │
│  │  • ⚡ coding → 动作2「向心粒子汇聚」+ working + 利萨如星轨 + 持续聚能 │  │
│  │  • ⚠️ error  → 动作6「感叹号与蓝球警告」+ alerting 红环脉冲 + 蓝球徽章│  │
│  │  • 🌙 sleep  → 新增 .fx-soft-breath 4.2s 暖金薰衣草柔光呼吸 + zzZ   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 2. 四大主题分身无冲突状态机 (applyTheme · 4合1大一统)                │  │
│  │  • 🌈 colorful  : 26表情 × 39状态 × 8大盯帧连贯动作 × 12种几何形变   │  │
│  │  • ⚫ grok      : Sonnet 黑球白眼四元数球面 SDF 投影 + 28 动作 Clips │  │
│  │  • 🏺 ceramic   : Three.js 温润骨瓷球 + 扇动天使羽翼 + 24K金皇冠底座 │  │
│  │  • 🫧 submarine : 深海耐压全息球 + 黄铜铆钉环 + 实时算力/声呐双翼    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### 🧠 1. 深度环境感知与 Agent 工作流联动机制

内置零依赖守护模块 [`system-sensor.js`](system-sensor.js)，提供 **HTTP REST + RFC 6455 WebSocket** 双协议端点（默认 `127.0.0.1:17530`，端口冲突自动顺延），实时感知：

| 感知状态 | 触发条件（自动扫描 / CLI / API / 点击 HUD） | 联动视觉与动作演出 |
| :---: | :--- | :--- |
| **⚡ 专注搬砖<br/>(`coding`)** | 正在敲代码、IDE 活跃、长任务编译 (`cargo` / `rustc` / `tsc` / `vite` / `webpack` / `gradle` / `claude` 等) 或 CPU 高负载 | 自动触发 **动作 2：向心粒子汇聚** + `working` 状态 + 利萨如数学星轨条 + 周期性向心能量粒子脉冲 + 蓝青呼吸 HUD 胶囊 |
| **⚠️ 异常警告<br/>(`error`)** | 任务报错、单元测试挂掉 (`pytest` / `exit code != 0`) 或捕获崩溃诊断进程 | 立即触发 **动作 6：缺口弹蓝球与感叹号** + `alerting` 红色脉冲环 `fx-alert` + 跨主题蓝球与感叹号徽章 + 红色高警 HUD 胶囊 |
| **🌙 柔光呼吸<br/>(`sleep`)** | 系统静止满阈值（默认 3 分钟无操作）或深夜时段（23:30–06:00） | 平滑切换 **「柔光呼吸 / 趴着打呼」**（启用新增 `.fx-soft-breath` 4.2s 正弦暖金薰衣草双层柔光光晕 + `sleeping` 状态 + 漂浮 `zzZ`） |
| **✨ 灵动伴随<br/>(`normal`)** | 系统负载平稳、无高危告警 | 恢复自由伴随与日常 39 心情池自动轮询 |

#### 📡 命令行与外部 Agent 直连（CLI 指南）
```bash
# 1. 查看当前桌宠感知状态与机器遥测 (CPU/内存/活跃开发进程)
node moodie-cli.js status

# 2. 外部任务或 CI 编译中触发「专注搬砖」
node moodie-cli.js coding "正在执行 Vite 生产打包" --task="vite build"

# 3. 测试失败或进程异常退出触发「异常警告」
node moodie-cli.js error "单元测试断言失败 (Exit Code 1)" --task="pytest"

# 4. 夜晚工作结束触发「柔光呼吸打呼」
node moodie-cli.js sleep "深夜静谧陪伴模式"

# 5. 恢复灵动伴随
node moodie-cli.js normal
```

---

### 🎨 2. 四大主题分身大一统（收拢潜水艇全息舱 & 3D 骨瓷天使球）

我们将历史分支项目 `ceramic-bot-3d` 与 `submarine-cabin-bot` 的 Three.js WebGL 3D 资产完整合入主线，编译为零外部网络依赖的自包含包 [`skins-3d.bundle.js`](skins-3d.bundle.js)：

| 主题皮肤 | 呈现风格 | 核心图形资产与物理特性 |
|---|---|---|
| **🌈 彩色可爱<br/>(`colorful`)** | 活力少女风 / 极客桌搭 | 26 表情 × 48 点质心环逐点插值 · 贝塞尔弹簧 Morph · 8 套人工盯帧连贯动作 · 压感彩色蜡笔流星 · 12 种几何形变彩蛋 |
| **⚫ Sonnet 极简<br/>(`grok`)** | 极客暗黑风 | 原版纯黑球体 · 四元数球面 SDF 眼睛逆透视投影 · 28 个原生动作 Clips · 双击行星轨道环绕 |
| **🏺 3D 骨瓷天使球<br/>(`ceramic`)** | 优雅治愈风 | Three.js `MeshPhysicalMaterial` 温润清漆骨瓷球体 · 扇动小天使羽翼 · 24K 金镶钻天使皇冠 · 悬浮魔法圆盘底座 · 160 颗物理星光粒子 |
| **🫧 深海全息舱<br/>(`submarine`)** | 科幻潜航风 | 深海耐压高透玻璃球舱 · 黄铜铆钉经纬加固环 · 底部全息蓝光发射锥 · 左右算力/声呐双翼 Canvas 动态仪表盘 · 周期性上浮深海气泡 |

> **随时切换**：右键点击托盘/宠物本体 ➔ **「🎨 主题与分身皮肤 (4合1)」**，或直接在控制台执行 `window.moodiePet.setTheme('ceramic' | 'submarine' | 'grok' | 'colorful')`，零白屏无闪烁热切换。

---

## 🎬 八套人工盯帧连贯动作（含新增风暴变身）

| 动作 | 触发途径 | 连贯视觉流程（严苛对照物理节奏设计） |
| :---: | :---: | :--- |
| **动作 1** | 随机 / `playAction(1)` | **三角翻滚与彩虹流星包裹**：圆球 morph 变圆角三角 ➔ 右上角甩出彩色短弧蜡笔流星雨 ➔ 三角 720° 旋转翻滚 ➔ 3 束渐变彩虹弧线环绕包裹 ➔ 丝滑变回圆球并爆发粒子。 |
| **动作 2** | `coding` 联动 / `playAction(2)` | **粒子向心汇聚与融合**：圆球缩小至中心小球 ➔ 四周 360° 空间持续生成 20+ 颗彩色粒子加速向心汇聚吞噬吸收 ➔ 弹性果冻脉冲回弹复原。 |
| **动作 3** | 随机 / `playAction(3)` | **60° 倾角彩虹环绕**：圆球缩成小球 ➔ 自小球边缘以 60° 倾角甩出多层交错彩虹蜡笔弧线（粉紫青绿渐变）环绕 360° 旋转一周 ➔ 小球平滑放大复原。 |
| **动作 4** | 随机 / `playAction(4)` | **三小球横排跳动与融合**：主球淡出，中央展开 3 个横排圆润小球 ➔ 依次向上弹跳呼吸（跳动小球加深放大发光，未动小球半透明淡化） ➔ 三小球向中心加速合体融回圆球。 |
| **动作 5** | 随机 / `playAction(5)` | **警示感叹号倾斜巡弋**：主体 morph 呈现 17.7° 优雅倾斜感叹号与水滴点 ➔ 向前平滑滑动巡游并在波峰洒下流光粒子 ➔ 顺滑后退向中心融合变回圆球。 |
| **动作 6** | `error` 联动 / `playAction(6)` | **缺口弹蓝球与感叹号警告**：右上角弹出晶莹蓝球 ➔ 主球下沉缩小与感叹号柱体组合成完整感叹号并“叮铃”左右晃动 2 次 ➔ 向中心聚拢融合复原。 |
| **动作 7** | 随机 / `playAction(7)` | **弹性双跳与多形状轮询**：小球原地轻快弹跳两下（带落地挤压形变） ➔ 放大并开启连续形态轮询秀（`drop` → `egg` → `squircle` → `capsule` → `triangle` → `hex` → `blob`）。 |
| **动作 8** | **桌面双击** / `playAction(8)` | **🌪️ 粒子旋转风暴变身**：4 臂对数螺旋粒子群向心加速内聚 + 身体高速自旋蓄能 ➔ 能量冲击波爆发随机变身为多样萌态（云朵、水滴、胶囊、蛋形等）与彩蛋表情！ |

---

## 🛡️ 架构重构与潜在冲突清零

在 v2.0 重构中，彻底排查并消除了历史上 5 大隐蔽的代码冲突与内存泄漏点：
1. **DOM 特效层与定时器泄露清零**：全面修正 `clearAllEffects()`，规范清理所有粒子定时器，杜绝因误清空根容器而损坏静态光环；
2. **动画帧与时间线安全纳管**：引入 `safeActionInterval` 与 `safeActionRaf`，确保在任何动作中途切换主题或接收系统急停时，弹簧和帧循环被 100% 销毁复位；
3. **消除启动定时器竞态（Race Condition）**：重排 `initTimer` 与主题初始化时序，非 2D 彩色模式下全面阻断 2D 轮询与变形秀泄漏；
4. **WebSocket 101 Upgrade 握手合规**：修正 RFC 6455 握手帧分隔符，彻底解决首帧数据粘连与解析失败；
5. **桌面穿透与高分屏交互全覆盖**：穿透检测全面覆盖 `#bot`、`#grok-container`、`#skin3d-container` 与 `#system-hud`，拖拽定位基于屏幕物理坐标防漂移。

---

## 🚀 快速上手与本地运行

### 1. 运行 24 项全自动化交付门禁
```bash
node verify.js
```
*自动校验 2D 表情/几何形变完备性、Three.js 3D 资产导出合规、V8 AST 语法、HTTP REST + WebSocket 四态实时链路与安装包依赖完整性。*

### 2. 启动开发版桌宠（透明置顶桌面原生模式）
```bash
npm start
```

### 3. 启动纯浏览器免安装预览版（附带系统感知服务端）
```bash
node server.js
# 访问 http://127.0.0.1:8137 即可在浏览器全功能体验桌宠
```

### 4. 重新构建 Windows 免安装独立绿色执行包
```bash
npm run dist
# 构建完成后将在 dist/ 目录下输出 Sonnet Bot 2.0.0.exe (约 69.7MB，内含全套离线引擎与 3D 资源)
```

---

## 📁 项目目录结构

```
moodie-pet/
├── main.js                  # Electron 主进程：窗口管理、全局穿透、右键菜单、空闲监控、感知守护
├── preload.js               # 安全沙箱桥接：双向系统状态与菜单命令绑定
├── system-sensor.js         # 系统与 Agent 感知引擎：CPU/编译进程/空闲/深夜扫描 + HTTP/WS 端点
├── moodie-cli.js            # 命令行与 Agent 联动控制器 (CLI)
├── pet.html                 # 桌宠核心舞台：8大连贯动作、4主题分身挂载、系统感知调度、HUD 胶囊
├── data.js                  # 26 表情顶点环坐标 + 39 状态心情池
├── morph-engine.js          # 身体形态贝塞尔弹簧变形引擎
├── grok-recipes.js          # Sonnet/Grok 原版状态配方数据
├── grok-player.bundle.js    # Sonnet/Grok 四元数球面透视投影运行时
├── skins-3d.js              # 3D 骨瓷天使球 + 深海全息舱统一源码 (Three.js WebGL)
├── skins-3d.bundle.js       # 3D 独立零依赖编译包 (Three.js r184 内置打包)
├── server.js                # 静态预览与轻量测试 Web 服务
├── verify.js                # 24 项全系统自动化门禁自测套件
└── package.json             # 项目元数据与打包发布配置 (v2.0.0)
```

---

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 开源，© 2026 sukikeeling。
