# Sonnet Bot · Grok 风格动作质感升级方案（v1.3）

> 目标：默认保持彩色可爱风，把官方 Grok Orb 的**丝滑 morph 动作质感**移植进来完善现有小球。
> 参考血缘链：smontlouis gist（spring 公式/球面投影）→ blobstudio → OpenMausBot PR#31（MIT，CursorAvatar.tsx 自包含引擎）。
> 现状：工程已内置 GrokBot 25 表情 × 48 点眼睛数据 + spring 眼睛 morph + 39 状态轮询，差距在**身体**。

## 差距分析（现状 → 目标）

| 能力 | 现状 | 目标 |
|---|---|---|
| 眼睛 morph | ✅ spring 插值 + 球面投影 + 42/58 眨眼 | 保留 |
| 身体形状切换 | ❌ 硬切 `d`（8 种 path 直接换，无过渡） | **弹簧丝滑 morph**（任意形状之间果冻过渡） |
| 感叹号形态 | ❌ 只有 `!` 粒子文字 | **身体丝滑 morph 成感叹号再变回**（surprised/alerting 触发） |
| 特效-轨道 | 🟡 双激光环（单色边框） | 多色霓虹轨道环（渐变细线三环） |
| 特效-三圆点 | ❌ 无 | loading 类状态显示三圆点加载态 |
| 特效-粒子 | 🟡 有表情符号/烟花 | 加**身体边缘彩点喷溅**（working/sending 等） |
| 主题 | ❌ 仅彩色 | 加 **Grok 极简主题开关**（黑球白眼，右键切换） |
| 演示 | ❌ 浏览器打开透明背景 | 浏览器（非 Electron）打开给白底演示背景 |
| 代码结构 | 🟡 数据在 data.js，逻辑单文件内联分节 | 保持（数据/morph/状态机已分层），内部分节注释 |

## 技术方案

### 1. 身体 morph 引擎（核心）

- **采样器**：利用 SVG 原生 `path.getTotalLength()/getPointAtLength()`，把 8 种形状的现有 path 均匀采样 240 点 → 从质心按角度 48 等分重采样（角度对齐，morph 不旋转漂移）。
- **数据结构**：`GROKBOT_SHAPES` 每项挂 `ring: [48][2]`（懒计算，首次切换时采样缓存）。
- **渲染**：身体 `<path>` 的 `d` 改为 `smoothRing(curBodyRing)`；`clipPath` 同步更新（眼睛被身体裁剪，保持一致）。
- **插值**：`bodyMorph` 阻尼弹簧（复用现有 Spring 类），`curRing = lerp(from, to, spring)`，逐点插值 → 任意两形状丝滑过渡，带果冻回弹。
- **感叹号**：定义第 9 形状 `exclaim`（窄高圆角竖条 ring，参数化生成），surprised/alerting 状态进入时自动 morph 过去；底部圆点单独元素（感叹号态显示），眼睛在感叹号态压成小点。
- **与现有系统共存**：手动选形状仍走 morph；自动状态轮询不干预形状（感叹号由状态触发）。

### 2. 主题开关

- CSS 变量化：`--bot-color`（已有）、`--eye-color`、`--demo-bg`。
- `grok` 主题 = `--bot-color:#0d0d0f` + `--eye-color:#fff`；`colorful` = 现状桃粉。
- 右键菜单加「主题」submenu（彩色 / Grok 极简），菜单动作走现有 `color:` 机制扩展为 `theme:grok` / `theme:colorful`。
- 非 Electron 环境 body 加 `web-demo` class：白底 + 柔和阴影，双击 pet.html 即纯白极简演示。

### 3. 特效增强

- **多色霓虹轨道**：`fx-orbit` 从双环升级为三环（渐变边框 + 不同转速/方向 + glow）。
- **三圆点加载**：`loading/dictating/writing/uploading` 时 fx 层显示三圆点跳动（原生 CSS 动画）。
- **粒子喷溅**：新增 `spawnBurst()` 从身体边缘随机角度喷 10-14 个彩色小点（复用 fx-burst），`working/sending/receiving/uploading` 状态低频率触发。

### 4. 性能

- 保持单 rAF。身体 morph 每帧多 48 点 lerp + 1 次 `smoothRing`（48 点三次贝塞尔），开销 <0.1ms，60fps 无压力。
- 采样器仅在首次使用某形状时执行一次（缓存）。

## 实施步骤

1. 备份现状（已完成：`backup-v122-*`）
2. 身体采样器 + ring 数据 + spring morph 渲染改造
3. ~~感叹号形态~~ → **已按用户反馈废弃**（用户明确不要感叹号风格），改为**变形秀彩蛋**
4. 特效：三圆点 / 多色轨道 / 粒子喷溅
5. Grok 主题开关 + 演示白底 + 右键菜单项
6. 验证：`node --check`、浏览器打开、Electron 运行、右键全菜单走查

## v1.3.1 用户反馈修订（2026-08-17）

- **删除感叹号形态**：surprised/alerting 不再 morph 成感叹号竖条（用户明确"不是我想要的风格"）
- **新增变形秀彩蛋**：`startShapeShow()` 自动循环 morph 圆→椭圆→六边形→三角→圆（3.4s/步，配三色霓虹环绕），参考用户提供的官方视频（GLM 逐帧分析确认：视频核心是连续形态变换而非感叹号）；随机触发（状态轮询 22%）+ Grok 主题进入时必触发；手动选形状/暂停时中断
- **Grok 主题彩蛋化**：黑球（#0d0d0f）加径向渐变光泽高光（`#body-shine` 跟随 morph）+ 进入即播放变形秀，区别于纯黑切换
- **修复"切角"bug**（采样器两处）：
  1. 角度归一化公式错误（`2π-diff` 产生负值，错误点混入候选）→ 改用最小角差公式
  2. 采样策略改为"bin 内选角度接近+距离最远的外轮廓点"，M=240→360
  - 修复后 8 形状最大相邻点距 96-124px → 24-38px，GLM 目检确认圆润无尖角

## 不做的事

- 不换 React/不引外部库（保持原生 HTML/CSS/JS）
- 不动 data.js 数据格式（25 表情/39 状态是 GrokBot 官方数据）
- 不重做 main.js 主进程逻辑（只加菜单项）
- 暂不上传 GitHub（用户确认满意后再定）
