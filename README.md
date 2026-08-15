# 🐾 Moodie 桌宠

> 把圆嘟嘟的小脸变成桌面宠物：自动轮换表情 · 3D 拖动转向 · 透明置顶 · 桌面穿透。

![Moodie 桌宠](docs/preview.svg)

基于 [moodie.html](https://github.com/sukikeeling/moodie-html) 的 GrokBot 小脸，做成 Windows 桌面宠物（Electron）。它会在屏幕角落一直陪着你，表情自动轮播，偶尔冒泡说话。

## ✨ 特性

- **自动轮询表情**：39 种状态随机切换，状态内按原版节奏循环表情池 + 眨眼，表情一直在线。
- **工作流台词**：状态切换 / 间隔几秒会冒出气泡说话，内容跟着状态走（思考→「让我想想…」、码字→「文档 ing」、发送→「发出去了！」……39 个状态全覆盖）。
- **3D 立体转向**：拖动它，一边跟着鼠标移动，一边在 3D 空间里转向（左右 yaw / 上下 pitch），松手弹回正面。
- **桌面穿透**：透明区域不挡桌面，鼠标只在小脸本体上才生效。
- **可定制**：右键菜单换颜色 / 配饰（草帽 · 眼镜 · 蝴蝶结 · 披风）/ 尺寸（每次缩 1/3）/ 暂停 / 退出。

## 🚀 快速开始

```bash
npm install        # 装 Electron
npm start          # 启动桌宠（也可双击 启动桌宠.bat）
```

> **国内网络**：首次 `npm install` 若卡在 Electron 二进制下载，改用镜像装二进制即可：
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ node node_modules/electron/install.js
> ```

## 🖱️ 互动

| 操作 | 效果 |
|---|---|
| 鼠标移过 | 视线跟随、身体微倾 |
| 单击 | 果冻反应（蹦跳 / 挤压）+ 眨眼 |
| 拖动 | 移动位置 + 3D 转向 |
| 悬停右上角 | 出现 `－` `○` `＋` 尺寸按钮 |
| 右键 | 菜单（心情 / 换装 / 配饰 / 尺寸 / 颜色 / 暂停 / 退出）|

## 📁 项目结构

| 文件 | 作用 |
|---|---|
| `main.js` | Electron 主进程：透明置顶窗口、拖动、右键菜单、桌面穿透 |
| `preload.js` | 安全暴露 `window.electronAPI` |
| `pet.html` | 桌宠页面：精简动画引擎 + 自动轮询 + 3D 拖动 + 台词 |
| `data.js` | 25 表情坐标 + 39 状态节奏/眨眼数据 |
| `extract-data.js` | 从 `moodie.html` 重新抽取 `data.js` 的脚本 |
| `generate-preview.js` | 生成 `docs/preview.svg` |
| `server.js` / `verify.js` | 本地预览 / 数据校验的辅助脚本 |

## 🙏 致谢与许可

数据与动画引擎移植自 [**LaoA-GrokBot**](https://github.com/zhulin025/LaoA-GrokBot)（MIT，© 老A玩AI），融合自 [**moodie-html**](https://github.com/sukikeeling/moodie-html)（MIT）。

本项目采用 [MIT License](LICENSE)，© 2026 sukikeeling。
