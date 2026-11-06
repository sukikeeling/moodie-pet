/* ==========================================================================
 * context-menu-web.js — 桌面端右键菜单 (main.js:171-353) 的纯静态 Web 1:1 适配器
 * 来源出处: sukikeeling/moodie-pet/main.js & preload.js (Author: sukikeeling)
 * 许可与署名请见同目录 NOTICE 文件。
 * ========================================================================== */
(function () {
  "use strict";

  const uiMirror = {
    theme: "ceramic",
    systemState: "normal",
    autoSense: false,
    paused: false,
  };

  const actionListeners = [];
  const systemStateListeners = [];

  function emitMenuAction(action) {
    for (let i = 0; i < actionListeners.length; i++) {
      try {
        actionListeners[i](action);
      } catch (err) {
        console.error("[MenuAction Error]", err);
      }
    }
  }

  function emitSystemState(payload) {
    if (payload && payload.state) {
      uiMirror.systemState = payload.state;
    }
    for (let i = 0; i < systemStateListeners.length; i++) {
      try {
        systemStateListeners[i](payload);
      } catch (err) {
        console.error("[SystemState Error]", err);
      }
    }
  }

  // 构建与 main.js (第 179-351 行) 逐字一致的菜单模板
  function buildMenuTemplate() {
    return [
      { label: "😊 换个心情", click: () => emitMenuAction("nextMood") },
      { label: "🎲 随机换装", click: () => emitMenuAction("randomLook") },
      { type: "separator" },
      {
        label: "🎨 主题与分身皮肤 (4合1)",
        submenu: [
          {
            label: "🌈 彩色可爱 (Colorful 2D)",
            type: "radio",
            checked: uiMirror.theme === "colorful",
            click: () => {
              uiMirror.theme = "colorful";
              emitMenuAction("theme:colorful");
            },
          },
          {
            label: "⚫ Sonnet 极简 (Grok 粒子)",
            type: "radio",
            checked: uiMirror.theme === "grok",
            click: () => {
              uiMirror.theme = "grok";
              emitMenuAction("theme:grok");
            },
          },
          {
            label: "🏺 3D 骨瓷天使球 (Ceramic 3D)",
            type: "radio",
            checked: uiMirror.theme === "ceramic",
            click: () => {
              uiMirror.theme = "ceramic";
              emitMenuAction("theme:ceramic");
            },
          },
          {
            label: "🫧 深海驾驶舱全息球 (Submarine Holo)",
            type: "radio",
            checked: uiMirror.theme === "submarine",
            click: () => {
              uiMirror.theme = "submarine";
              emitMenuAction("theme:submarine");
            },
          },
        ],
      },
      {
        label: "🧠 系统与 Agent 感知联动",
        submenu: [
          {
            label: "🔄 自动感知工作流 (CPU/编译/深夜)",
            type: "checkbox",
            checked: false,
            enabled: false,
            title: "桌面版专属机制（浏览器静态环境无 OS 进程遥测）",
          },
          { type: "separator" },
          {
            label: "⚡ 触发：专注搬砖 (向心粒子汇聚)",
            type: "radio",
            checked: uiMirror.systemState === "coding",
            click: () =>
              emitSystemState({
                type: "system-state",
                state: "coding",
                reason: "手动开启：专注搬砖 / 向心粒子汇聚",
                source: "context-menu",
              }),
          },
          {
            label: "⚠️ 触发：任务异常 (感叹号与蓝球警告)",
            type: "radio",
            checked: uiMirror.systemState === "error",
            click: () =>
              emitSystemState({
                type: "system-state",
                state: "error",
                reason: "手动演示：任务出错 / 感叹号与蓝球警告",
                source: "context-menu",
              }),
          },
          {
            label: "🌙 触发：空闲深夜 (柔光呼吸/趴着打呼)",
            type: "radio",
            checked: uiMirror.systemState === "sleep",
            click: () =>
              emitSystemState({
                type: "system-state",
                state: "sleep",
                reason: "手动开启：空闲休息 / 柔光呼吸打呼",
                source: "context-menu",
              }),
          },
          {
            label: "✨ 恢复：灵动伴随模式",
            type: "radio",
            checked: uiMirror.systemState === "normal",
            click: () =>
              emitSystemState({
                type: "system-state",
                state: "normal",
                reason: "恢复正常灵动伴随",
                source: "context-menu",
              }),
          },
          { type: "separator" },
          {
            label: "📡 感知端口: 127.0.0.1:17530 (HTTP/WS)",
            enabled: false,
          },
        ],
      },
      { type: "separator" },
      {
        label: "🔲 选形状 (2D 彩色模式)",
        submenu: [
          { label: "原始形态", click: () => emitMenuAction("shape:blob") },
          { label: "鹅卵石", click: () => emitMenuAction("shape:pebble") },
          { label: "圆角方", click: () => emitMenuAction("shape:squircle") },
          { label: "胶囊", click: () => emitMenuAction("shape:capsule") },
          { label: "三角体", click: () => emitMenuAction("shape:triangle") },
          { label: "六边体", click: () => emitMenuAction("shape:hex") },
          { label: "云朵", click: () => emitMenuAction("shape:cloud") },
          { label: "水滴", click: () => emitMenuAction("shape:drop") },
        ],
      },
      {
        label: "尺寸",
        submenu: [
          { label: "缩小（×2/3）", click: () => emitMenuAction("size:minus") },
          { label: "放大（×3/2）", click: () => emitMenuAction("size:plus") },
          { label: "默认大小（×2/3）", click: () => emitMenuAction("size:reset") },
        ],
      },
      {
        label: "配饰",
        submenu: [
          { label: "👒 草帽", click: () => emitMenuAction("accessory:straw-hat") },
          { label: "👓 眼镜", click: () => emitMenuAction("accessory:glasses") },
          { label: "🎀 蝴蝶结", click: () => emitMenuAction("accessory:bowtie") },
          { label: "🦸 披风", click: () => emitMenuAction("accessory:cape") },
          { type: "separator" },
          { label: "取消全部配饰", click: () => emitMenuAction("accessory:clear") },
        ],
      },
      {
        label: "颜色",
        submenu: [
          "可可棕 #9a6737",
          "活力红 #ff3347",
          "暖橙 #ff6a00",
          "琥珀 #ff9800",
          "青绿 #08c77a",
          "湖蓝 #08b9a9",
          "经典蓝 #2f86ed",
          "梦幻紫 #8656f6",
          "桃粉 #ff2d8b",
          "纯黑 #000000",
        ].map((c) => {
          const parts = c.split(" ");
          return { label: parts[0], hex: parts[1], click: () => emitMenuAction("color:" + parts[1]) };
        }),
      },
      { type: "separator" },
      { label: "⏸️ 暂停 / 继续轮询", click: () => emitMenuAction("togglePause") },
      {
        label: "🚀 开机自启",
        type: "checkbox",
        checked: false,
        enabled: false,
        title: "桌面版专属功能",
      },
      { type: "separator" },
      {
        label: "❌ 退出",
        enabled: false,
        title: "桌面版专属功能",
      },
    ];
  }

  let menuRoot = null;
  let lastPointer = { x: 180, y: 180 };

  window.addEventListener(
    "pointerdown",
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
    },
    { passive: true }
  );
  window.addEventListener(
    "contextmenu",
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
    },
    { capture: true, passive: true }
  );

  function injectMenuStyles() {
    if (document.getElementById("moodie-ctx-menu-style")) return;
    const style = document.createElement("style");
    style.id = "moodie-ctx-menu-style";
    style.textContent = `
      .moodie-ctx-backdrop {
        position: fixed; inset: 0; z-index: 99998;
        background: transparent;
      }
      .moodie-ctx-menu, .moodie-ctx-submenu {
        position: fixed; z-index: 99999;
        min-width: 232px;
        background: rgba(28, 28, 34, 0.96);
        color: #f5f5f7;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        padding: 5px;
        box-shadow: 0 14px 38px rgba(0, 0, 0, 0.42), 0 2px 8px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        font: 500 12.5px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        user-select: none;
      }
      .moodie-ctx-submenu {
        position: absolute;
        left: calc(100% - 4px);
        top: -4px;
        display: none;
        min-width: 220px;
      }
      .moodie-ctx-item.has-sub:hover > .moodie-ctx-submenu,
      .moodie-ctx-item.has-sub.sub-open > .moodie-ctx-submenu {
        display: block;
      }
      .moodie-ctx-menu.flip-x .moodie-ctx-submenu {
        left: auto;
        right: calc(100% - 4px);
      }
      .moodie-ctx-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 6px 10px 6px 26px;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        color: #f5f5f7;
        transition: background 0.12s ease;
      }
      .moodie-ctx-item:hover {
        background: rgba(255, 93, 158, 0.85);
        color: #ffffff;
      }
      .moodie-ctx-item.is-disabled {
        color: rgba(255, 255, 255, 0.38);
        cursor: default;
      }
      .moodie-ctx-item.is-disabled:hover {
        background: transparent;
        color: rgba(255, 255, 255, 0.38);
      }
      .moodie-ctx-check {
        position: absolute;
        left: 8px;
        width: 14px;
        text-align: center;
        font-size: 11px;
        font-weight: 700;
      }
      .moodie-ctx-arrow {
        font-size: 10px;
        opacity: 0.72;
      }
      .moodie-ctx-sep {
        height: 1px;
        margin: 4px 6px;
        background: rgba(255, 255, 255, 0.12);
      }
      .moodie-ctx-swatch {
        display: inline-block;
        width: 10px; height: 10px;
        border-radius: 50%;
        margin-right: 6px;
        border: 1px solid rgba(255,255,255,0.45);
        vertical-align: -1px;
      }
    `;
    document.head.appendChild(style);
  }

  function closeMenu() {
    if (menuRoot) {
      menuRoot.remove();
      menuRoot = null;
    }
  }

  function renderItems(items, container) {
    items.forEach((entry) => {
      if (entry.type === "separator") {
        const sep = document.createElement("div");
        sep.className = "moodie-ctx-sep";
        container.appendChild(sep);
        return;
      }
      const row = document.createElement("div");
      row.className = "moodie-ctx-item";
      if (entry.enabled === false) row.classList.add("is-disabled");
      if (entry.title) row.title = entry.title;

      const check = document.createElement("span");
      check.className = "moodie-ctx-check";
      if (entry.checked) {
        check.textContent = entry.type === "radio" ? "●" : "✓";
      }
      row.appendChild(check);

      const labelWrap = document.createElement("span");
      if (entry.hex) {
        const sw = document.createElement("span");
        sw.className = "moodie-ctx-swatch";
        sw.style.background = entry.hex;
        labelWrap.appendChild(sw);
      }
      const txt = document.createElement("span");
      txt.textContent = entry.label;
      labelWrap.appendChild(txt);
      row.appendChild(labelWrap);

      if (Array.isArray(entry.submenu)) {
        row.classList.add("has-sub");
        const arrow = document.createElement("span");
        arrow.className = "moodie-ctx-arrow";
        arrow.textContent = "▸";
        row.appendChild(arrow);

        const sub = document.createElement("div");
        sub.className = "moodie-ctx-submenu";
        renderItems(entry.submenu, sub);
        row.appendChild(sub);

        row.addEventListener("click", (e) => {
          e.stopPropagation();
          const wasOpen = row.classList.contains("sub-open");
          container.querySelectorAll(".moodie-ctx-item.has-sub").forEach((el) => el.classList.remove("sub-open"));
          if (!wasOpen) row.classList.add("sub-open");
        });
      } else if (entry.enabled !== false && typeof entry.click === "function") {
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          closeMenu();
          entry.click(entry);
        });
      }

      container.appendChild(row);
    });
  }

  function showMenu(customX, customY) {
    injectMenuStyles();
    closeMenu();

    const wrap = document.createElement("div");
    const backdrop = document.createElement("div");
    backdrop.className = "moodie-ctx-backdrop";
    backdrop.addEventListener("pointerdown", closeMenu);
    backdrop.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      closeMenu();
    });

    const menu = document.createElement("div");
    menu.className = "moodie-ctx-menu";
    menu.setAttribute("role", "menu");
    renderItems(buildMenuTemplate(), menu);

    wrap.appendChild(backdrop);
    wrap.appendChild(menu);
    document.body.appendChild(wrap);
    menuRoot = wrap;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = menu.getBoundingClientRect();
    let x = typeof customX === "number" ? customX : lastPointer.x;
    let y = typeof customY === "number" ? customY : lastPointer.y;
    if (x + rect.width + 12 > vw) x = Math.max(8, vw - rect.width - 12);
    if (y + rect.height + 12 > vh) y = Math.max(8, vh - rect.height - 12);
    if (x + rect.width + 225 > vw) menu.classList.add("flip-x");
    menu.style.left = x + "px";
    menu.style.top = y + "px";
  }

  if (!window.electronAPI) {
    window.electronAPI = {
      isElectron: false,
      isWebAdapter: true,
      dragStart: () => {},
      dragMove: () => {},
      dragEnd: () => {},
      setIgnore: () => {},
      showMenu: (x, y) => showMenu(x, y),
      quit: () => {},
      onMenuAction: (cb) => {
        if (typeof cb === "function") actionListeners.push(cb);
      },
      syncUiState: (stateObj) => {
        if (!stateObj || typeof stateObj !== "object") return;
        if (stateObj.theme) uiMirror.theme = stateObj.theme;
        if (stateObj.systemState) uiMirror.systemState = stateObj.systemState;
        if (typeof stateObj.paused === "boolean") uiMirror.paused = stateObj.paused;
      },
      triggerSystemState: (state, reason, taskName) => {
        emitSystemState({
          type: "system-state",
          state,
          reason: reason || "",
          taskName: taskName || "",
          source: "hud-click",
        });
      },
      onSystemState: (cb) => {
        if (typeof cb === "function") systemStateListeners.push(cb);
      },
    };
  }
})();
