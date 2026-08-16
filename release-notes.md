# 🐾 Sonnet Bot v1.3.0

双主题桌宠：🌈 彩色可爱 + ⚫ Sonnet 极简（Grok 质感 morph 动画）。

## ✨ 本次新增（v1.3.0）

**⚫ Sonnet 极简主题**（右键菜单切换）
- 纯黑球 + 白眼 + 光泽高光，13 状态机自动循环巡演：圆 → 椭圆 → 六边形 → 蛋形 → 水滴 → 三角 → 感叹号 → 三圆点 → 小黑点
- 特效全套：三色霓虹轨道环 / 彩虹拖尾 / 粒子爆发 / 右上角蓝点 / 黑底白字极简弹出词
- 单击随机切换状态

**动画质感全面升级**
- 身体 morph 引擎：贝塞尔弹簧缓动 `cubic-bezier(0.34, 1.18, 0.30, 1)`（果冻回弹，移植自 svg-film skill 方法论）
- 眼睛弹簧改原生参数（f=7 临界阻尼），球面投影 / gaze / 眨眼与原生同源
- 修复多边球：原始形态常驻直接用原始 SVG path，100% 丝滑曲线

**形状扩展与变形秀**
- 新增蛋形 / 豆形 / 水滴形状（参考 smontlouis GrokBot 逆向工程参数化形状）
- 变形秀：圆 → 右键形状随机一个 → 圆，自动 10% 概率触发

**场景化弹出词 v2**
- 彩色 39 状态全新台词（贴合场景：睡觉打呼噜 / 醒来伸懒腰 / 干活摸鱼 / 关机道晚安…）
- 极简 13 状态专属弹出词（待命 / 分析中 / 异常信号 / 形态重排…）

## 🛠 历史版本

- **v1.2.2**：修桌宠阻止系统熄屏/锁屏（空闲暂停 + powerMonitor 兜底）
- **v1.2.1**：台词回归第一版 + 润色，修卡死 bug，烟花上升绽放
- **v1.2.0**：台词全面重写 + 右键选形状（8 种）+ 手脚搭配动作 + 庆祝弹跳 + 摸头撒娇 + 粒子可见性修复
- **v1.1.0**：更名 Sonnet Bot · 真实小脸图标 · 开机自启 · 状态动作特效

## ⬇ 使用

- 双击 `启动桌宠.bat` 或 `npm start`
- 右键菜单：心情 / 换装 / 选形状 / 尺寸 / 配饰 / **主题（彩色可爱 ↔ Sonnet 极简）** / 颜色 / 暂停 / 开机自启 / 退出

## 🙏 参考

动画引擎与数据参考：[LaoA-GrokBot](https://github.com/zhulin025/LaoA-GrokBot)（MIT）· [smontlouis GrokBot 逆向 gist](https://gist.github.com/smontlouis/49a4c9303de70118a90dc43badc1aba5) · [Blob Studio](https://github.com/aivsomkar/blobstudio) · [OpenMausBot](https://github.com/milind-soni/OpenMausBot)（MIT）· [Bot-svg-skill](https://github.com/youngbeauty/Bot-svg-skill)。详见 README。
