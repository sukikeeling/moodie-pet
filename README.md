# 🐾 Sonnet Bot

> 圆嘟嘟的小脸桌面宠物：双主题（🌈 彩色可爱 / ⚫ Sonnet 极简）· 贝塞尔弹簧 morph · 身体变形秀 · 39 状态自动轮询 · 3D 拖动转向 · 透明置顶 · 桌面穿透 · 开机自启。

> 🧠 **项目来源说明**：本项目的动画引擎（表情 morph、身体弹簧、状态机节奏）基于社区逆向工程数据（smontlouis GrokBot gist、blobstudio 等开源项目）和自研渲染实现，目标是高度接近官方 Orb 角色动画质感，**非官方源码，不含官方资产**。代码本身 MIT 许可，可自由使用。

![Sonnet Bot](docs/preview.svg)

> 🌐 **[在线试玩](https://sukikeeling.github.io/moodie-pet/)** · ⬇ **[下载 Windows 免安装版](https://github.com/sukikeeling/moodie-pet/releases)**

一只会 morph 的小球，在屏幕角落陪你上班摸鱼。它有两幅面孔：

- **🌈 彩色可爱风**（默认）：桃粉小脸，39 种状态卖萌冒泡，偶尔（10%）来一场「圆 → 随机形状 → 圆」的丝滑变形秀；
- **⚫ Sonnet 极简风**（右键菜单切换）：纯黑球 + 白眼 + 光泽高光，13 状态机自动循环巡演——圆 → 椭圆 → 六边形 → 蛋形 → 水滴 → 三角 → 感叹号 → 三圆点 → 小黑点，配霓虹轨道 / 彩虹拖尾 / 粒子爆发全套特效。

## ✨ 特性

**动画引擎（GrokBot 同源）**
- **25 表情 × 48 点环**：每只眼睛是 48 个点定义的环，逐点 spring 插值，任意表情之间丝滑 morph。
- **贝塞尔弹簧**：身体 morph 用 `cubic-bezier(0.34, 1.18, 0.30, 1)` 缓动（y=1.18 超调），果冻回弹、绝不生硬；眼睛用二阶阻尼弹簧（f=7 临界阻尼，同源原生参数）。
- **球面投影**：眼睛按球面经纬度渲染，转身时 cos 透视压缩、背面隐藏。
- **自然眨眼**：320ms 开合（前 42% 闭 / 后 58% 开），不瞬间切换。

**双主题状态机**
- **彩色模式**：39 种状态（睡眠/思考/搜索/庆祝/警报…）随机轮询，状态内按原版节奏循环表情池 + 眨眼；每个状态配专属特效（轨道激光环 / 雷达波纹 / 加载霓虹弧 / 警报脉冲 / 扫描光束 / 烟花 / 爱心粒子…）+ 场景化弹出词。
- **Sonnet 极简模式**：13 状态自动循环（idle → thinking → surprised 感叹号 → 六边形 → 蛋形 → 水滴 → 三角形 → orbit → particles → loading → tiny → excited），黑底白字极简弹出词，先变形身体再变形眼睛（有先后节奏）。

**身体变形秀**
- 8+ 种参数化形状（圆/椭圆/圆角方/胶囊/三角/六边/云朵/水滴/蛋形/豆形），任意两者之间弹簧 morph，clip 同步裁剪。
- 自动 10% 概率触发「圆 → 右键菜单形状里随机一个 → 圆」。

**桌宠外壳**
- 透明置顶、可拖动（3D 转向 + 松手弹回）、鼠标视线跟随、桌面穿透、开机自启。
- 单击：彩色=摸头撒娇；极简=随机切换状态。右键：完整菜单（心情/换装/形状/尺寸/配饰/主题/颜色/暂停/自启/退出）。

## 🚀 快速开始

```bash
npm install        # 装 Electron
npm start          # 启动桌宠（也可双击 启动桌宠.bat）
npm run dist       # 构建 Windows 免安装 exe（electron-builder）
```

> **国内网络**：首次 `npm install` 若卡在 Electron 二进制下载，改用镜像装二进制即可：
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ node node_modules/electron/install.js
> ```

## 🖱️ 互动

| 操作 | 效果 |
|---|---|
| 鼠标移过 | 视线跟随、身体微倾 |
| 单击 | 彩色：果冻反应 + 摸头；极简：随机切换状态 |
| 拖动 | 移动位置 + 3D 转向 |
| 右键 | 菜单：心情 / 换装 / 选形状 / 尺寸 / 配饰 / 主题 / 颜色 / 暂停 / 开机自启 / 退出 |

## 📁 项目结构

| 文件 | 作用 |
|---|---|
| `main.js` | Electron 主进程：透明置顶窗口、拖动、右键菜单、开机自启、桌面穿透、空闲熄屏保护 |
| `preload.js` | 安全暴露 `window.electronAPI`（contextBridge） |
| `pet.html` | 桌宠页面：morph 引擎 + 双主题状态机 + 特效系统 + 台词 + 交互 |
| `data.js` | 25 表情坐标（48 点环）+ 39 状态分组/表情池/节奏/眨眼数据 |
| `gen-icon.js` | 光栅化小粉脸生成多分辨率 `build/icon.ico` |
| `generate-preview.js` | 生成 `docs/preview.svg` |
| `build/icon.ico` | exe 图标（小粉脸） |
| `extract-data.js` / `server.js` / `verify.js` | 抽数据 / 本地预览 / 校验辅助脚本 |

## 🔧 技术实现

- **数据层**（`data.js`）：25 表情 × 2 眼 × 48 点环坐标；39 状态四维数据（分组 GROUPS / 表情池 POOLS / 表情节奏 EXPR_CADENCE / 眨眼节奏 BLINK）。
- **动画层**：`requestAnimationFrame` 单循环；眼睛=逐点 lerp + 阻尼弹簧 + 球面投影；身体=参数化形状采样（SVG `getPointAtLength` 均匀采样 240 点 → 质心角度 48 等分）+ 贝塞尔弹簧缓动（480ms）。
- **状态机**：彩色 39 状态随机轮询 + Sonnet 极简 13 状态顺序巡演，两套互斥隔离（切换时启停对应轮询）。
- **特效层**：CSS 轨道环 / 彩虹拖尾弧线 / DOM 粒子系统 / 烟花，全部原生实现，无外部库。
- **性能**：单 rAF 驱动，静止不重绘；实测 60fps 稳定。

## 🙏 参考项目

本项目是站在以下开源实现肩膀上的复刻与整合，**深表感谢**：

| 项目 | 用途 | 许可 |
|---|---|---|
| [**LaoA-GrokBot**](https://github.com/zhulin025/LaoA-GrokBot) | 表情数据源（25 表情/39 状态）、原生弹簧参数、状态中文映射 | MIT（© 老A玩AI） |
| [**smontlouis 的 GrokBot 逆向工程 gist**](https://gist.github.com/smontlouis/49a4c9303de70118a90dc43badc1aba5) | 弹簧公式（f=7 临界阻尼）、球面投影、gaze/blink 参数、18 种参数化形状定义 | 无许可（仅供学习） |
| [**Blob Studio**](https://github.com/aivsomkar/blobstudio) | GrokBot 风格表情生成器（25 表情/40 情绪），数据生成方法论 | 无许可 |
| [**OpenMausBot**](https://github.com/milind-soni/OpenMausBot) | CursorAvatar.tsx 自包含引擎参考、39 状态对接层设计 | MIT |
| [**Bot-svg-skill / svg-film**](https://github.com/youngbeauty/Bot-svg-skill) | 贝塞尔弹簧缓动 `cubic-bezier(0.34,1.18,0.30,1)`、states.json 状态机方法论 | 无许可 |

> 「Sonnet 极简风」的动画表现灵感来自 X (Twitter) 官方 Grok Bot（Orb）的开场动画（用户提供的 30s 参考视频逐帧分析），为**风格致敬**，非官方素材。
> 原始表情/状态数据版权归各自上游；本项目在此基础上重构了渲染引擎、双主题状态机与桌宠外壳。

## 📜 许可

本项目采用 [MIT License](LICENSE)，© 2026 sukikeeling。
上游许可如上表，使用时请各自遵守（尤其无许可项目仅限学习参考）。
