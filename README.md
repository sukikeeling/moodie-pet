# 🐾 Sonnet Bot

<div align="center">

> **圆嘟嘟的灵动桌面宠物**：双主题（🌈 彩色可爱 / ⚫ Sonnet 极简）· 7 大人工盯帧连贯动作 · 压感彩色蜡笔流星与环绕引擎 · 贝塞尔弹簧 Morph · 身体变形秀 · 39 状态自动轮询 · 3D 拖动转向 · 透明置顶 · 桌面穿透 · 开机自启。

[![Release](https://img.shields.io/github/v/release/sukikeeling/moodie-pet?color=ff5d9e&label=Windows%20Release)](https://github.com/sukikeeling/moodie-pet/releases)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20Portable-success)](https://github.com/sukikeeling/moodie-pet/releases)

<br/>

![Sonnet Bot](docs/preview.svg)

<br/>

🌐 **[在线试玩预览](https://sukikeeling.github.io/moodie-pet/)** &nbsp;&nbsp; | &nbsp;&nbsp; ⬇️ **[下载 Windows 免安装绿色版 (.exe)](https://github.com/sukikeeling/moodie-pet/releases)**

</div>

---

## 🚀 最新重磅突破（v1.5.0）

一只会 morph 的灵动小球，在屏幕角落陪你上班摸鱼。v1.5.0 迎来**全新超强突破**：

### 🎬 1. 七大人工盯帧连贯动作（全网首创高精度复刻）
深度对照官方 Orb 动画逐帧拆解与时间节奏，实现了 7 套连贯高质感表演动作：

| 动作 | 名称 | 盯帧连贯视觉流程 |
| :---: | :--- | :--- |
| **动作 1** | **三角翻滚与彩虹流星包裹** | 圆球 morph 变圆角三角 ➔ 右上角向左下角甩出前后交错的彩色短弧蜡笔流星雨 ➔ 三角高速 720° 旋转翻滚（持续约 2s） ➔ 底部与 3 个角甩出 3 束渐变彩虹弧线环绕包裹 ➔ 丝滑变回圆球并爆发粒子。 |
| **动作 2** | **粒子向心汇聚与融合** | 圆球缩小至中心小球 ➔ 四周 360° 空间持续生成 20+ 颗深浅各色彩球粒子，沿贝塞尔加速曲线飞入小球并被吞噬吸收（小球伴随果冻微脉冲） ➔ 弹性回弹复原。 |
| **动作 3** | **60° 倾角彩虹环绕** | 圆球缩成小球 ➔ 自小球边缘以 60° 倾角甩出多层交错彩虹蜡笔弧线（粉紫青绿渐变），弧线由短变长围绕小球 360° 旋转一周后收短淡出 ➔ 小球平滑放大复原。 |
| **动作 4** | **三小球横排跳动与融合** | 主球淡出并在舞台中央展开 3 个横排圆润小球 ➔ 依次向上弹跳呼吸（跳动小球加深放大发光，未动小球半透明淡化） ➔ 三小球向中心加速合体融回圆球。 |
| **动作 5** | **毛笔挥毫平移与融合** | 倒装水滴笔尖与圆润毛笔杆组合成完整毛笔 ➔ 笔身倾斜 15° 向右缓缓平移（约 1.8s），期间水滴笔尖在空中轻快跳动点缀挥毫并洒落彩色小墨滴 ➔ 右侧笔杆消散、水滴放大融回归位。 |
| **动作 6** | **缺口弹蓝球与感叹号** | 圆球右上角出现圆弧缺口弹出一颗晶莹蓝球 ➔ 主球下沉缩小与感叹号柱体组合成完整标点感叹号并“叮铃”轻晃 2 次 ➔ 各部分向中心聚拢融合复原。 |
| **动作 7** | **弹性双跳与多形状轮询** | 小球原地轻快弹跳两下（带重力加速度与触地挤压形变 squash & stretch） ➔ 放大并开启连续形态轮询秀（`drop` → `egg` → `squircle` → `capsule` → `triangle` → `hex` → `blob` 丝滑切换） ➔ 稳稳复原。 |

### 🌈 2. 压感彩色蜡笔流星与环绕引擎（Crayon Rainbow Streamer Engine）
- **手绘蜡笔压感**：基于动态 SVG 路径 + `stroke-linecap="round"` + `feGaussianBlur` 柔光光晕滤镜；
- **单线色彩过渡**：内置紫→蓝→青、粉→黄→绿等高饱和双向与多向渐变色；
- **真实甩动物理**：二次贝塞尔曲线轨迹（`M x1 y1 Q cx cy x2 y2`）+ 动态 `stroke-dasharray` 推进，实现流星由细变粗、短弧甩出、长弧环绕、收尾淡出的完整生命周期。

### 💥 3. 粒子绽放系统璀璨增强
- 粒子直径提升至 **13~16px** 饱满形态；
- 双层霓虹光晕 `box-shadow: 0 0 10px currentColor, 0 0 20px currentColor`，彻底解决过去粒子过淡问题；
- 晶莹高亮滤镜 `brightness(1.35)`，让每次绽放与动作收尾都光彩夺目。

### 🏗️ 4. 动画导演解耦架构
- **状态机与剧情演出完全解耦**：日常 39 个状态只负责表情与轻特效；动作 1~7 拥有独立的 `isActionPlaying` 演出锁，互不冲突；
- **即时单测**：控制台开放全局接口 `window.playAction(1~7)`，可随时单测任意动作。

---

## 🎭 双面主题

- **🌈 彩色可爱风**（默认）：桃粉小脸，39 种状态卖萌冒泡，偶尔触发丝滑连贯大动作与变形秀；
- **⚫ Sonnet 极简风**（右键菜单切换）：纯黑球 + 白眼 + 光泽高光，13 状态机自动循环巡演——圆 → 椭圆 → 六边形 → 蛋形 → 水滴 → 三角 → 感叹号 → 三圆点 → 小黑点，配霓虹轨道 / 彩虹拖尾 / 粒子爆发全套特效。

---

## ✨ 核心特性

- **25 表情 × 48 点环**：每只眼睛由 48 个点定义的环构成，逐点 spring 插值，任意表情之间丝滑 morph。
- **贝塞尔弹簧动画**：身体 morph 使用 `cubic-bezier(0.34, 1.18, 0.30, 1)` 缓动（果冻回弹、绝不生硬）；眼睛使用二阶阻尼弹簧（f=7 临界阻尼原生参数）。
- **球面投影透视**：眼睛按球面经纬度渲染，转身时 cos 透视压缩、背面自然隐藏。
- **自然眨眼机制**：320ms 开合（前 42% 闭 / 后 58% 开），真实灵动。
- **桌宠交互外壳**：透明置顶、可拖动（3D 转向 + 松手弹回）、鼠标视线跟随、桌面穿透、空闲熄屏保护、开机自启。

---

## 🖱️ 交互指南

| 操作 | 效果 |
|---|---|
| **鼠标移动** | 视线跟随、身体微倾 |
| **单击** | 彩色模式：果冻反应 + 摸头撒娇；极简模式：随机切换状态 |
| **拖动** | 移动窗口位置 + 3D 转向倾角 |
| **右键** | 打开功能菜单：心情 / 换装 / 选形状 / 尺寸 / 配饰 / 主题 / 颜色 / 暂停 / 开机自启 / 退出 |
| **控制台调试** | `window.playAction(1~7)` 随时调用 7 大连贯表演动作 |

---

## 🚀 快速上手与本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动桌宠（也可双击运行 启动桌宠.bat）
npm start

# 3. 构建 Windows 免安装独立 exe（自动输出至 dist/ 目录）
npm run dist
```

> **国内网络加速**：若首次 `npm install` 下载 Electron 较慢，可使用镜像源：
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ node node_modules/electron/install.js
> ```

---

## 📁 目录结构

| 文件 / 目录 | 作用说明 |
|---|---|
| `main.js` | Electron 主进程：透明置顶窗口、窗口拖动、右键菜单、开机自启、桌面穿透、熄屏保护 |
| `preload.js` | 安全暴露 `window.electronAPI`（contextBridge） |
| `pet.html` | 桌宠核心舞台：7大动作演出 + 蜡笔流星引擎 + 状态机 + 特效层 + 交互 |
| `morph-engine.js` | 身体形态 morph 引擎：形状参数化定义 + 48 点质心环采样 + 贝塞尔弹簧缓动 |
| `data.js` | 25 表情坐标（48 点环）+ 39 状态分组/表情池/节奏/眨眼数据 |
| `gen-icon.js` | 光栅化生成多分辨率 `build/icon.ico` |
| `generate-preview.js` | 生成 `docs/preview.svg` 预览图 |
| `.github/workflows/` | GitHub Actions 自动化 CI/CD 工作流：推 Tag 自动打包 Windows 免安装 exe 并发布 Release |

---

## 🙏 致谢与参考项目

本项目是站在开源社区与优秀逆向工程成果肩膀上的复刻与升级，**深表感谢**：

- [**LaoA-GrokBot**](https://github.com/zhulin025/LaoA-GrokBot) — 表情数据源（25 表情/39 状态）、原生弹簧参数、状态中文映射（© 老A玩AI，MIT 许可）
- [**smontlouis 的 GrokBot 逆向工程 gist**](https://gist.github.com/smontlouis/49a4c9303de70118a90dc43badc1aba5) — 弹簧公式、球面投影、gaze/blink 参数
- [**Blob Studio**](https://github.com/aivsomkar/blobstudio) — GrokBot 风格表情生成与数据设计方法论
- [**OpenMausBot**](https://github.com/milind-soni/OpenMausBot) — CursorAvatar 自包含引擎参考
- [**Bot-svg-skill / svg-film**](https://github.com/youngbeauty/Bot-svg-skill) — 贝塞尔弹簧缓动曲线方法论

---

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 开源，© 2026 sukikeeling。
