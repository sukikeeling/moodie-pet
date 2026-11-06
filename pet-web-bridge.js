/**
 * Moodie Pet Web Bridge
 * Source: Adapted directly from sukikeeling/moodie-pet/pet.html, main.js, data.js, skins-3d.js, grok-player.js
 * Mounts the full 4-theme desktop pet engine (Ceramic 3D Bone-China Angel Ball, Submarine 3D Holosphere,
 * Grok 53-state / 28-clip Recipe Player, and 2D Colorful SVG + 8 continuous actions doAction1..8)
 * into <section class="viewer" id="viewer"> of moodle-lab.html / moodie-lab.html.
 */
(function () {
  "use strict";

  const viewer = document.getElementById("viewer");
  const botStage = viewer ? (viewer.querySelector(".bot-wrap") || viewer.querySelector(".bot-stage")) : null;
  const bot = document.getElementById("bot");
  const springGroup = document.getElementById("spring-group");
  if (!viewer || !botStage || !bot || !springGroup) return;
  botStage.classList.add("bot-stage");

  // 1. Upgrade DATA.EXPRESSIONS to all 26 expressions (00-25, including 25 Wink from master:data.js)
  if (window.GROKBOT_ORIGINAL && typeof DATA !== "undefined") {
    if (window.GROKBOT_ORIGINAL.EXPRESSIONS && DATA.EXPRESSIONS.length < window.GROKBOT_ORIGINAL.EXPRESSIONS.length) {
      for (let i = DATA.EXPRESSIONS.length; i < window.GROKBOT_ORIGINAL.EXPRESSIONS.length; i++) {
        DATA.EXPRESSIONS.push(window.GROKBOT_ORIGINAL.EXPRESSIONS[i]);
      }
    }
    if (window.GROKBOT_ORIGINAL.POOLS && window.GROKBOT_ORIGINAL.POOLS.playful) {
      DATA.POOLS.playful = window.GROKBOT_ORIGINAL.POOLS.playful.slice();
    }
    if (typeof renderExpressions === "function") {
      renderExpressions();
    }
  }

  // Upgrade GROKBOT_SHAPES from 8 to all 12 shapes (adding egg, bean, teardrop, exclaim from morph-engine.js)
  const EXTRA_SHAPES = [
    ['egg','蛋形','M114.27 8C150 8 198 22 198 96C198 178 158 225 114.27 225C70 225 30 178 30 96C30 22 78 8 114.27 8Z', 1],
    ['bean','豆形','M196 90C196 160 170 215 114 215C90 215 70 205 60 188C52 175 52 150 58 128C46 120 40 105 40 90C40 45 70 20 114 20C158 20 196 45 196 90Z', .8],
    ['teardrop','水滴2','M114.27 6C168 6 200 40 200 92C200 150 160 205 114.27 224C68 205 28 150 28 92C28 40 60 6 114.27 6Z', 1],
    ['exclaim','感叹号','M86 40Q86 30 96 30L132 30Q142 30 142 40L142 180Q142 190 132 190L96 190Q86 190 86 180Z', .45]
  ];
  if (typeof GROKBOT_SHAPES !== "undefined") {
    const shapeRootEl = document.querySelector("#shape-options");
    EXTRA_SHAPES.forEach(item => {
      if (!GROKBOT_SHAPES.some(s => s[0] === item[0])) {
        GROKBOT_SHAPES.push(item);
        if (shapeRootEl) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.shape = item[0];
          button.title = item[1];
          button.classList.add("shape-btn");
          button.innerHTML = `<svg viewBox="0 0 229 229" aria-hidden="true"><path class="shape-swatch" d="${item[2]}"/><ellipse cx="87" cy="102" rx="9" ry="21"/><ellipse cx="143" cy="102" rx="9" ry="21"/></svg>`;
          button.addEventListener("click", () => window.applyShape(item));
          shapeRootEl.appendChild(button);
        }
      }
    });
  }

  // 2. Inject exact CSS from master:pet.html for .mood-tag, .size-ctrl, #fx, #action-fx, #system-hud, and 3D stage
  const styleEl = document.createElement("style");
  styleEl.id = "moodie-pet-desktop-css";
  styleEl.textContent = "  /* mood speech tag（随宠物缩放反向缩放，保持可读） */\n  .mood-tag {\n    position: absolute; bottom: 100%; left: 50%; margin-bottom: 4px;\n    transform: translate(-50%, 0) scale(calc(.6 * var(--inv)));\n    transform-origin: 50% 100%;\n    background: #fff; color: #4a3a5e;\n    padding: 6px 15px; border-radius: 99px;\n    font-size: 13px; font-weight: 700; white-space: nowrap;\n    box-shadow: 0 6px 18px rgba(70,30,110,.28);\n    opacity: 0; pointer-events: none; max-width: 240px;\n    transition: opacity .35s ease, transform .45s cubic-bezier(.34,1.6,.56,1);\n  }\n  .mood-tag.show { opacity: 1; transform: translate(-50%, 0) scale(calc(1 * var(--inv))); }\n  /* Grok 主题：弹出词黑底白字极简风 */\n  body.grok-theme .mood-tag { background: #0d0d0f; color: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.35); }\n\n  /* 尺寸控制（悬停显示，反向缩放保持可点） */\n  .size-ctrl {\n    position: absolute; top: 4px; right: 4px;\n    display: flex; gap: 5px;\n    transform: scale(var(--inv)); transform-origin: 100% 0;\n    opacity: 0; pointer-events: none; transition: opacity .25s ease;\n  }\n  .stage:hover .size-ctrl { opacity: 1; pointer-events: auto; }\n  .size-ctrl button {\n    width: 26px; height: 26px; border-radius: 50%;\n    border: 1px solid rgba(255,255,255,.75);\n    background: rgba(255,255,255,.93); color: #4a3a5e;\n    font-size: 16px; font-weight: 700; line-height: 1;\n    box-shadow: 0 3px 10px rgba(70,30,110,.25); cursor: pointer;\n    display: grid; place-items: center;\n  }\n  .size-ctrl button:hover { background: #fff; }\n  .size-ctrl button:active { transform: scale(.92); }\n\n  /* ===== body parts / accessories (ported) ===== */\n  .body-part, .accessory { display: none; }\n  .body-part { fill: none; stroke: var(--bot-color); stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; }\n  .body-part circle, .body-part ellipse { fill: var(--bot-color); stroke: none; }\n  .body-part.enabled, .accessory.enabled, .quick-wave #part-hands { display: block; }\n  .back-accessory { fill: #7657d8; opacity: .88; }\n  .front-accessory { stroke: #171813; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }\n  .front-accessory circle { fill: rgba(255,255,255,.12); }\n  #accessory-straw-hat { fill: #e9bd57; stroke: #b57b24; stroke-width: 3; }\n  #accessory-straw-hat .hat-band { fill: #d94b5d; stroke: none; }\n  #accessory-glasses { fill: none; }\n  #accessory-bowtie { fill: #ff2d8b; stroke: none; }\n\n  /* ===== state actions ===== */\n  .bot.act-bounce { animation: bounce .85s ease; }\n  .bot.act-tilt { animation: tilt .8s ease; }\n  .bot.act-scan #eyes { animation: scan .8s ease; }\n  .bot.act-turn { animation: turn .9s ease; }\n  .bot.act-pulse { animation: pulse .9s ease; }\n  .bot.act-glitch { animation: glitch .55s steps(2); }\n  @keyframes bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-34px) scale(.96,1.04)} 65%{transform:translateY(4px) scale(1.05,.94)} }\n  @keyframes tilt { 35%{transform:rotate(-19deg) translate(-8px,5px)} 70%{transform:rotate(8deg)} }\n  @keyframes scan { 0%,100%{transform:translate(0)} 30%{transform:translate(-24px,2px)} 70%{transform:translate(24px,-2px)} }\n  @keyframes turn { 0%,100%{transform:rotateY(0)} 48%{transform:rotateY(180deg) scale(.82)} }\n  @keyframes pulse { 0%,100%{transform:scale(1)} 35%{transform:scale(1.08,.92)} 65%{transform:scale(.94,1.08)} }\n  @keyframes glitch { 0%,100%{transform:translate(0)} 25%{transform:translate(-9px,3px);filter:drop-shadow(8px 0 #e36f3d)} 50%{transform:translate(10px,-3px);filter:drop-shadow(-8px 0 #79e2d0)} 75%{transform:translate(-4px,1px)} }\n\n  /* ===== quick jelly actions ===== */\n  .bot.quick-bounce { animation: quick-bounce .75s cubic-bezier(.3,.8,.4,1); }\n  .bot.quick-shake { animation: quick-shake .65s ease; }\n  .bot.quick-peek { animation: quick-peek .9s ease; }\n  .bot.quick-pinch { animation: quick-pinch 1.12s cubic-bezier(.34,1.45,.56,1); }\n  .bot.quick-pinch #eyes { transform-box: fill-box; transform-origin: center; animation: pinch-eyes 1.12s cubic-bezier(.34,1.45,.56,1); }\n  .bot.quick-squish { animation: quick-squish .8s ease; }\n  .bot.quick-wave #hand-right { transform-box: fill-box; transform-origin: 0 0; animation: quick-wave .6s ease 2; }\n  @keyframes quick-bounce { 0%,100%{transform:translateY(0) scale(1)} 38%{transform:translateY(-48px) scale(.95,1.05)} 60%{transform:translateY(3px) scale(1.08,.9)} }\n  @keyframes quick-shake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-13deg)} 40%{transform:rotate(13deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(8deg)} }\n  @keyframes quick-peek { 0%,100%{transform:translateX(0) rotate(0)} 35%{transform:translateX(-78px) rotate(-16deg)} 70%{transform:translateX(62px) rotate(12deg)} }\n  @keyframes quick-pinch { 0%,100%{transform:scale(1)} 24%{transform:scale(.62,1.14)} 44%{transform:scale(1.13,.89)} 61%{transform:scale(.91,1.08)} 76%{transform:scale(1.05,.96)} 89%{transform:scale(.98,1.02)} }\n  @keyframes pinch-eyes { 0%,100%{transform:scaleX(1)} 24%{transform:scaleX(.56)} 44%{transform:scaleX(1.16)} 61%{transform:scaleX(.9)} }\n  @keyframes quick-squish { 0%,100%{transform:scale(1)} 30%{transform:scale(1.15,.72) translateY(20px)} 60%{transform:scale(.86,1.18) translateY(-14px)} }\n  @keyframes quick-wave { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-70deg)} }\n  .bot.quick-celebrate { animation: quick-celebrate 1s ease; }\n  @keyframes quick-celebrate { 0%,100%{transform:translateY(0) scale(1,1)} 30%{transform:translateY(-26px) scale(.94,1.08)} 55%{transform:translateY(2px) scale(1.06,.92)} 80%{transform:translateY(-12px) scale(.97,1.04)} }\n\n  /* ===== 状态特效层（轨道激光 / 雷达波纹 / 加载弧 / 警报脉冲 / 扫描光束 + 粒子） ===== */\n  #fx { position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; overflow:visible; z-index:0; }\n  .bot3d { position:relative; z-index:2; grid-area: 1 / 1; }\n  #fx > span, #fx::before, #fx::after { position:absolute; left:50%; top:50%; }\n  #fx::before, #fx::after { content:\"\"; }\n\n  /* 轨道：两条对向绕圆球转的无接触彩虹条 */\n  #fx.fx-orbit .rainbow-ring {\n    position: absolute; left: 50%; top: 50%; border-radius: 50%;\n    pointer-events: none; will-change: transform;\n  }\n  /* 第一条彩虹条：顺时针环绕（粉-黄-绿），倾角 -24deg，粗 8px，完全悬浮在球体外围（无接触） */\n  #fx.fx-orbit .ring-1 {\n    width: 200px; height: 84px; margin: -42px 0 0 -100px;\n    border: 8px solid transparent;\n    border-top-color: #ff5d9e;\n    border-right-color: #ffd84d;\n    box-shadow: 0 0 16px rgba(255,93,158,.8), 0 0 28px rgba(255,216,77,.55);\n    animation: fx-orbit-spin-cw 3.0s linear infinite;\n  }\n  /* 第二条彩虹条：逆时针对向反向环绕（青-蓝-紫），倾角 32deg，粗 8px，独立悬浮（无接触） */\n  #fx.fx-orbit .ring-2 {\n    width: 218px; height: 96px; margin: -48px 0 0 -109px;\n    border: 8px solid transparent;\n    border-top-color: #2f86ed;\n    border-left-color: #79e2d0;\n    border-bottom-color: #8656f6;\n    box-shadow: 0 0 16px rgba(47,134,237,.8), 0 0 30px rgba(134,86,246,.55);\n    animation: fx-orbit-spin-ccw 4.2s linear infinite;\n  }\n  @keyframes fx-orbit-spin-cw {\n    0%   { transform: rotate(-24deg) rotateZ(0deg); }\n    100% { transform: rotate(-24deg) rotateZ(360deg); }\n  }\n  @keyframes fx-orbit-spin-ccw {\n    0%   { transform: rotate(32deg) rotateZ(360deg); }\n    100% { transform: rotate(32deg) rotateZ(0deg); }\n  }\n\n  /* 雷达：外传波纹（涟漪向外扩散并淡出） */\n  #fx.fx-radar::before, #fx.fx-radar::after { width:90px; height:90px; margin:-45px 0 0 -45px; border-radius:50%;\n    border:2px solid #08b9a9; box-shadow:0 0 10px rgba(8,185,169,.6); opacity:0; animation:fx-ripple 2.4s ease-out infinite; }\n  #fx.fx-radar::after { border-color:#08c77a; box-shadow:0 0 10px rgba(8,199,122,.6); animation-delay:.8s; }\n  #fx.fx-radar > .ripple { width:90px; height:90px; margin:-45px 0 0 -45px; border-radius:50%; border:2px solid #2f86ed;\n    box-shadow:0 0 10px rgba(47,134,237,.5); opacity:0; animation:fx-ripple 2.4s ease-out infinite 1.6s; }\n  @keyframes fx-ripple { 0%{transform:scale(.35);opacity:.95} 70%{opacity:.35} 100%{transform:scale(3.4);opacity:0} }\n\n  /* 加载：旋转霓虹弧 */\n  #fx.fx-loading::before { width:156px; height:156px; margin:-78px 0 0 -78px; border-radius:50%;\n    border:4px solid rgba(255,93,158,.16); border-top-color:#ff5d9e; box-shadow:0 0 18px rgba(255,93,158,.45); animation:fx-spin 1.1s linear infinite; }\n\n  /* 警报：红色脉冲环 */\n  #fx.fx-alert::before { width:188px; height:188px; margin:-94px 0 0 -94px; border-radius:50%;\n    border:3px solid #ff3347; box-shadow:0 0 26px #ff3347, inset 0 0 16px rgba(255,51,71,.3); animation:fx-pulse 1s ease-in-out infinite; }\n  @keyframes fx-pulse { 0%,100%{transform:scale(.92);opacity:.55} 50%{transform:scale(1.08);opacity:1} }\n\n  /* 扫描：横扫光束 */\n  #fx.fx-scan { overflow:hidden; }\n  #fx.fx-scan::before { width:14px; height:170px; margin-top:-85px; margin-left:-7px;\n    background:linear-gradient(to bottom, transparent, #79e2d0 50%, transparent); filter:blur(2px);\n    box-shadow:0 0 18px #79e2d0; animation:fx-sweep 1.6s ease-in-out infinite; border-radius:50%; }\n  @keyframes fx-sweep { 0%{transform:translateX(-72px)} 50%{transform:translateX(72px)} 100%{transform:translateX(-72px)} }\n  @keyframes fx-spin { to { transform:rotate(360deg); } }\n\n  /* 加载三圆点（loading 类状态，身体下方跳动） */\n  #fx .fx-dots { position:absolute; left:50%; top:63%; display:flex; gap:9px;\n    transform:translate(-50%,-50%); pointer-events:none; }\n  #fx .fx-dots i { width:11px; height:11px; border-radius:50%; background:var(--bot-color);\n    opacity:.5; animation:fx-dot-bounce 1.15s ease-in-out infinite; }\n  #fx .fx-dots i:nth-child(2) { animation-delay:.16s; }\n  #fx .fx-dots i:nth-child(3) { animation-delay:.32s; }\n  @keyframes fx-dot-bounce { 0%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-13px);opacity:1} }\n\n  /* 数学曲线星轨条（math-curve-loaders 灵感）：彩色流光沿参数曲线游走 + 渐隐尾迹 */\n  #fx.fx-curve { z-index: 0; }   /* 曲线层放身体后面 */\n  #fx.fx-curve .curve-wrap { position:absolute; left:0; top:0; width:228px; height:228px; pointer-events:none; }\n  #fx.fx-curve .curve-wrap circle { will-change: cx,cy,r; }\n\n  /* Grok 主题黑球光泽高光（body 上叠加渐变，theme=grok 时显示） */\n  #body-shine { opacity: 0; pointer-events: none; fill: url(#grok-shine); transition: opacity .5s ease; }\n  body.grok-theme #body-shine { opacity: 1; }\n\n  /* Grok 彩虹拖尾：从身体边缘甩出彩虹渐变弧线（红→橙→黄→绿→青→蓝→紫） */\n  .fx-trail { position:absolute; width:104px; height:4px; border-radius:3px;\n    background: linear-gradient(90deg, #ff3347, #ff9800, #ffd84d, #08c77a, #2f86ed, #8656f6);\n    filter: blur(.4px); opacity:0; pointer-events:none; animation: fx-trail .85s ease-out forwards; }\n  @keyframes fx-trail { 0%{ transform: rotate(var(--rot)) translateX(30px) scaleX(.25); opacity:0 }\n    22%{ opacity:.95 } 100%{ transform: rotate(var(--rot)) translateX(var(--dist,130px)) scaleX(1.15); opacity:0 } }\n\n  /* Grok 附加元素：感叹号底部圆点 / 右上角蓝点 / loading 三圆点两侧小黑点 */\n  #exclaim-dot { fill: var(--bot-color); opacity:0; pointer-events:none; transition: opacity .25s ease; }\n  #grok-blue-dot { fill: #2f86ed; opacity:0; pointer-events:none; transition: opacity .25s ease; }\n  #grok-dot-l, #grok-dot-r { fill: var(--bot-color); opacity:0; pointer-events:none; transition: opacity .25s ease; }\n\n  /* 粒子（JS 生成 span）——增强粒子绽放：加粗、鲜亮、双层发光光晕 */\n  .fx-heart, .fx-z, .fx-spark, .fx-note, .fx-dot, .fx-confetti { position:absolute; }\n  .fx-heart { color:#ff2d8b; font-size:18px; text-shadow:0 0 6px rgba(255,45,139,.6); animation:fx-float 1.6s ease-out forwards; }\n  .fx-z { color:#6b5d7e; font-size:20px; font-weight:700; animation:fx-float 1.9s ease-out forwards; }\n  .fx-note { color:#8656f6; font-size:16px; text-shadow:0 0 6px rgba(134,86,246,.6); animation:fx-float 1.6s ease-out forwards; }\n  /* 视频同款音符：头顶生成，粉/黄上浮 + 左右摇摆（1.7s 节奏循环） */\n  .fx-note-swing { position:absolute; font-size:30px; line-height:1; animation:fx-note-swing 1.7s ease-out forwards; }\n  .fx-note-swing.c-pink { color:#ff69b4; text-shadow:0 0 16px rgba(255,105,180,.95), 0 0 30px rgba(255,105,180,.5); }\n  .fx-note-swing.c-yellow { color:#ffd84d; text-shadow:0 0 16px rgba(255,216,77,.95), 0 0 30px rgba(255,216,77,.5); }\n  @keyframes fx-note-swing {\n    0%   { transform:translate(0,0) rotate(-8deg) scale(.4); opacity:0; }\n    12%  { transform:translate(-6px,-12px) rotate(-6deg) scale(.75); opacity:1; }\n    38%  { transform:translate(9px,-34px) rotate(7deg) scale(1); }\n    62%  { transform:translate(-8px,-58px) rotate(-9deg) scale(1.08); }\n    85%  { transform:translate(6px,-82px) rotate(6deg) scale(1.12); opacity:.85; }\n    100% { transform:translate(-4px,-108px) rotate(-4deg) scale(1.18); opacity:0; }\n  }\n  .fx-spark { color:#ffd84d; font-size:14px; text-shadow:0 0 8px rgba(255,216,77,.8); animation:fx-twinkle 1.2s ease-out forwards; }\n  /* 视频同款星星：四周放射状扩散 + 放大 + 淡出（金/白，中间点 JS 预计算 --dx1/--dx2） */\n  .fx-star-burst { position:absolute; font-size:28px; line-height:1; animation:fx-star-burst 1.0s ease-out forwards; }\n  .fx-star-burst.c-gold { color:#ffd84d; text-shadow:0 0 14px rgba(255,216,77,.95), 0 0 28px rgba(255,216,77,.5); }\n  .fx-star-burst.c-white { color:#ffffff; text-shadow:0 0 14px rgba(255,255,255,.95), 0 0 28px rgba(255,255,255,.5); }\n  @keyframes fx-star-burst {\n    0%   { transform:translate(0,0) scale(.25) rotate(0deg); opacity:0; }\n    15%  { transform:translate(var(--dx1), var(--dy1)) scale(.6) rotate(28deg); opacity:1; }\n    50%  { transform:translate(var(--dx2), var(--dy2)) scale(1.1) rotate(58deg); opacity:.95; }\n    100% { transform:translate(var(--dx), var(--dy)) scale(1.5) rotate(92deg); opacity:0; }\n  }\n  .fx-dot { width:9px; height:9px; border-radius:50%; background:#4a3a5e; animation:fx-bob 1.2s ease-in-out forwards; }\n  .fx-confetti { width:8px; height:12px; border-radius:2px; animation:fx-burst 1.5s ease-out forwards; }\n  \n  /* 粒子绽放（升级版：高饱和饱满大粒子 + 璀璨双层发光） */\n  .fx-fw {\n    position: absolute;\n    width: 13px; height: 13px;\n    border-radius: 50%;\n    pointer-events: none;\n    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;\n    animation: fw-burst 1.15s cubic-bezier(0.18, 0.85, 0.32, 1) forwards;\n  }\n  @keyframes fw-burst {\n    0%   { transform: translate(0,0) scale(1.6); opacity: 1; filter: brightness(1.35); }\n    60%  { opacity: 1; filter: brightness(1.15); }\n    100% { transform: translate(var(--dx), var(--dy)) scale(0.35); opacity: 0; }\n  }\n  \n  /* ===== 动作专用特效样式（彩色压感蜡笔触流星 / 弧线 / 特殊形态） ===== */\n  #action-fx {\n    position: absolute; inset: 0;\n    pointer-events: none; overflow: visible; z-index: 5;\n  }\n  .crayon-meteor {\n    position: absolute;\n    border-radius: 999px;\n    pointer-events: none;\n    will-change: transform, opacity;\n  }\n  .crayon-streamer {\n    position: absolute;\n    border-radius: 999px;\n    pointer-events: none;\n    will-change: transform, opacity;\n  }\n  \n  /* 动作5：毛笔元素 */\n  .brush-holder {\n    position: absolute; left: 114px; top: 114px;\n    width: 0; height: 0;\n    pointer-events: none;\n    transform-origin: 0 0;\n  }\n  .brush-body {\n    position: absolute;\n    left: -12px; top: -140px;\n    width: 24px; height: 130px;\n    border-radius: 12px 12px 6px 6px;\n    background: linear-gradient(180deg, #2b1d0c 0%, #68431e 30%, #3e2612 85%, #d4af37 92%, #ffffff 96%, #222222 100%);\n    box-shadow: 0 4px 14px rgba(0,0,0,0.38), inset 2px 0 4px rgba(255,255,255,0.25);\n  }\n  .brush-tip {\n    position: absolute;\n    left: -18px; top: -12px;\n    width: 36px; height: 46px;\n    border-radius: 50% 50% 60% 60% / 30% 30% 70% 70%;\n    background: radial-gradient(circle at 40% 60%, var(--bot-color), #b01a58);\n    box-shadow: 0 4px 16px rgba(255,45,139,0.5);\n    transform: rotate(180deg);\n  }\n\n  /* 动作6：感叹号竖柱与蓝球 */\n  .exclaim-bar {\n    position: absolute;\n    left: 99px; top: 26px;\n    width: 32px; height: 82px;\n    border-radius: 16px 16px 14px 14px;\n    background: var(--bot-color);\n    box-shadow: 0 6px 18px rgba(0,0,0,0.28);\n    transform-origin: 50% 100%;\n  }\n  .blue-dot-pop {\n    position: absolute;\n    width: 24px; height: 24px;\n    border-radius: 50%;\n    background: radial-gradient(circle at 35% 35%, #79e2d0, #2f86ed 70%, #1752b0 100%);\n    box-shadow: 0 0 16px rgba(47,134,237,0.75), 0 4px 12px rgba(0,0,0,0.3);\n    pointer-events: none;\n  }\n  \n  /* 动作4：三横排小球 */\n  .tri-dot {\n    position: absolute;\n    width: 26px; height: 26px;\n    border-radius: 50%;\n    top: 101px;\n    pointer-events: none;\n    box-shadow: 0 4px 14px rgba(0,0,0,0.3);\n    transition: transform .32s cubic-bezier(.34,1.5,.56,1), opacity .32s ease, filter .32s ease;\n  }\n  .fx-rocket { position:absolute; width:4px; height:4px; border-radius:50%; animation:fw-rise .55s ease-out forwards; }\n  @keyframes fw-rise { 0%{transform:translateY(0);opacity:1} 75%{opacity:1} 100%{transform:translateY(var(--rise,-160px));opacity:0} }\n  .fx-tear { position:absolute; color:#5ec5ff; font-size:14px; text-shadow:0 0 5px rgba(94,197,255,.6); animation:fx-fall 1.6s ease-in forwards; }\n  @keyframes fx-fall { 0%{transform:translateY(-10px);opacity:0} 15%{opacity:1} 100%{transform:translateY(60px);opacity:0} }\n  .fx-exclaim { position:absolute; color:#ff5d9e; font-size:22px; font-weight:900; text-shadow:0 0 8px rgba(255,93,158,.8); animation:fx-pop .8s ease-out forwards; }\n  @keyframes fx-pop { 0%{transform:scale(0) translateY(8px);opacity:0} 40%{transform:scale(1.3) translateY(-4px);opacity:1} 100%{transform:scale(.8) translateY(-20px);opacity:0} }\n  .fx-steam { position:absolute; width:12px; height:12px; border-radius:50%; background:rgba(180,180,190,.5); animation:fx-steam 1.4s ease-out forwards; }\n  @keyframes fx-steam { 0%{transform:translateY(0) scale(.4);opacity:0} 25%{opacity:.8} 100%{transform:translateY(-50px) scale(1.4);opacity:0} }\n  .fx-haha { position:absolute; color:#ff9800; font-size:16px; font-weight:900; text-shadow:0 0 6px rgba(255,152,0,.7); animation:fx-haha 1.2s ease-out forwards; }\n  @keyframes fx-haha { 0%{transform:scale(.4) translateY(0);opacity:0} 30%{opacity:1} 100%{transform:scale(1.1) translateY(-40px) rotate(8deg);opacity:0} }\n  @keyframes fx-float { 0%{transform:translate(0,0) scale(.5);opacity:0} 15%{opacity:1} 100%{transform:translate(var(--dx,0),-130px) scale(1.15);opacity:0} }\n  @keyframes fx-bob { 0%{transform:translateY(0);opacity:0} 30%{opacity:1} 100%{transform:translateY(-34px);opacity:0} }\n  @keyframes fx-burst { 0%{transform:translate(0,0) rotate(0);opacity:1} 100%{transform:translate(var(--dx,0),var(--dy,80px)) rotate(var(--rot,360deg));opacity:0} }\n  @keyframes fx-twinkle { 0%{transform:scale(0) rotate(0);opacity:0} 40%{transform:scale(1.4) rotate(40deg);opacity:1} 100%{transform:scale(.2) rotate(120deg);opacity:0} }\n\n  /* ===== v2.0 新增：空闲/深夜「柔光呼吸」光晕层 ===== */\n  #fx.fx-soft-breath::before {\n    width: 196px; height: 196px; margin: -98px 0 0 -98px; border-radius: 50%;\n    background: radial-gradient(circle, rgba(255,214,148,0.42) 0%, rgba(164,130,255,0.24) 52%, rgba(121,226,208,0) 76%);\n    filter: blur(8px);\n    animation: fx-soft-breath-aura 4.2s ease-in-out infinite;\n    pointer-events: none;\n  }\n  #fx.fx-soft-breath::after {\n    width: 152px; height: 152px; margin: -76px 0 0 -76px; border-radius: 50%;\n    border: 2px solid rgba(255,222,173,0.48);\n    box-shadow: 0 0 24px rgba(255,214,148,0.45), inset 0 0 18px rgba(164,130,255,0.28);\n    animation: fx-soft-breath-ring 4.2s ease-in-out infinite;\n    pointer-events: none;\n  }\n  @keyframes fx-soft-breath-aura {\n    0%, 100% { transform: scale(0.86); opacity: 0.38; }\n    50%      { transform: scale(1.16); opacity: 0.92; }\n  }\n  @keyframes fx-soft-breath-ring {\n    0%, 100% { transform: scale(0.88); opacity: 0.25; }\n    50%      { transform: scale(1.08); opacity: 0.78; }\n  }\n\n  /* ===== v2.0 新增：系统/Agent 感知状态 HUD 胶囊 ===== */\n  .system-hud-pill {\n    position: absolute; bottom: -18px; left: 50%;\n    transform: translate(-50%, 0) scale(calc(0.92 * var(--inv)));\n    transform-origin: 50% 0%;\n    display: inline-flex; align-items: center; gap: 6px;\n    padding: 3px 11px; border-radius: 999px;\n    font-size: 11px; font-weight: 700; letter-spacing: 0.2px;\n    color: rgba(255,255,255,0.95);\n    background: rgba(22, 24, 34, 0.78);\n    border: 1px solid rgba(255,255,255,0.18);\n    box-shadow: 0 4px 12px rgba(0,0,0,0.26);\n    backdrop-filter: blur(8px);\n    white-space: nowrap; cursor: pointer; z-index: 10;\n    opacity: 0.86;\n    transition: all .28s ease;\n  }\n  .system-hud-pill:hover {\n    opacity: 1;\n    transform: translate(-50%, -1px) scale(calc(0.98 * var(--inv)));\n  }\n  .system-hud-pill .hud-dot {\n    width: 7px; height: 7px; border-radius: 50%;\n    background: #08c77a;\n    box-shadow: 0 0 8px #08c77a;\n  }\n  .system-hud-pill[data-state=\"coding\"] {\n    background: rgba(16, 48, 78, 0.86);\n    border-color: rgba(56, 189, 248, 0.55);\n  }\n  .system-hud-pill[data-state=\"coding\"] .hud-dot {\n    background: #38bdf8;\n    box-shadow: 0 0 10px #38bdf8;\n    animation: hud-blink 1.1s ease-in-out infinite;\n  }\n  .system-hud-pill[data-state=\"error\"] {\n    background: rgba(88, 18, 34, 0.90);\n    border-color: rgba(255, 71, 87, 0.7);\n  }\n  .system-hud-pill[data-state=\"error\"] .hud-dot {\n    background: #ff4757;\n    box-shadow: 0 0 12px #ff4757;\n    animation: hud-blink 0.55s ease-in-out infinite;\n  }\n  .system-hud-pill[data-state=\"sleep\"] {\n    background: rgba(42, 32, 68, 0.82);\n    border-color: rgba(255, 214, 148, 0.45);\n  }\n  .system-hud-pill[data-state=\"sleep\"] .hud-dot {\n    background: #ffd694;\n    box-shadow: 0 0 10px #ffd694;\n    animation: hud-blink 3.2s ease-in-out infinite;\n  }\n  @keyframes hud-blink {\n    0%, 100% { opacity: 0.45; transform: scale(0.88); }\n    50%      { opacity: 1; transform: scale(1.22); }\n  }" + `
    .bot-stage {
      perspective: 900px;
      position: relative;
      width: 230px !important;
      height: 230px !important;
      margin: 18px auto 26px !important;
      display: grid !important;
      place-items: center !important;
      transform-origin: 50% 60%;
      transition: transform .35s cubic-bezier(.34,1.45,.56,1);
      --inv: 1;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
    .bot-stage.dragging { cursor: grabbing; }
    .bot-stage .mood-tag {
      z-index: 25;
      bottom: calc(100% + 2px);
    }
    .bot-stage.grok-theme .mood-tag {
      background: #0d0d0f;
      color: #fff;
      box-shadow: 0 6px 18px rgba(0,0,0,.35);
    }
    .bot-stage .size-ctrl {
      z-index: 26;
      top: 0px;
      right: -8px;
    }
    .bot-stage:hover .size-ctrl {
      opacity: 1;
      pointer-events: auto;
    }
    .bot-stage #system-hud {
      bottom: -18px;
      z-index: 25;
    }
    .bot.quick-celebrate { animation: quick-celebrate 1s ease; }
    @keyframes quick-celebrate { 0%,100%{transform:translateY(0) scale(1,1)} 30%{transform:translateY(-26px) scale(.94,1.08)} 55%{transform:translateY(2px) scale(1.06,.92)} 80%{transform:translateY(-12px) scale(.97,1.04)} }
    .pet-theme-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      margin: 6px 0 8px;
      position: relative;
      z-index: 15;
    }
    .pet-theme-bar button {
      padding: 5px 11px;
      border-radius: 99px;
      border: 1px solid rgba(110,60,150,.18);
      background: rgba(255,255,255,.82);
      color: #4a3a5e;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all .18s ease;
    }
    .pet-theme-bar button:hover {
      background: #fff;
      transform: translateY(-1px);
    }
    .pet-theme-bar button.active {
      background: #171813;
      color: #fff;
      border-color: #171813;
      box-shadow: 0 4px 12px rgba(0,0,0,.18);
    }
    .pet-director-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    .pet-director-grid button {
      padding: 6px 4px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,.78);
      color: var(--text);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s ease;
    }
    .pet-director-grid button:hover {
      border-color: var(--bot-color);
      background: #fff;
    }
    .pet-grok-panel {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--line);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .pet-grok-panel select {
      flex: 1;
      min-width: 120px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #fff;
      padding: 0 8px;
      font-size: 11px;
      color: var(--text);
    }
  `;
  document.head.appendChild(styleEl);

  // 3. Inject missing SVG defs & Grok overlay circles into #bot so doAction1..8 and Grok work 1:1
  const defs = bot.querySelector("defs");
  if (defs && !defs.querySelector("#rainbow-c1")) {
    defs.insertAdjacentHTML("beforeend", `
      <radialGradient id="grok-shine" cx="34%" cy="28%" r="78%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".22"/>
        <stop offset="38%" stop-color="#ffffff" stop-opacity=".05"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="grok-rim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="72%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity=".16"/>
      </linearGradient>
      <linearGradient id="rainbow-c1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff5d9e"/>
        <stop offset="40%" stop-color="#ffd84d"/>
        <stop offset="80%" stop-color="#08c77a"/>
        <stop offset="100%" stop-color="#2f86ed"/>
      </linearGradient>
      <linearGradient id="rainbow-c2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#8656f6"/>
        <stop offset="50%" stop-color="#2f86ed"/>
        <stop offset="100%" stop-color="#79e2d0"/>
      </linearGradient>
      <linearGradient id="rainbow-c3" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff2d8b"/>
        <stop offset="50%" stop-color="#ff9800"/>
        <stop offset="100%" stop-color="#ffd84d"/>
      </linearGradient>
      <linearGradient id="rainbow-cyan-green" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#79e2d0"/>
        <stop offset="50%" stop-color="#08c77a"/>
        <stop offset="100%" stop-color="#ffd84d"/>
      </linearGradient>
      <filter id="crayon-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `);
  }

  const shapeBodyPathEl = document.getElementById("shape-body-path");
  const eyesGroupEl = document.getElementById("eyes");
  if (shapeBodyPathEl && eyesGroupEl && !document.getElementById("body-shine")) {
    const dAttr = shapeBodyPathEl.getAttribute("d");
    eyesGroupEl.insertAdjacentHTML("beforebegin", `
      <path id="body-shine" d="${dAttr}" style="fill:url(#grok-shine);pointer-events:none;opacity:0;transition:opacity .35s ease"/>
      <circle id="exclaim-dot" cx="114" cy="218" r="26" style="fill:var(--bot-color);opacity:0;pointer-events:none;transition:opacity .18s ease"/>
      <circle id="grok-blue-dot" cx="190" cy="50" r="9" style="fill:#2f86ed;opacity:0;pointer-events:none;transition:opacity .2s ease"/>
      <circle id="grok-dot-l" cx="52" cy="114" r="17" style="fill:var(--bot-color);opacity:0;pointer-events:none;transition:opacity .2s ease"/>
      <circle id="grok-dot-r" cx="176" cy="114" r="17" style="fill:var(--bot-color);opacity:0;pointer-events:none;transition:opacity .2s ease"/>
    `);
  }

  // 4. Wrap #bot in .bot3d#bot3d and inject .mood-tag, .size-ctrl, #fx, #action-fx, #grok-container, #skin3d-container, #system-hud into .bot-stage
  const bot3d = document.createElement("div");
  bot3d.className = "bot3d";
  bot3d.id = "bot3d";
  botStage.insertBefore(bot3d, bot);
  bot3d.appendChild(bot);

  botStage.insertAdjacentHTML("afterbegin", `
    <div class="mood-tag show" id="mood-tag">🏺 3D 骨瓷天使球 ✓</div>
    <div class="size-ctrl" id="size-ctrl" title="尺寸缩放控制">
      <button type="button" data-size="minus" title="缩小 (−)">−</button>
      <button type="button" data-size="reset" title="默认大小 (1:1)">1:1</button>
      <button type="button" data-size="plus" title="放大 (+)">+</button>
    </div>
    <div id="fx"><span class="rainbow-ring ring-1"></span><span class="rainbow-ring ring-2"></span><span class="ripple"></span></div>
    <div id="action-fx"></div>
    <div id="grok-container" style="display:none; grid-area: 1 / 1; width:230px; height:230px; position:relative; z-index:2; pointer-events:auto; filter: drop-shadow(0 16px 14px rgba(0,0,0,.42));"></div>
    <div id="skin3d-container" style="display:none; grid-area: 1 / 1; width:230px; height:230px; position:relative; z-index:2; pointer-events:auto;"></div>
  `);

  botStage.insertAdjacentHTML("beforeend", `
    <div class="system-hud-pill" id="system-hud" data-state="normal" title="点击切换系统感知模式（专注搬砖 / 异常警告 / 柔光呼吸 / 灵动伴随）">
      <span class="hud-dot" id="hud-dot"></span>
      <span id="hud-text">✨ 灵动伴随</span>
    </div>
  `);

  // Add theme selector bar inside .viewer right above .status (non-destructive addition)
  const statusEl = viewer.querySelector(".status");
  const themeBar = document.createElement("div");
  themeBar.className = "pet-theme-bar";
  themeBar.id = "pet-theme-bar";
  themeBar.innerHTML = `
    <button type="button" data-theme="ceramic" class="active" title="3D 骨瓷天使球 (Three.js WebGL)">🏺 3D 骨瓷天使球</button>
    <button type="button" data-theme="submarine" title="深海驾驶舱全息球 (Three.js WebGL)">🫧 深海全息球</button>
    <button type="button" data-theme="grok" title="Sonnet 极简风 (53状态/28动作配方)">⚫ Sonnet 极简风</button>
    <button type="button" data-theme="colorful" title="2D 彩色可爱风 (SVG + 8大连续动作)">🌈 彩色可爱风</button>
    <button type="button" id="open-context-menu-btn" title="打开桌面版同款右键菜单">☰ 菜单</button>
  `;
  if (statusEl) {
    viewer.insertBefore(themeBar, statusEl);
  } else {
    viewer.appendChild(themeBar);
  }

  // Add 7th quick action (celebrate), 8 continuous actions (doAction1..8), and Grok 53-state / 28-clip selectors to Card 2 (quick)
  const quickActionsEl = document.getElementById("quick-actions");
  if (quickActionsEl) {
    if (!quickActionsEl.querySelector('[data-quick-action="celebrate"]')) {
      const celBtn = document.createElement("button");
      celBtn.type = "button";
      celBtn.setAttribute("data-quick-action", "celebrate");
      celBtn.innerHTML = "<b>🎉</b><span>庆祝</span>";
      quickActionsEl.appendChild(celBtn);
    }
    const quickCardBody = quickActionsEl.parentElement;
    if (quickCardBody && !document.getElementById("pet-director-actions")) {
      const directorWrap = document.createElement("div");
      directorWrap.id = "pet-director-actions";
      directorWrap.innerHTML = `
        <div class="pet-director-grid">
          <button type="button" data-director-action="1" title="Action 1: 彩虹拱桥与气泡">🌈 动作1·彩虹拱桥</button>
          <button type="button" data-director-action="2" title="Action 2: 向心粒子汇聚">⚡ 动作2·向心汇聚</button>
          <button type="button" data-director-action="3" title="Action 3: 对角折线冲刺">🚀 动作3·折线冲刺</button>
          <button type="button" data-director-action="4" title="Action 4: 双卫星环绕">🪐 动作4·双星环绕</button>
          <button type="button" data-director-action="5" title="Action 5: 底部三点加载">⏳ 动作5·三点加载</button>
          <button type="button" data-director-action="6" title="Action 6: 感叹号与蓝球警告">❗ 动作6·感叹警告</button>
          <button type="button" data-director-action="7" title="Action 7: 底部波浪与粉色爱心">💗 动作7·波浪爱心</button>
          <button type="button" data-director-action="8" title="Action 8: 粒子旋转风暴变身">🌪️ 动作8·粒子风暴</button>
        </div>
        <div class="pet-grok-panel" id="pet-grok-panel">
          <select id="grok-state-select" title="Grok 53种状态配方"><option value="">⚫ Grok 53状态配方...</option></select>
          <select id="grok-clip-select" title="Grok 28种动作Clip"><option value="">🎬 Grok 28动作Clip...</option></select>
        </div>
      `;
      quickCardBody.appendChild(directorWrap);
    }
  }

  // 5. Bridge variables and functions to match pet.html 1:1
  const moodTag = document.getElementById("mood-tag");
  const exclaimDotEl = document.getElementById("exclaim-dot");
  const bodyShine = document.getElementById("body-shine");
  const systemHudEl = document.getElementById("system-hud");
  const hudTextEl = document.getElementById("hud-text");

  const tinySpring = new Spring(1, 190, 20, 1);
  const eyeFadeSpring = new Spring(1, 170, 21, 1);
  const yawSpring = new Spring(0, 150, 16);
  yawSpring.target = 0;
  const pitchSpring = new Spring(0, 150, 16);
  pitchSpring.target = 0;

  const STATE_LINES = {"sleeping":["呼噜…呼噜…","梦里在吃好吃的…","zzZ 别吵我","梦到云朵了"],"waking":["伸个懒腰～","嗯…几点了？","刚醒，有点懵","谁把我叫醒的"],"idle":["戳我一下？","发呆放空中…","今天有什么安排","想摸摸我的头吗"],"listening":["嗯嗯，你说","我听着呢","记在小本本上了","然后呢？"],"thinking":["嗯…让我捋捋","有思路了！","CPU 转起来了","再想想…"],"searching":["翻箱倒柜中…","找到了！线索+1","资料库好大呀","再找找看…"],"working":["埋头干活中…","进度条在爬","别打扰我！","快好了快好了","摸鱼被抓了？"],"excited":["哇哇哇！","起飞！！","太开心了吧！","冲冲冲！"],"surprised":["咦？！","啥情况？！","这也行？","吓了一跳！"],"suspicious":["嗯？？有猫腻","不对劲…","让我查查你","(￢_￢) 盯"],"angry":["哼！！","气鼓鼓了","别惹我哦","我要生气了！"],"drowsy":["哈欠～","眼皮在打架…","好困…撑不住了","让我眯五分钟…"],"happy":["嘿嘿～","心电感应发射！","今天心情满分","阳光正好～","美滋滋(◡‿◡)"],"curious":["这是什么？","让我瞅瞅…","好想戳一下","咦？有情况"],"confused":["啊？啊？","等等…发生了什么","我是不是漏了什么","脑子打结了(⊙﹏⊙)"],"bored":["好无聊呀…","时间过得好慢","谁来陪我玩","扣手指中…"],"proud":["哼哼～拿下了","还行吧？","我厉害吧","稳的稳的"],"shy":["别盯着我看…","脸红了(⁄ ⁄•⁄ω⁄•⁄ ⁄)","哎呀…","好害羞"],"sad":["呜…","心情有点down","让我静静…","蓝瘦香菇"],"laughing":["哈哈哈哈！","笑死我了","肚子笑疼了","太好笑了吧"],"scared":["哇！吓我一跳！","不要过来…","瑟瑟发抖中","救命！"],"playful":["来追我呀～","给你一个 Wink ✨","皮一下很开心","(*^▽^*) 眨眨眼～","嘿嘿，你抓不到我","躲猫猫？"],"celebrate":["耶！！成功啦！","放烟花庆祝！","太棒了吧！","圆满！收工！"],"orbit":["绕个圈巡逻～","轨道运行中","转一圈回来","观察四周中"],"radar":["雷达扫描中…","滴滴…滴滴…","发现目标！","信号探测中"],"progress":["进度 +1","一点一点推进","快了快了","攒进度中"],"spawning":["闪亮登场！","我来啦！","新生报到！","今天元气满满！"],"humming":["啦啦啦～","哼哼小曲儿","心情好就唱两句","♪(´▽｀)"],"loading":["加载中…","缓冲一下下","马上就好","转圈圈中"],"dictating":["你说我记","记录中…","嗯，写下来了","听写模式 ON"],"writing":["码字中…","文思泉涌！","写点什么呢","灵感来了！"],"sending":["消息出发！","发出去了！","走你！","已发送✓"],"receiving":["收到新消息！","来活了！","有新东西","打开看看…"],"uploading":["打包上传中…","搬运中…","传到云端啦","进度 70%…"],"notifying":["叮！提醒你一下","有个新通知","注意查收哦","重要消息！"],"alerting":["⚠️ 警报！","注意注意！","红色预警！","有情况！"],"dragging":["哎哎别拽我","我在动呢…","轻点轻点","换个位置～"],"bouncing":["蹦蹦蹦！","弹起来～","嗨起来！","跳跳跳"],"powering-down":["要关机啦","下次见～","下线咯","晚安！"]};

  const COLOR_LINES = {"cocoa":["浓郁可可棕 ☕","来杯热可可～","巧克力味变身！","可可色好温暖～"],"red":["活力红扑扑 🔥","热情似火～","元气红超显白！","像颗熟透的小樱桃 🍒"],"orange":["暖暖橘子色 🍊","太阳橙子汽水～","温暖橘光洒下来啦","元气甜橙！"],"amber":["晶莹琥珀黄 ✨","焦糖布丁色 🍮","闪闪发光的琥珀～","金色阳光的味道"],"green":["清新薄荷绿 🌿","抹茶冰淇淋 🍵","青葱森林的气息～","今天绿意满满！"],"teal":["清澈湖水蓝 🌊","海盐薄荷苏打～","碧波荡漾湖蓝！","好清爽的感觉"],"blue":["经典蔚蓝天空 💙","晴空万里蓝～","静谧深邃之蓝！","像纯净的蓝宝石"],"purple":["梦幻香芋紫 💜","薰衣草甜梦 ✨","神秘星云紫变身！","优雅浪漫紫～"],"pink":["甜心蜜桃粉 🍓","心动草莓粉 💕","粉嘟嘟的可爱！","少女心爆棚啦～"],"black":["酷炫黑曜石 ⚫","低调极客黑～","神秘暗影夜行者！","极简酷盖黑！"]};

  const VALID_THEMES = ["colorful", "grok", "ceramic", "submarine"];
  const THEME_LABELS = {
    colorful: "🌈 彩色可爱风 ✓",
    grok: "⚫ Sonnet 极简风 ✓",
    ceramic: "🏺 3D 骨瓷天使球 ✓",
    submarine: "🫧 深海驾驶舱全息球 ✓"
  };

  let urlTheme = null;
  try { urlTheme = new URLSearchParams(location.search).get("theme"); } catch (_) {}
  let theme = VALID_THEMES.includes(urlTheme) ? urlTheme : "ceramic";
  let currentSystemState = "normal";
  let sysConvergeTimer = null;
  let autoPaused = false;
  let tagTimer = null;
  let petScale = 1;

  const ALL_STATES = Object.values(DATA.GROUPS).flat();
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function showMood(text, keepMs) {
    if (!moodTag) return;
    moodTag.textContent = text;
    moodTag.classList.add("show");
    clearTimeout(tagTimer);
    tagTimer = setTimeout(() => moodTag.classList.remove("show"), keepMs || 3800);
  }

  function randLine(state) {
    const a = STATE_LINES[state] || [stateNames[state] || state];
    return a[Math.floor(Math.random() * a.length)];
  }
  const showLine = state => showMood(randLine(state));
  function getColorLine(id) {
    const lines = COLOR_LINES[id] || ["换上新颜色啦 ✨", "新色新心情～"];
    return pick(lines);
  }

  function applyScale(s) {
    petScale = Math.max(0.33, Math.min(2, s));
    botStage.style.transform = `scale(${petScale})`;
    botStage.style.setProperty("--inv", String(1 / petScale));
  }

  // Include morph-engine.js shape morph functions + pet.html FX & 8 Continuous Actions (doAction1..doAction8)
  const shapeRingCache = new Map();
function sampleShapeRing(d, n = 48) {
  const svg = document.querySelector('#bot');
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tmp.setAttribute('d', d);
  svg.appendChild(tmp);
  const L = tmp.getTotalLength();
  const M = 360, pts = [];
  for (let i = 0; i < M; i++) { const p = tmp.getPointAtLength((L * i) / M); pts.push([p.x, p.y]); }
  svg.removeChild(tmp);
  const cx = pts.reduce((a, p) => a + p[0], 0) / M;
  const cy = pts.reduce((a, p) => a + p[1], 0) / M;
  const ring = [];
  const binHalf = (Math.PI * 2 / n) * 0.8;
  const angDiff = (a1, a2) => Math.abs(((a1 - a2 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    let best = -1, bestDist = -Infinity, bestDiff = Infinity;
    for (let j = 0; j < M; j++) {
      const p = pts[j];
      const diff = angDiff(Math.atan2(p[1] - cy, p[0] - cx), ang);
      if (diff > binHalf) continue;
      const d0 = Math.hypot(p[0] - cx, p[1] - cy);
      if (d0 > bestDist || (d0 === bestDist && diff < bestDiff)) { bestDist = d0; bestDiff = diff; best = j; }
    }
    if (best >= 0) {
      ring.push([+pts[best][0].toFixed(3), +pts[best][1].toFixed(3)]);
    } else {
      let fb = -1, fbDiff = Infinity;
      for (let j = 0; j < M; j++) {
        const p = pts[j];
        const diff = angDiff(Math.atan2(p[1] - cy, p[0] - cx), ang);
        if (diff < fbDiff) { fbDiff = diff; fb = j; }
      }
      const p = fb >= 0 ? pts[fb] : [cx, cy];
      ring.push([+p[0].toFixed(3), +p[1].toFixed(3)]);
    }
  }
  return ring;
}
function shapeRing(id) {
  if (shapeRingCache.has(id)) return shapeRingCache.get(id);
  const item = GROKBOT_SHAPES.find(s => s[0] === id);
  if (!item) return null;
  const ring = sampleShapeRing(item[2]);
  shapeRingCache.set(id, ring);
  return ring;
}


/* ---- 贝塞尔弹簧缓动（svg-film skill 同款 cubic-bezier(0.34, 1.18, 0.30, 1)） ---- */
function bezierEase(x1, y1, x2, y2) {
  const cx = 3 * x1, cy = 3 * y1;
  const bx = 3 * (x2 - x1) - cx, by = 3 * (y2 - y1) - cy;
  const ax = 1 - cx - bx, ay = 1 - cy - by;
  return function (p) {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) {
      const e = ((ax * t + bx) * t + cx) * t - p;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const SPRING_EASE = bezierEase(0.34, 1.18, 0.30, 1);
const SHAPE_MORPH_MS = 480;
let shapeFrom = null, shapeTo = null, shapeCurId = 'blob';
let shapeMorphStart = 0;

/* ---- morph 流程 ---- */
function startShapeMorph(id) {
  const to = shapeRing(id);
  if (!to || id === shapeCurId) return;
  shapeFrom = shapeCurId ? curShapeRing() : shapeRing('blob');
  shapeTo = to;
  shapeMorphStart = performance.now();
  shapeCurId = id;
}
function shapeProgress() {
  return clamp((performance.now() - shapeMorphStart) / SHAPE_MORPH_MS, 0, 1);
}
function curShapeRing() {
  const t = SPRING_EASE(shapeProgress());
  const from = shapeFrom || shapeRing(shapeCurId) || shapeRing('blob');
  const to = shapeTo || shapeRing(shapeCurId) || from;
  return from.map((p, i) => [p[0] + (to[i][0] - p[0]) * t, p[1] + (to[i][1] - p[1]) * t]);
}


/* ---- 变形秀：圆 → 随机形状 → 圆 ---- */
const SHOW_SHAPES = GROKBOT_SHAPES.filter(s => s[0] !== 'blob' && s[0] !== 'exclaim').map(s => s[0]);
let shapeShow = null, shapeShowStep = 0, shapeShowSeq = [];
function startShapeShow() {
  if (shapeShow) return;
  const target = SHOW_SHAPES[Math.floor(Math.random() * SHOW_SHAPES.length)];
  shapeShowSeq = ['blob', target, 'blob'];
  shapeShow = { timer: null };
  shapeShowStep = 0;
  fxLayer.classList.add('fx-orbit');
  shapeShowTick();
}
function stopShapeShow() {
  if (!shapeShow) return;
  clearTimeout(shapeShow.timer);
  shapeShow = null;
  fxLayer.classList.remove('fx-orbit');
  if (shapeCurId !== selectedShape[0]) startShapeMorph(selectedShape[0]);
}
function shapeShowTick() {
  if (!shapeShow) return;
  if (shapeShowStep >= shapeShowSeq.length) { stopShapeShow(); return; }
  startShapeMorph(shapeShowSeq[shapeShowStep]);
  shapeShowStep++;
  shapeShow.timer = setTimeout(shapeShowTick, 3400);
}
  /* ===== 状态特效（轨道激光环 / 雷达外传波纹 / 加载弧 / 警报脉冲 / 扫描光束 + 粒子） ===== */
const fxLayer = document.querySelector('#fx');
let fxSpawnTimer = null;
function spawnFxParticle(type) {
  const s = document.createElement('span');
  s.style.left = (115 + (Math.random() * 80 - 40)) + 'px';
  s.style.top = (66 + Math.random() * 44) + 'px';
  let cls = '', content = '';
  switch (type) {
    case 'happy': cls = 'fx-heart'; content = '♥'; s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px'); break;
    case 'excited': cls = 'fx-spark'; content = '✦'; break;
    case 'sleeping': cls = 'fx-z'; content = 'Z'; s.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px'); break;
    case 'humming': cls = 'fx-note'; content = '♪'; s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px'); break;
    case 'thinking': cls = 'fx-dot'; s.style.background = ['#ff5d9e','#ff9800','#ffd84d','#08c77a','#2f86ed','#8656f6','#79e2d0'][Math.floor(Math.random()*7)]; break;
    case 'sad': cls = 'fx-tear'; content = '💧'; s.style.left = (90 + Math.random()*50) + 'px'; break;
    case 'surprised': case 'scared': cls = 'fx-exclaim'; content = '!'; s.style.left = (105 + Math.random()*20) + 'px'; s.style.top = (40 + Math.random()*20) + 'px'; break;
    case 'angry': cls = 'fx-steam'; s.style.left = (95 + Math.random()*40) + 'px'; s.style.top = (90 + Math.random()*20) + 'px'; break;
    case 'laughing': cls = 'fx-haha'; content = '哈'; s.style.left = (95 + Math.random()*40) + 'px'; s.style.top = (55 + Math.random()*25) + 'px'; break;
    case 'celebrate': {
      cls = 'fx-confetti'; const cols = ['#ff2d8b', '#2f86ed', '#08c77a', '#ff9800', '#8656f6'];
      s.style.background = cols[Math.floor(Math.random() * cols.length)];
      s.style.setProperty('--dx', (Math.random() * 130 - 65) + 'px');
      s.style.setProperty('--dy', (Math.random() * 60 + 40) + 'px');
      s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      break;
    }
    default: return;
  }
  s.className = cls; s.textContent = content;
  fxLayer.appendChild(s);
  setTimeout(() => s.remove(), 1800);
}

/* ===== 视频同款特效：音符（头顶上浮摇摆，粉/黄，1.7s 节奏循环） + 星星（四周放射放大淡出，金/白） ===== */
const NOTE_COLORS = ['c-pink', 'c-yellow'];
const STAR_COLORS = ['c-gold', 'c-white'];
// 音符：从头顶 (114, 头部上方) 生成，粉/黄交替，单音符上浮摇摆
function spawnNoteSwing(n = 2) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'fx-note-swing ' + NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    s.textContent = Math.random() < 0.5 ? '♪' : '♫';
    const offY = (110 + Math.random() * 20) - i * 8;       // 头顶：身体中心上方
    s.style.left = (114 + (Math.random() * 36 - 18)) + 'px';
    s.style.top = (offY - 60) + 'px';                       // 从头顶高度开始
    s.style.setProperty('--rot', (Math.random() * 16 - 8) + 'deg');
    fxLayer.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
}
// 星星：从身体中心向四周放射，金/白交替，缩放+淡出（--dx/--dy 由 JS 预计算）
function spawnStarBurst(n = 10) {
  const cols = STAR_COLORS;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'fx-star-burst ' + cols[i % cols.length];
    s.textContent = '✦';
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    const dist = 88 + Math.random() * 52;   // 超过球半径(105)，从球面边缘向外放射
    const dx = String(Math.cos(ang) * dist), dy = String(Math.sin(ang) * dist);
    // 中间点为 55%/70%（备用，主动画在 CSS keyframes 中向前移动）
    s.style.left = '114px'; s.style.top = '114px';           // 身体中心发射
    s.style.setProperty('--dx', dx + 'px');
    s.style.setProperty('--dy', dy + 'px');
    s.style.setProperty('--dx1', (dx * 0.55).toFixed(1) + 'px');
    s.style.setProperty('--dy1', (dy * 0.55).toFixed(1) + 'px');
    s.style.setProperty('--dx2', (dx * 0.8).toFixed(1) + 'px');
    s.style.setProperty('--dy2', (dy * 0.8).toFixed(1) + 'px');
    fxLayer.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}
const FX_RING = { orbit: 'fx-orbit', radar: 'fx-radar', loading: 'fx-loading', alerting: 'fx-alert', searching: 'fx-scan' };
const FX_DOTS = new Set(['loading', 'dictating', 'writing', 'uploading', 'sending', 'receiving']);
const FX_PARTICLE = { happy: 360, sleeping: 600, thinking: 700, celebrate: 90, sad: 500, surprised: 380, scared: 420, angry: 340, laughing: 300 };  // humming/excited 已升级为 fxNoteSwing/fxStarBurst 专属特效
const FX_BURST = { working: 1500, sending: 1100, receiving: 1100, uploading: 1300, dictating: 1700, writing: 1500 };
const FX_FIREWORK = { celebrate: 850 };
let fxFwTimer = null, fxBurstTimer = null, fxNoteTimer = null, fxStarTimer = null;
// 粒子喷溅：从身体边缘随机角度喷出彩色小点（工作流状态）
function spawnBurst(n = 12) {
  const cols = ['#ff5d9e', '#2f86ed', '#08c77a', '#ff9800', '#8656f6', '#ffd84d', '#79e2d0'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'fx-fw';
    const ang = Math.random() * Math.PI * 2;
    const dist = 42 + Math.random() * 68;
    const col = cols[Math.floor(Math.random() * cols.length)];
    s.style.left = (114 + Math.cos(ang) * 28).toFixed(1) + 'px';
    s.style.top = (114 + Math.sin(ang) * 28).toFixed(1) + 'px';
    s.style.background = col; s.style.boxShadow = '0 0 6px ' + col;
    s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
    s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
    fxLayer.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}
// 烟花：火箭上升 → 顶点绽放成彩光，搭配'快看，烟花！'场景
function spawnFirework() {
  const cx = 75 + Math.random() * 90;
  const apexY = 38 + Math.random() * 50;
  const cols = ['#ff5d9e', '#ffd84d', '#79e2d0', '#8656f6', '#2f86ed', '#ff9800'];
  const col = cols[Math.floor(Math.random() * cols.length)];
  // 上升的火箭
  const r = document.createElement('span');
  r.className = 'fx-rocket';
  r.style.left = cx + 'px'; r.style.top = '200px';
  r.style.background = col; r.style.boxShadow = '0 0 8px ' + col;
  r.style.setProperty('--rise', (apexY - 200) + 'px');
  fxLayer.appendChild(r);
  setTimeout(() => r.remove(), 600);
  // 到顶绽放
  setTimeout(() => {
    const n = 16 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'fx-fw';
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
      const dist = 55 + Math.random() * 60;
      s.style.left = cx + 'px'; s.style.top = apexY + 'px';
      s.style.background = col; s.style.boxShadow = '0 0 6px ' + col;
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
      fxLayer.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }, 540);
}
/* ===== 数学曲线星轨条（Star Trail Ribbon，饱满发光流光带） =====
   两条彩虹星轨条绕圆球外圈对向高速飞驰（一条顺时针、一条逆时针）
   头部发光星核飞驰，身后拖着饱满彩虹流光带，宽度 9px，双层璀璨星光光晕 */
const STAR_PALETTES = {
  rainbow1: ['#ff5d9e', '#ffd84d', '#08c77a'],
  rainbow2: ['#2f86ed', '#79e2d0', '#8656f6', '#ff2d8b'],
  gold: ['#ffffff', '#ffd84d', '#ff9800', '#ff5d9e'],
  cyan: ['#ffffff', '#79e2d0', '#08c77a', '#2f86ed']
};
const MATH_CURVES = {
  circle: { // 外圈正圆双向对轨星轨：两条对向绕圆球外圈转（顺时针 + 逆时针）
    strokeWidth: 9.0, rotate: false, sampleSegments: 40, trailSpan: 0.38, dual: true,
    durationMs: 3800, rotationDurationMs: 24000, pulseDurationMs: 4000,
    point(progress, detailScale, c) {
      const t = progress * Math.PI * 2;
      const r = c.r * detailScale;
      return { x: 114 + r * Math.cos(t), y: 114 + r * Math.sin(t) };
    }, r: 112,
  },
  rose: { // 外圈极光波浪双向星轨：在圆球外圈微起伏波浪，对向绕转
    strokeWidth: 8.5, rotate: false, sampleSegments: 44, trailSpan: 0.35, dual: true,
    durationMs: 4200, rotationDurationMs: 26000, pulseDurationMs: 4200,
    point(progress, detailScale, c) {
      const t = progress * Math.PI * 2;
      const r = (c.rbase + c.a * Math.cos(c.k * t)) * detailScale;
      return { x: 114 + r * Math.cos(t), y: 114 + r * Math.sin(t) };
    }, rbase: 112, a: 5, k: 6,
  },
  lissajous: { // 外圈立体空间双向星轨：在圆球外圈轻微俯仰，对向绕转
    strokeWidth: 8.5, rotate: false, sampleSegments: 44, trailSpan: 0.35, dual: true,
    durationMs: 4400, rotationDurationMs: 38000, pulseDurationMs: 5000,
    point(progress, detailScale, c) {
      const t = progress * Math.PI * 2;
      const x = (c.a * Math.cos(t) + 6 * Math.sin(3 * t)) * detailScale;
      const y = (c.b * Math.sin(t) + 6 * Math.cos(2 * t)) * detailScale;
      return { x: 114 + x, y: 114 + y };
    }, a: 112, b: 110,
  },
};
const FX_CURVE = {
  working: 'lissajous',
  thinking: 'circle',
  searching: 'rose',
  radar: 'circle'
};
let curveFx = null;

function curveDetailScale(time, cfg, phase) {
  const pp = ((time + phase * cfg.pulseDurationMs) % cfg.pulseDurationMs) / cfg.pulseDurationMs;
  return 0.98 + ((Math.sin(pp * Math.PI * 2 + 0.55) + 1) / 2) * 0.02;
}

function startCurveFx(kind) {
  stopCurveFx();
  const cfg = MATH_CURVES[kind];
  if (!cfg) return;
  fxLayer.classList.add('fx-curve');
  const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrap.setAttribute('class', 'curve-wrap');
  wrap.setAttribute('viewBox', '0 0 228 228');

  // Defs: 创建星轨渐变
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradId1 = 'star-trail-g1-' + Math.random().toString(36).substr(2, 5);
  const gradId2 = 'star-trail-g2-' + Math.random().toString(36).substr(2, 5);

  function makeGrad(id, colors) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    g.setAttribute('id', id);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
    g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    colors.forEach((col, idx) => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', (idx / (colors.length - 1) * 100).toFixed(0) + '%');
      stop.setAttribute('stop-color', col);
      g.appendChild(stop);
    });
    return g;
  }
  defs.appendChild(makeGrad(gradId1, STAR_PALETTES.rainbow1));
  defs.appendChild(makeGrad(gradId2, STAR_PALETTES.rainbow2));
  wrap.appendChild(defs);

  // 创建星轨路径与星核
  const trails = [];
  const trailCount = cfg.dual ? 2 : 1;
  for (let tIdx = 0; tIdx < trailCount; tIdx++) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', `url(#${tIdx === 0 ? gradId1 : gradId2})`);
    path.setAttribute('stroke-width', cfg.strokeWidth || 9);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.style.filter = `drop-shadow(0 0 10px ${tIdx === 0 ? '#ff5d9e' : '#2f86ed'}) drop-shadow(0 0 20px rgba(255,216,77,0.5))`;
    wrap.appendChild(path);

    const coreG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glowCircle.setAttribute('r', '7.5');
    glowCircle.setAttribute('fill', tIdx === 0 ? '#ffd84d' : '#79e2d0');
    glowCircle.style.filter = `drop-shadow(0 0 8px ${tIdx === 0 ? '#ff5d9e' : '#2f86ed'})`;
    const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerDot.setAttribute('r', '3.8');
    innerDot.setAttribute('fill', '#ffffff');
    coreG.appendChild(glowCircle);
    coreG.appendChild(innerDot);
    wrap.appendChild(coreG);

    trails.push({ path, coreG, tIdx });
  }

  fxLayer.appendChild(wrap);
  curveFx = { kind, cfg, wrap, trails, start: performance.now(), phase: Math.random(), raf: null };

  const tick = (now) => {
    if (!curveFx) return;
    const t = now - curveFx.start;
    const progress = (t % cfg.durationMs) / cfg.durationMs;
    const ds = curveDetailScale(t, cfg, curveFx.phase);
    const rot = cfg.rotate ? -((t % cfg.rotationDurationMs) / cfg.rotationDurationMs) * 360 : 0;
    wrap.setAttribute('transform', rot ? `rotate(${rot.toFixed(2)} 114 114)` : '');

    const segs = cfg.sampleSegments || 36;
    curveFx.trails.forEach(tr => {
      // tr.tIdx === 0 顺时针绕转，tr.tIdx === 1 逆时针对向反向绕转
      const isReversed = tr.tIdx === 1;
      const baseProg = isReversed ? (1 - progress) : progress;
      const headPt = cfg.point(baseProg, ds, cfg);
      tr.coreG.setAttribute('transform', `translate(${headPt.x.toFixed(2)}, ${headPt.y.toFixed(2)})`);

      let d = '';
      for (let s = 0; s <= segs; s++) {
        const segProg = isReversed
          ? normalizeProgress(baseProg + (s / segs) * cfg.trailSpan)
          : normalizeProgress(baseProg - (s / segs) * cfg.trailSpan);
        const pt = cfg.point(segProg, ds, cfg);
        d += (s === 0 ? 'M' : 'L') + `${pt.x.toFixed(2)} ${pt.y.toFixed(2)} `;
      }
      tr.path.setAttribute('d', d);
    });

    curveFx.raf = requestAnimationFrame(tick);
  };
  curveFx.raf = requestAnimationFrame(tick);
}

function stopCurveFx() {
  if (!curveFx) return;
  cancelAnimationFrame(curveFx.raf);
  if (curveFx.wrap) curveFx.wrap.remove();
  fxLayer.classList.remove('fx-curve');
  curveFx = null;
}

/* ============================================================
   七大连贯动作（人工盯帧复刻版）
   压感彩色蜡笔流星 / 60° 环绕弧线 / 粒子汇聚 / 三球跳动 / 毛笔挥毫 / 感叹号蓝球 / 弹跳轮询
   ============================================================ */
const actionLayer = document.querySelector('#action-fx');
let isActionPlaying = false;
let actionTimers = [];
let actionIntervals = [];
let actionRafs = [];

function clearActionFx() {
  actionTimers.forEach(t => clearTimeout(t));
  actionTimers = [];
  actionIntervals.forEach(iv => clearInterval(iv));
  actionIntervals = [];
  actionRafs.forEach(id => cancelAnimationFrame(id));
  actionRafs = [];
  if (actionLayer) actionLayer.innerHTML = '';
  if (springGroup) {
    springGroup.style.opacity = '1';
    springGroup.style.filter = 'none';
  }
  eyeFadeSpring.target = 1;
  tinySpring.target = 1.0;
  bodySprings.y.target = 0;
  bodySprings.rotate.target = 0;
  bodySprings.scaleX.target = 1;
  bodySprings.scaleY.target = 1;
}

function safeActionTimeout(fn, delay) {
  const t = setTimeout(fn, delay);
  actionTimers.push(t);
  return t;
}

function safeActionInterval(fn, delay) {
  const iv = setInterval(fn, delay);
  actionIntervals.push(iv);
  return iv;
}

function safeActionRaf(fn) {
  const id = requestAnimationFrame(fn);
  actionRafs.push(id);
  return id;
}

// 辅助：生成单条压感蜡笔彩虹流星/弧线
function spawnCrayonMeteor({ x1, y1, x2, y2, cx, cy, colors, width = 18, duration = 850, delay = 0, onFinish }) {
  safeActionTimeout(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 230 230');
    svg.style.cssText = 'position:absolute;left:0;top:0;width:230px;height:230px;pointer-events:none;z-index:6;overflow:visible;';
    
    const gradId = 'meteor-grad-' + Math.random().toString(36).substr(2, 6);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    
    colors.forEach((c, idx) => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', (idx / (colors.length - 1) * 100).toFixed(0) + '%');
      stop.setAttribute('stop-color', c);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = cx !== undefined ? `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', `url(#${gradId})`);
    path.setAttribute('stroke-width', width);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('filter', 'url(#crayon-glow)');
    svg.appendChild(path);
    actionLayer.appendChild(svg);
    
    const len = path.getTotalLength() || 120;
    path.style.strokeDasharray = `${len} ${len}`;
    path.style.strokeDashoffset = `${len}`;
    
    path.animate([
      { strokeDashoffset: len, opacity: 0 },
      { strokeDashoffset: len * 0.35, opacity: 0.95, offset: 0.22 },
      { strokeDashoffset: 0, opacity: 0.9, offset: 0.65 },
      { strokeDashoffset: -len * 0.6, opacity: 0, offset: 1 }
    ], { duration: duration, easing: 'cubic-bezier(0.25, 0.9, 0.35, 1)', fill: 'forwards' }).onfinish = () => {
      svg.remove();
      if (onFinish) onFinish();
    };
  }, delay);
}

// 辅助：生成 60° 倾角彩虹环绕弧线束
function spawnRainbowArcWrap({ cx = 114, cy = 114, rx = 72, ry = 34, tiltDeg = 60, colors, duration = 1800, count = 5, onFinish }) {
  const container = document.createElement('div');
  container.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:0;height:0;transform:rotate(${tiltDeg}deg);pointer-events:none;z-index:6;`;
  actionLayer.appendChild(container);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const w = rx * 2 + i * 8;
    const h = ry * 2 + i * 6;
    const col = colors[i % colors.length];
    const thick = 14 + (i % 3) * 3;
    el.style.cssText = `
      position: absolute;
      left: ${-w/2}px; top: ${-h/2}px;
      width: ${w}px; height: ${h}px;
      border-radius: 50%;
      border: ${thick}px solid transparent;
      border-top-color: ${col[0]};
      border-right-color: ${col[1] || col[0]};
      box-shadow: 0 0 16px ${col[0]}, 0 0 28px ${col[1] || col[0]};
      opacity: 0;
      pointer-events: none;
      transform-origin: center center;
    `;
    container.appendChild(el);

    safeActionTimeout(() => {
      el.animate([
        { transform: 'rotate(0deg) scale(0.35)', opacity: 0 },
        { transform: 'rotate(120deg) scale(0.9)', opacity: 0.95, offset: 0.25 },
        { transform: 'rotate(240deg) scale(1.05)', opacity: 0.9, offset: 0.7 },
        { transform: 'rotate(360deg) scale(0.75)', opacity: 0, offset: 1 }
      ], { duration: duration + i * 120, easing: 'cubic-bezier(0.3, 0.8, 0.4, 1)', fill: 'forwards' }).onfinish = () => {
        el.remove();
      };
    }, i * 90);
  }

  safeActionTimeout(() => {
    container.remove();
    if (onFinish) onFinish();
  }, duration + count * 120 + 100);
}

// 连贯动作1（人工盯帧版）：圆三角翻滚 + 右上角彩虹短弧流星雨 + 底部与三角三束彩虹包裹 2s + 变回圆球
function doAction1() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();
  
  // 1. 身体变成圆角三角
  startShapeMorph('triangle');
  
  // 2. 右上角甩出一小束彩虹短弧线（粉、黄、绿、青、紫交错流星划到左下角）
  const meteorPalettes = [
    ['#ff5d9e', '#ffd84d'],
    ['#ffd84d', '#08c77a'],
    ['#08c77a', '#79e2d0'],
    ['#2f86ed', '#8656f6'],
    ['#ff2d8b', '#ff9800', '#ffd84d']
  ];
  for (let i = 0; i < 5; i++) {
    spawnCrayonMeteor({
      x1: 170 + i * 6, y1: 34 + i * 8,
      x2: 45 + i * 8, y2: 185 + i * 6,
      cx: 135 - i * 10, cy: 95 + i * 8,
      colors: meteorPalettes[i % meteorPalettes.length],
      width: 14 + (i % 3) * 4,
      duration: 750 + i * 60,
      delay: i * 90
    });
  }

  // 3. 三角形开始旋转翻滚（持续约 2s），底部与三角三个角甩出 3 束彩虹线条包裹
  safeActionTimeout(() => {
    let rollStart = performance.now();
    const rollDur = 2000;
    const initialRot = bodySprings.rotate.x;
    
    function rollTick(now) {
      const p = Math.min((now - rollStart) / rollDur, 1);
      const ease = Math.sin(p * Math.PI / 2);
      bodySprings.rotate.target = initialRot + ease * 720;
      bodySprings.y.target = Math.sin(p * Math.PI * 4) * 6;
      if (p < 1) safeActionRaf(rollTick);
    }
    safeActionRaf(rollTick);

    // 三束彩虹包裹弧线
    const rainbowBundles = [
      [['#ff5d9e', '#ffd84d'], ['#ffd84d', '#08c77a']],
      [['#08c77a', '#79e2d0'], ['#2f86ed', '#8656f6']],
      [['#8656f6', '#ff2d8b'], ['#ff9800', '#ffd84d']]
    ];
    rainbowBundles.forEach((bundle, idx) => {
      spawnRainbowArcWrap({
        cx: 114, cy: 114,
        rx: 76 + idx * 8, ry: 40 + idx * 6,
        tiltDeg: 30 + idx * 55,
        colors: bundle,
        duration: 1750,
        count: 3
      });
    });
  }, 450);

  // 4. 翻滚 2s 后在彩虹环绕中丝滑变回圆球，弧线淡出
  safeActionTimeout(() => {
    startShapeMorph('blob');
    bodySprings.rotate.target = 0;
    bodySprings.y.target = 0;
    spawnBurst(16);
  }, 2350);

  safeActionTimeout(() => {
    isActionPlaying = false;
  }, 2900);
}

// 连贯动作2（人工盯帧版）：圆球缩小至小球 + 彩色小球粒子由淡到深加速汇聚融合 + 变回圆球
function doAction2() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 圆球缩小至小球
  tinySpring.target = 0.36;

  // 2. 旁边持续生成由淡到深的小球粒子汇聚融合到中心小球
  const colors = ['#ff5d9e', '#2f86ed', '#08c77a', '#ff9800', '#8656f6', '#ffd84d', '#79e2d0'];
  let count = 0;
  const convergeInterval = safeActionInterval(() => {
    if (count++ > 22 || autoPaused) {
      clearInterval(convergeInterval);
      return;
    }
    const angle = Math.random() * Math.PI * 2;
    const dist = 65 + Math.random() * 55;
    const startX = 114 + Math.cos(angle) * dist;
    const startY = 114 + Math.sin(angle) * dist;
    const col = colors[Math.floor(Math.random() * colors.length)];
    const size = 9 + Math.random() * 8;

    const p = document.createElement('div');
    p.style.cssText = `
      position: absolute;
      left: ${startX - size/2}px; top: ${startY - size/2}px;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: ${col};
      box-shadow: 0 0 12px ${col}, 0 0 20px ${col};
      opacity: 0.25;
      pointer-events: none;
      z-index: 6;
    `;
    actionLayer.appendChild(p);

    p.animate([
      { transform: 'translate(0, 0) scale(0.6)', opacity: 0.25 },
      { transform: `translate(${(114 - startX) * 0.45}px, ${(114 - startY) * 0.45}px) scale(1.15)`, opacity: 0.95, offset: 0.45 },
      { transform: `translate(${114 - startX}px, ${114 - startY}px) scale(0.3)`, opacity: 1, offset: 0.9 },
      { transform: `translate(${114 - startX}px, ${114 - startY}px) scale(0)`, opacity: 0 }
    ], { duration: 650, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', fill: 'forwards' }).onfinish = () => {
      p.remove();
      eyePulse = 0.45; // 融合吸收脉冲
    };
  }, 75);

  // 3. 汇聚完成，小球弹跳回弹变回原圆球
  safeActionTimeout(() => {
    clearInterval(convergeInterval);
    tinySpring.target = 1.15;
    safeActionTimeout(() => {
      tinySpring.target = 1.0;
      startShapeMorph('blob');
      spawnBurst(14);
    }, 180);
  }, 1900);

  safeActionTimeout(() => {
    isActionPlaying = false;
  }, 2500);
}

// 连贯动作3（人工盯帧版）：圆球缩成小球 + 60° 倾角彩虹弧线由短变长环绕一周 + 小球增大复原
function doAction3() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 圆球缩成小球
  tinySpring.target = 0.42;

  // 2. 自小球圆周甩出 60° 倾角彩虹弧线（粉紫青绿），由短变长绕身环形旋转一周
  const rainbowRings = [
    ['#ff5d9e', '#8656f6'],
    ['#8656f6', '#2f86ed'],
    ['#2f86ed', '#79e2d0'],
    ['#79e2d0', '#08c77a'],
    ['#08c77a', '#ffd84d']
  ];

  safeActionTimeout(() => {
    spawnRainbowArcWrap({
      cx: 114, cy: 114,
      rx: 68, ry: 30,
      tiltDeg: 60,
      colors: rainbowRings,
      duration: 1650,
      count: 5
    });
  }, 250);

  // 3. 彩虹弧线淡出消失，小球同步膨胀回弹变回原大小
  safeActionTimeout(() => {
    tinySpring.target = 1.0;
    startShapeMorph('blob');
    spawnBurst(12);
  }, 1750);

  safeActionTimeout(() => {
    isActionPlaying = false;
  }, 2300);
}

// 连贯动作4（人工盯帧版）：圆球缩小成三个横排小球 + 依次跳动呼吸加深/淡化 + 聚拢融合变回圆球
function doAction4() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 主圆球瞬间淡出隐藏
  springGroup.style.opacity = '0';
  tinySpring.target = 0;

  // 2. 中央生成 3 个横排小球
  const dotsContainer = document.createElement('div');
  dotsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;';
  actionLayer.appendChild(dotsContainer);

  const dotPositions = [64, 114, 164];
  const dotColors = ['#ff5d9e', '#08c77a', '#2f86ed'];
  const dotEls = [];

  dotPositions.forEach((posX, i) => {
    const d = document.createElement('div');
    d.className = 'tri-dot';
    d.style.left = (posX - 13) + 'px';
    d.style.background = dotColors[i];
    d.style.boxShadow = `0 0 16px ${dotColors[i]}, 0 4px 10px rgba(0,0,0,0.3)`;
    d.style.transform = 'scale(0)';
    d.style.opacity = '0';
    dotsContainer.appendChild(d);
    dotEls.push(d);

    safeActionTimeout(() => {
      d.style.transform = 'scale(1)';
      d.style.opacity = '1';
    }, 50 + i * 60);
  });

  // 3. 依次跳动呼吸：跳动小球加深放大，未跳小球淡化
  [0, 1, 2].forEach(activeIdx => {
    safeActionTimeout(() => {
      dotEls.forEach((el, idx) => {
        if (idx === activeIdx) {
          el.style.transform = 'translateY(-22px) scale(1.28)';
          el.style.opacity = '1';
          el.style.filter = 'brightness(1.35) drop-shadow(0 0 12px currentColor)';
        } else {
          el.style.transform = 'translateY(0) scale(0.9)';
          el.style.opacity = '0.35';
          el.style.filter = 'brightness(0.85)';
        }
      });
      // 跳完回落
      safeActionTimeout(() => {
        dotEls[activeIdx].style.transform = 'translateY(0) scale(1)';
      }, 260);
    }, 380 + activeIdx * 460);
  });

  // 4. 三小球向中心 (114, 114) 快速加速聚拢融合
  safeActionTimeout(() => {
    dotEls.forEach((el, idx) => {
      el.style.transition = 'transform .28s cubic-bezier(0.4, 0, 0.2, 1), opacity .28s ease';
      el.style.transform = `translate(${114 - dotPositions[idx]}px, 0) scale(0.35)`;
      el.style.opacity = '0';
    });
  }, 1900);

  // 5. 融合完成，主圆球弹射复原
  safeActionTimeout(() => {
    dotsContainer.remove();
    springGroup.style.opacity = '1';
    tinySpring.target = 1.0;
    startShapeMorph('blob');
    spawnBurst(16);
  }, 2200);

  safeActionTimeout(() => {
    isActionPlaying = false;
  }, 2750);
}

// 连贯动作5（升级版 · 官方警示倾斜感叹号巡弋）：圆球形变倾斜感叹号+水滴点 + 17.7° 倾斜优雅巡游后退 + 融回归位
function doAction5() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 主球淡出隐藏，浮现极简倾斜感叹号主体
  springGroup.style.opacity = '0';
  tinySpring.target = 0;

  const alertWrap = document.createElement('div');
  alertWrap.className = 'brush-holder';
  alertWrap.innerHTML = `
    <div style="position:absolute;left:-14px;top:-46px;width:28px;height:72px;background:var(--bot-color);border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,0.25);"></div>
    <div style="position:absolute;left:-11px;top:38px;width:22px;height:24px;background:var(--bot-color);border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></div>
  `;
  actionLayer.appendChild(alertWrap);

  alertWrap.style.transform = 'translate(-38px, 0px) rotate(17.7deg) scale(0.2)';
  alertWrap.style.opacity = '0';
  alertWrap.style.transition = 'transform .4s cubic-bezier(.34,1.4,.56,1), opacity .3s ease';

  safeActionTimeout(() => {
    alertWrap.style.opacity = '1';
    alertWrap.style.transform = 'translate(-32px, 0px) rotate(17.7deg) scale(1)';
  }, 80);

  // 2. 官方同款平滑向前滑动（1.5s）+ 顺滑向后回退归位
  safeActionTimeout(() => {
    let startT = performance.now();
    const tilt = 17.7;

    function moveTick(now) {
      const elapsed = (now - startT) / 1000;
      const p = Math.min(elapsed / 1.5, 1);
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const travel = ease * 76 - 32; // -32px -> +44px
      const back = elapsed > 1.5 ? Math.min((elapsed - 1.5) / 0.45, 1) : 0;
      const easeBack = Math.sin(back * Math.PI / 2);
      const curX = travel * (1 - easeBack) + (-10) * easeBack;
      const buzz = Math.sin(elapsed * 2.5 * Math.PI * 2) * 2.5;

      alertWrap.style.transform = `translate(${curX}px, ${buzz}px) rotate(${tilt}deg) scale(1)`;

      // 在滑行波峰洒落轻柔流光粒子
      if (Math.random() < 0.14) {
        const dot = document.createElement('div');
        dot.className = 'fx-fw';
        dot.style.left = (114 + curX) + 'px';
        dot.style.top = (114 + buzz + 20) + 'px';
        dot.style.background = '#ff5d9e';
        dot.style.setProperty('--dx', (Math.random() * 20 - 10) + 'px');
        dot.style.setProperty('--dy', (6 + Math.random() * 14) + 'px');
        actionLayer.appendChild(dot);
        setTimeout(() => dot.remove(), 600);
      }

      if (elapsed < 2.0) safeActionRaf(moveTick);
    }
    safeActionRaf(moveTick);
  }, 420);

  // 3. 回退归位后各部件向中心融合变回圆球
  safeActionTimeout(() => {
    alertWrap.style.transition = 'transform .4s ease, opacity .4s ease';
    alertWrap.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1.3)';
    alertWrap.style.opacity = '0';
  }, 2250);

  safeActionTimeout(() => {
    alertWrap.remove();
    springGroup.style.opacity = '1';
    tinySpring.target = 1.0;
    startShapeMorph('blob');
    spawnBurst(16);
  }, 2600);

  safeActionTimeout(() => {
    isActionPlaying = false;
  }, 3100);
}

// 连贯动作6（人工盯帧版）：右上角出缺口弹出蓝球 + 缩小成感叹号下方圆球并组成感叹号 + 叮铃晃动 + 融回归位
function doAction6() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 右上角弹出蓝色小球
  const blueDot = document.createElement('div');
  blueDot.className = 'blue-dot-pop';
  blueDot.style.left = '135px'; blueDot.style.top = '85px';
  blueDot.style.transform = 'scale(0)';
  blueDot.style.opacity = '0';
  blueDot.style.transition = 'transform .45s cubic-bezier(.34,1.6,.56,1), opacity .3s ease';
  actionLayer.appendChild(blueDot);

  safeActionTimeout(() => {
    blueDot.style.transform = 'translate(45px, -45px) scale(1.1)';
    blueDot.style.opacity = '1';
  }, 100);

  // 2. 主体圆球缩小成为感叹号下方小球（留出 33.5px 优雅间隙），上方长条感叹号柱体落下
  safeActionTimeout(() => {
    eyeFadeSpring.target = 0;
    tinySpring.target = 0.25;
    bodySprings.y.target = 54;
  }, 300);

  const exclaimBar = document.createElement('div');
  exclaimBar.className = 'exclaim-bar';
  exclaimBar.style.transform = 'translateY(-60px) scale(0.3)';
  exclaimBar.style.opacity = '0';
  exclaimBar.style.transition = 'transform .45s cubic-bezier(.34,1.45,.56,1), opacity .3s ease';
  actionLayer.appendChild(exclaimBar);

  safeActionTimeout(() => {
    exclaimBar.style.transform = 'translateY(0) scale(1)';
    exclaimBar.style.opacity = '1';
  }, 420);

  // 3. 感叹号“叮铃”一下左右晃动两下
  safeActionTimeout(() => {
    exclaimBar.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-14deg)', offset: 0.25 },
      { transform: 'rotate(12deg)', offset: 0.55 },
      { transform: 'rotate(-6deg)', offset: 0.8 },
      { transform: 'rotate(0deg)', offset: 1 }
    ], { duration: 650, easing: 'ease-in-out' });

    blueDot.animate([
      { transform: 'translate(45px, -45px) rotate(0deg)' },
      { transform: 'translate(40px, -52px) rotate(-15deg)', offset: 0.3 },
      { transform: 'translate(48px, -40px) rotate(15deg)', offset: 0.65 },
      { transform: 'translate(45px, -45px) rotate(0deg)', offset: 1 }
    ], { duration: 650, easing: 'ease-in-out' });
  }, 950);

  // 4. 随后各部分向中心合体融回圆球
  safeActionTimeout(() => {
    exclaimBar.style.transform = 'scale(0)';
    exclaimBar.style.opacity = '0';
    blueDot.style.transform = 'translate(0, 0) scale(0)';
    blueDot.style.opacity = '0';
    eyeFadeSpring.target = 1;
    bodySprings.y.target = 0;
    tinySpring.target = 1.0;
    startShapeMorph('blob');
    spawnBurst(16);
  }, 1850);

  safeActionTimeout(() => {
    exclaimBar.remove();
    blueDot.remove();
    isActionPlaying = false;
  }, 2400);
}

// 连贯动作7（人工盯帧版）：圆球缩小至小球 + 原地弹跳两下 + 变回圆球 + 连续轮询形状 + 回归圆球
function doAction7() {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 缩小至小球
  tinySpring.target = 0.38;

  // 2. 原地快速轻巧弹跳两下（带落地挤压）
  safeActionTimeout(() => {
    let bounceStart = performance.now();
    const bounceDur = 900;
    function bounceTick(now) {
      const p = Math.min((now - bounceStart) / bounceDur, 1);
      // 两次弹跳正弦波
      const jumpY = -Math.abs(Math.sin(p * Math.PI * 2)) * 32 * (1 - p * 0.3);
      bodySprings.y.target = jumpY;
      if (p < 1) safeActionRaf(bounceTick);
      else bodySprings.y.target = 0;
    }
    safeActionRaf(bounceTick);
  }, 280);

  // 3. 弹跳完成，小球放大回弹复原
  safeActionTimeout(() => {
    tinySpring.target = 1.0;
    startShapeMorph('blob');
    spawnBurst(12);
  }, 1250);

  // 4. 连续轮询形状：drop -> egg -> squircle -> capsule -> triangle -> hex -> blob
  const morphSequence = ['drop', 'egg', 'squircle', 'capsule', 'triangle', 'hex', 'blob'];
  morphSequence.forEach((shapeId, i) => {
    safeActionTimeout(() => {
      startShapeMorph(shapeId);
      spawnFxParticle('thinking');
    }, 1600 + i * 420);
  });

  safeActionTimeout(() => {
    startShapeMorph('blob');
    isActionPlaying = false;
  }, 1600 + morphSequence.length * 420 + 200);
}

// 连贯动作8（新增）：粒子旋转风暴变身！多臂旋涡粒子向心加速内聚 + 身体高速旋转蓄能 + 能量冲击波爆发变身
function doAction8(targetShape, targetExpr) {
  if (isActionPlaying) return;
  isActionPlaying = true;
  clearActionFx();

  // 1. 蓄力起风：身体自旋蓄能并凝聚为中心高能光核
  const initialRot = bodySprings.rotate.x;
  bodySprings.scaleX.target = 1.06;
  bodySprings.scaleY.target = 0.94;
  tinySpring.target = 0.45;
  springGroup.style.filter = 'brightness(1.4) drop-shadow(0 0 16px var(--bot-color))';
  showMood('🌪️ 粒子风暴汇聚中…');

  // 2. 创建 4 臂向心螺旋旋转风暴粒子群
  const colors = ['#ff5d9e', '#ffd84d', '#08c77a', '#79e2d0', '#2f86ed', '#8656f6', '#ff9800', '#ffffff'];
  const particleCount = 42;
  const stormContainer = document.createElement('div');
  stormContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;';
  actionLayer.appendChild(stormContainer);

  const stormDuration = 1000;
  const stormStart = performance.now();

  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const arm = i % 4;
    const armAngle = (arm * Math.PI / 2);
    const rOffset = 70 + (i / particleCount) * 55;
    const initAngle = armAngle + (i / particleCount) * Math.PI * 1.2;
    const col = colors[i % colors.length];
    const sz = 6 + (i % 4) * 2.5;

    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute; left: 114px; top: 114px;
      width: ${sz}px; height: ${sz}px; margin-left: ${-sz/2}px; margin-top: ${-sz/2}px;
      border-radius: 50%;
      background: ${col};
      box-shadow: 0 0 12px ${col}, 0 0 22px ${col};
      opacity: 0; pointer-events: none;
    `;
    stormContainer.appendChild(el);
    particles.push({ el, r0: rOffset, theta0: initAngle, delay: (i % 6) * 40 });
  }

  let stormRaf = null;
  function stormTick(now) {
    const elapsed = now - stormStart;
    const p = Math.min(elapsed / stormDuration, 1);

    // 身体自旋加速与微缩
    const spinP = Math.pow(p, 1.8);
    bodySprings.rotate.target = initialRot + spinP * 720;
    bodySprings.y.target = Math.sin(p * Math.PI * 6) * 4;
    tinySpring.target = 0.85 - p * 0.25;

    // 粒子沿对数螺旋向中心内聚加速
    particles.forEach(pt => {
      const ptElapsed = Math.max(0, elapsed - pt.delay);
      const ptProgress = Math.min(ptElapsed / (stormDuration - pt.delay * 0.6), 1);

      const easeR = Math.pow(ptProgress, 1.6);
      const r = pt.r0 * (1 - easeR);
      const easeTheta = Math.pow(ptProgress, 1.4);
      const theta = pt.theta0 + easeTheta * (Math.PI * 4.2);

      const px = r * Math.cos(theta);
      const py = r * Math.sin(theta);

      const op = ptProgress < 0.15 ? ptProgress / 0.15 : (ptProgress > 0.9 ? (1 - ptProgress) / 0.1 : 1);
      const scale = (0.5 + 0.8 * (1 - ptProgress * 0.5));

      pt.el.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
      pt.el.style.opacity = String(op);
    });

    if (p < 1) {
      stormRaf = safeActionRaf(stormTick);
    }
  }
  stormRaf = safeActionRaf(stormTick);

  // 3. 风暴中心能量爆发 & 变身为多样形态 + 萌感表情（1050ms）
  safeActionTimeout(() => {
    stormContainer.remove();
    springGroup.style.filter = 'none';

    // 变身形态多样化：云朵、蛋形、水滴、圆角方、六边体、胶囊、三角体等随机挑选
    const candidateShapes = ['cloud', 'egg', 'drop', 'squircle', 'hex', 'capsule', 'triangle', 'pebble'];
    const chosenShape = targetShape || pick(candidateShapes);
    const candidateExprs = [25, 2, 17, 11, 21, 8];
    const chosenExpr = targetExpr !== undefined ? targetExpr : pick(candidateExprs);

    startShapeMorph(chosenShape);
    chooseExpression(chosenExpr);

    const shapeLines = {
      cloud: '欸？云朵！✨',
      drop: '变水滴啦 💧',
      egg: '圆滚滚蛋形 🥚',
      squircle: '圆角方方块 ◻️',
      hex: '六边几何体 ⬡',
      capsule: '变胶囊形态 💊',
      triangle: '小三角体 🔺',
      pebble: '光滑鹅卵石 ✨'
    };
    showMood(shapeLines[chosenShape] || '✨ 旋转风暴变身！');

    // 身体回弹与爆发冲击波
    bodySprings.rotate.target = 0;
    bodySprings.y.target = -12;
    tinySpring.target = 1.22;
    eyePulse = 1.6;

    // 产生强烈的能量粒子爆发与星光散开
    spawnBurst(24);
    spawnStarBurst(10);

    // 环形彩虹冲击波
    spawnRainbowArcWrap({
      cx: 114, cy: 114,
      rx: 85, ry: 45,
      tiltDeg: 45,
      colors: [['#ff5d9e', '#ffd84d'], ['#08c77a', '#79e2d0'], ['#2f86ed', '#8656f6']],
      duration: 1200,
      count: 4
    });

    safeActionTimeout(() => {
      tinySpring.target = 1.0;
      bodySprings.y.target = 0;
    }, 280);
  }, 1050);

  // 4. 变身展示维持 1.8s 后，优雅变回圆球基础形态（blob）
  safeActionTimeout(() => {
    startShapeMorph('blob');
    bodySprings.rotate.target = 0;
    bodySprings.y.target = 0;
    tinySpring.target = 1.0;
    spawnBurst(12);
  }, 2850);

  // 5. 动作完整收尾
  safeActionTimeout(() => {
    isActionPlaying = false;
  }, 3350);
}

// 动画导演：独立运行动作序列，不与状态强绑定
const ACTIONS = [doAction1, doAction2, doAction3, doAction4, doAction5, doAction6, doAction7, doAction8];
window.playAction = function(num) {
  if (num >= 1 && num <= 8) {
    ACTIONS[num - 1]();
  }
};

function pickDirectorAction() {
  return pick(ACTIONS);
}

function scheduleAction() {
  if (theme !== 'colorful' || currentSystemState !== 'normal') return;
  if (autoPaused || !ACTIONS.length || isActionPlaying || dragging) return;
  if (Math.random() < 0.12) pickDirectorAction()();
}

let actionLoopTimer = null;
function scheduleActionLoop() {
  clearTimeout(actionLoopTimer);
  if (theme !== 'colorful') return;
  actionLoopTimer = setTimeout(() => {
    if (theme === 'colorful' && currentSystemState === 'normal' && !autoPaused && !isActionPlaying && !dragging) {
      pickDirectorAction()();
    }
    scheduleActionLoop();
  }, rand(45000, 90000)); // 温和舒适的频率：每 45~90 秒（约 1~1.5 分钟）轮巡一次大动作
}

function setEffect(state) {
  fxLayer.className = '';
  stopCurveFx();
  clearInterval(fxSpawnTimer); clearInterval(fxFwTimer); clearInterval(fxBurstTimer);
  clearInterval(fxNoteTimer); clearInterval(fxStarTimer);
  fxSpawnTimer = null; fxFwTimer = null; fxBurstTimer = null;
  fxNoteTimer = null; fxStarTimer = null;
  const dots = fxLayer.querySelector('.fx-dots');
  if (dots) dots.remove();
  const ring = FX_RING[state];
  if (ring) fxLayer.classList.add(ring);
  if (state === 'sleeping' && currentSystemState === 'sleep') {
    fxLayer.classList.add('fx-soft-breath');
  }
  if (FX_CURVE[state]) startCurveFx(FX_CURVE[state]);
  if (FX_DOTS.has(state)) {
    const d = document.createElement('div');
    d.className = 'fx-dots';
    d.innerHTML = '<i></i><i></i><i></i>';
    fxLayer.appendChild(d);
  }
  if (state === 'humming') {            // 视频同款音符：头顶上浮摇摆，1.7s 节奏循环
    spawnNoteSwing(2);
    fxNoteTimer = setInterval(() => { if (!autoPaused) spawnNoteSwing(2); }, 1700);
  }
  if (state === 'excited') {            // 视频同款星星：四周放射扩散放大淡出，金/白
    spawnStarBurst(10);
    fxStarTimer = setInterval(() => { if (!autoPaused) spawnStarBurst(10); }, 1500);
  }
  if (FX_PARTICLE[state]) {
    const rate = FX_PARTICLE[state];
    for (let i = 0; i < (state === 'celebrate' ? 10 : 2); i++) spawnFxParticle(state);
    fxSpawnTimer = setInterval(() => { if (!autoPaused) spawnFxParticle(state); }, rate);
  }
  if (FX_BURST[state]) {
    spawnBurst();
    fxBurstTimer = setInterval(() => { if (!autoPaused) spawnBurst(); }, FX_BURST[state]);
  }
  if (FX_FIREWORK[state]) {
    spawnFirework();
    fxFwTimer = setInterval(() => { if (!autoPaused) spawnFirework(); }, FX_FIREWORK[state]);
  }
}


  // Grok Bot Player integration
  let grokBotInstance = null;
  let grokTimer = null;
  let grokActive = false;
  let grokIdx = 0;

  const GROK_NATIVE_STATES = [
    "idle", "thinking", "searching", "coding", "running", "curious",
    "playful", "surprised", "excited", "shy", "orbit", "radar",
    "spawning", "loading", "bouncing", "happy", "reading", "working"
  ];
  const GROK_STATE_MOODS = {
    idle: "Grok 待机中",
    thinking: "正在深度思考...",
    searching: "正在全网检索...",
    coding: "正在编写代码...",
    running: "全速计算中...",
    curious: "好奇地张望",
    playful: "调皮一下~",
    surprised: "发现新奇事物！",
    excited: "超级兴奋！",
    shy: "害羞中",
    orbit: "行星轨道漫游",
    radar: "开启雷达探测",
    spawning: "正在孕育新点子",
    loading: "数据加载中...",
    bouncing: "雀跃跳动",
    happy: "心情极好~",
    reading: "研读长篇文档",
    working: "专注工作中"
  };

  function initGrokBot() {
    if (grokBotInstance) return;
    const container = document.getElementById("grok-container");
    if (!container || typeof window.createGrokBot !== "function") return;
    grokBotInstance = window.createGrokBot(container, {
      size: 230,
      state: "idle",
      seed: Math.floor(Math.random() * 1000) + 1,
      follow: true,
      data: window.__GROK_RECIPES__
    });
  }

  // Populate Grok 53-state & 28-clip selectors in Card 2
  const grokStateSelect = document.getElementById("grok-state-select");
  const grokClipSelect = document.getElementById("grok-clip-select");
  if (window.__GROK_RECIPES__) {
    if (grokStateSelect && window.__GROK_RECIPES__.states) {
      Object.keys(window.__GROK_RECIPES__.states).forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = "Grok状态: " + st;
        grokStateSelect.appendChild(opt);
      });
      grokStateSelect.addEventListener("change", () => {
        const st = grokStateSelect.value;
        if (!st) return;
        if (theme !== "grok") applyTheme("grok");
        clearTimeout(grokTimer);
        if (grokBotInstance) {
          grokBotInstance.setState(st);
          showMood(GROK_STATE_MOODS[st] || ("Grok · " + st));
        }
      });
    }
    if (grokClipSelect && window.__GROK_RECIPES__.clips) {
      const clipToState = {};
      Object.entries(window.__GROK_RECIPES__.states).forEach(([st, def]) => {
        (def.clips || []).concat(def.compactClips || []).forEach(cn => { if (!clipToState[cn]) clipToState[cn] = st; });
      });
      Object.values(window.__GROK_RECIPES__.clips).map(c => c.name).forEach(cl => {
        const opt = document.createElement("option");
        opt.value = clipToState[cl] || "";
        opt.textContent = "Grok动作: " + cl;
        grokClipSelect.appendChild(opt);
      });
      grokClipSelect.addEventListener("change", () => {
        const cl = grokClipSelect.value; // 对应包含该 clip 的 Grok 状态（grok-player 无直接播放 clip 的公开 API）
        if (!cl) return;
        if (theme !== "grok") applyTheme("grok");
        clearTimeout(grokTimer);
        if (grokBotInstance) {
          grokBotInstance.setState(cl);
          showMood("🎬 " + grokClipSelect.options[grokClipSelect.selectedIndex].textContent);
        }
      });
    }
  }

  function grokNext() {
    if (!grokActive || !grokBotInstance || autoPaused) return;
    if (currentSystemState === "coding") {
      grokBotInstance.setState("coding");
      grokTimer = setTimeout(grokNext, 4500);
      return;
    }
    if (currentSystemState === "error") {
      grokBotInstance.setState("surprised");
      grokTimer = setTimeout(grokNext, 3500);
      return;
    }
    if (currentSystemState === "sleep") {
      grokBotInstance.setState("idle");
      grokTimer = setTimeout(grokNext, 5500);
      return;
    }
    grokIdx = (grokIdx + 1) % GROK_NATIVE_STATES.length;
    const s = GROK_NATIVE_STATES[grokIdx];
    grokBotInstance.setState(s);
    showMood(GROK_STATE_MOODS[s] || s);
    const dur = (s === "idle" || s === "thinking" || s === "working")
      ? (3500 + Math.random() * 2500)
      : (2500 + Math.random() * 2000);
    grokTimer = setTimeout(grokNext, dur);
  }

  function startGrokShow() {
    if (grokActive) return;
    grokActive = true;
    initGrokBot();
    const c = document.getElementById("grok-container");
    const s3d = document.getElementById("skin3d-container");
    if (c) c.style.display = "block";
    if (bot3d) bot3d.style.display = "none";
    if (s3d) s3d.style.display = "none";
    if (grokBotInstance) {
      grokBotInstance.setState("idle");
      showMood("Grok Bot 就绪");
    }
    clearTimeout(grokTimer);
    grokTimer = setTimeout(grokNext, 2500);
  }

  function stopGrokShow() {
    grokActive = false;
    clearTimeout(grokTimer);
    grokTimer = null;
    const c = document.getElementById("grok-container");
    if (c) c.style.display = "none";
  }

  function clearAllEffects() {
    if (fxSpawnTimer) { clearInterval(fxSpawnTimer); fxSpawnTimer = null; }
    if (fxFwTimer) { clearInterval(fxFwTimer); fxFwTimer = null; }
    if (fxBurstTimer) { clearInterval(fxBurstTimer); fxBurstTimer = null; }
    if (fxNoteTimer) { clearInterval(fxNoteTimer); fxNoteTimer = null; }
    if (fxStarTimer) { clearInterval(fxStarTimer); fxStarTimer = null; }
    if (sysConvergeTimer) { clearInterval(sysConvergeTimer); sysConvergeTimer = null; }
    stopCurveFx();
    if (typeof stopShapeShow === "function") stopShapeShow();
    if (typeof clearActionFx === "function") clearActionFx();
    isActionPlaying = false;
    const layer = document.getElementById("fx");
    if (layer) {
      layer.className = "";
      Array.from(layer.children).forEach(ch => {
        if (!ch.classList.contains("rainbow-ring") && !ch.classList.contains("ripple")) {
          ch.remove();
        }
      });
    }
  }

  function syncThemeBar() {
    themeBar.querySelectorAll("button[data-theme]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-theme") === theme);
    });
  }

  function applyTheme(t, opts = {}) {
    theme = VALID_THEMES.includes(t) ? t : "ceramic";
    try { localStorage.setItem("moodie-theme", theme); } catch (_) {}
    const grokEl = document.getElementById("grok-container");
    const skin3dEl = document.getElementById("skin3d-container");

    stopGrokShow();
    clearAllEffects();
    syncThemeBar();

    if (theme === "ceramic" || theme === "submarine") {
      botStage.classList.add("grok-theme");
      if (bot3d) bot3d.style.display = "none";
      if (grokEl) grokEl.style.display = "none";
      if (skin3dEl) {
        skin3dEl.style.display = "block";
        if (window.Moodie3DSkins) {
          window.Moodie3DSkins.mount(skin3dEl, theme);
          window.Moodie3DSkins.setSystemState(currentSystemState);
          if (selectedColor && selectedColor[2]) {
            window.Moodie3DSkins.setColor(selectedColor[2]);
          }
        }
      }
      if (!opts.silentMood) {
        showMood(THEME_LABELS[theme], opts.boot ? 12000 : 3800);
      }
    } else if (theme === "grok") {
      if (window.Moodie3DSkins) window.Moodie3DSkins.unmount();
      if (skin3dEl) skin3dEl.style.display = "none";
      botStage.classList.add("grok-theme");
      startGrokShow();
      if (!opts.silentMood) showMood(THEME_LABELS.grok);
    } else {
      if (window.Moodie3DSkins) window.Moodie3DSkins.unmount();
      if (skin3dEl) skin3dEl.style.display = "none";
      if (grokEl) grokEl.style.display = "none";
      if (bot3d) bot3d.style.display = "block";
      botStage.classList.remove("grok-theme");
      if (selectedColor) {
        document.documentElement.style.setProperty("--bot-color", selectedColor[2]);
      }
      setEffect(activeState);
      if (!opts.silentMood) showMood(THEME_LABELS.colorful);
    }

    if (currentSystemState !== "normal") {
      renderSystemStateVisuals(currentSystemState, { silentMood: true });
    }
    if (window.electronAPI && window.electronAPI.syncUiState) {
      window.electronAPI.syncUiState({ theme, systemState: currentSystemState, paused: autoPaused });
    }
  }

  // System perception visuals (coding / error / sleep / normal)
  function spawnSingleConvergeParticle() {
    if (!actionLayer || autoPaused) return;
    const colors = ["#38bdf8", "#ff5d9e", "#08c77a", "#ffd84d", "#8656f6", "#79e2d0"];
    const angle = Math.random() * Math.PI * 2;
    const dist = 68 + Math.random() * 52;
    const startX = 114 + Math.cos(angle) * dist;
    const startY = 114 + Math.sin(angle) * dist;
    const col = colors[Math.floor(Math.random() * colors.length)];
    const size = 8 + Math.random() * 7;

    const p = document.createElement("div");
    p.className = "sys-converge-particle";
    p.style.cssText = `
      position: absolute;
      left: ${startX - size / 2}px; top: ${startY - size / 2}px;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: ${col};
      box-shadow: 0 0 12px ${col}, 0 0 20px ${col};
      opacity: 0.25;
      pointer-events: none;
      z-index: 6;
    `;
    actionLayer.appendChild(p);

    p.animate([
      { transform: "translate(0, 0) scale(0.55)", opacity: 0.2 },
      { transform: `translate(${(114 - startX) * 0.48}px, ${(114 - startY) * 0.48}px) scale(1.12)`, opacity: 0.92, offset: 0.48 },
      { transform: `translate(${114 - startX}px, ${114 - startY}px) scale(0.25)`, opacity: 1, offset: 0.9 },
      { transform: `translate(${114 - startX}px, ${114 - startY}px) scale(0)`, opacity: 0 }
    ], { duration: 720, easing: "cubic-bezier(0.4, 0.0, 0.2, 1)", fill: "forwards" }).onfinish = () => {
      p.remove();
    };
  }

  function spawnCrossThemeErrorWarning() {
    if (!actionLayer) return;
    const blueDot = document.createElement("div");
    blueDot.className = "blue-dot-pop sys-error-blue-orb";
    blueDot.style.left = "180px";
    blueDot.style.top = "36px";
    blueDot.style.zIndex = "8";
    actionLayer.appendChild(blueDot);

    const exclaimBadge = document.createElement("div");
    exclaimBadge.className = "fx-exclaim sys-error-exclaim";
    exclaimBadge.textContent = "!";
    exclaimBadge.style.cssText = `
      position: absolute; left: 36px; top: 28px;
      width: 28px; height: 28px; border-radius: 50%;
      background: #ff3347; color: #fff;
      display: grid; place-items: center;
      font-size: 18px; font-weight: 900;
      box-shadow: 0 0 16px #ff3347; z-index: 8;
    `;
    actionLayer.appendChild(exclaimBadge);

    safeActionTimeout(() => {
      blueDot.remove();
      exclaimBadge.remove();
    }, 3200);
  }

  function renderSystemStateVisuals(sysState, opts = {}) {
    if (sysConvergeTimer) {
      clearInterval(sysConvergeTimer);
      sysConvergeTimer = null;
    }
    if (window.Moodie3DSkins && (theme === "ceramic" || theme === "submarine")) {
      window.Moodie3DSkins.setSystemState(sysState);
    }
    if (sysState === "coding") {
      if (theme === "colorful") {
        isActionPlaying = false;
        applyState("working");
        doAction2();
      } else {
        if (theme === "grok" && grokBotInstance) grokBotInstance.setState("coding");
        fxLayer.className = "fx-curve";
        startCurveFx("lissajous");
        for (let i = 0; i < 8; i++) {
          setTimeout(() => spawnSingleConvergeParticle(), i * 110);
        }
      }
      sysConvergeTimer = setInterval(() => {
        if (currentSystemState !== "coding" || autoPaused) return;
        for (let i = 0; i < 4; i++) {
          setTimeout(() => spawnSingleConvergeParticle(), i * 140);
        }
      }, 2200);
    } else if (sysState === "error") {
      if (theme === "colorful") {
        isActionPlaying = false;
        applyState("alerting");
        doAction6();
      } else {
        if (theme === "grok" && grokBotInstance) grokBotInstance.setState("surprised");
        stopCurveFx();
        fxLayer.className = "fx-alert";
        spawnCrossThemeErrorWarning();
      }
    } else if (sysState === "sleep") {
      clearActionFx();
      isActionPlaying = false;
      stopCurveFx();
      if (theme === "colorful") {
        applyState("sleeping");
        fxLayer.classList.add("fx-soft-breath");
      } else {
        if (theme === "grok" && grokBotInstance) grokBotInstance.setState("idle");
        fxLayer.className = "fx-soft-breath";
        clearInterval(fxSpawnTimer);
        spawnFxParticle("sleeping");
        fxSpawnTimer = setInterval(() => {
          if (!autoPaused && currentSystemState === "sleep") spawnFxParticle("sleeping");
        }, 950);
      }
    } else {
      fxLayer.classList.remove("fx-soft-breath", "fx-alert");
      if (theme === "colorful") {
        applyState("idle");
      } else if (theme === "grok" && grokBotInstance) {
        grokBotInstance.setState("idle");
      } else {
        clearAllEffects();
      }
    }
  }

  function applySystemPerception(payload) {
    if (!payload || !payload.state) return;
    const nextState = payload.state;
    currentSystemState = nextState;

    if (systemHudEl && hudTextEl) {
      systemHudEl.setAttribute("data-state", nextState);
      const badgeMap = {
        coding: "⚡ 专注搬砖 · 向心汇聚",
        error: "⚠️ 异常警告 · 感叹蓝球",
        sleep: "🌙 柔光呼吸 · 趴着打呼",
        normal: "✨ 灵动伴随"
      };
      const taskSuffix = payload.taskName ? ` (${payload.taskName})` : "";
      hudTextEl.textContent = (payload.badge || badgeMap[nextState] || "✨ 灵动伴随") + taskSuffix;
      if (payload.reason) {
        systemHudEl.title = `${payload.reason}（点击可切换感知状态）`;
      }
    }

    renderSystemStateVisuals(nextState);
    if (payload.line) showMood(payload.line);
    else if (payload.reason) showMood(payload.reason);

    if (window.electronAPI && window.electronAPI.syncUiState) {
      window.electronAPI.syncUiState({
        theme,
        systemState: currentSystemState,
        paused: autoPaused
      });
    }
  }

  if (systemHudEl) {
    systemHudEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const order = ["coding", "error", "sleep", "normal"];
      const next = order[(order.indexOf(currentSystemState) + 1) % order.length];
      const reasonMap = {
        coding: "⚡ 专注搬砖：向心粒子汇聚充能中！",
        error: "⚠️ 任务异常：感叹号与蓝球警告已触发！",
        sleep: "🌙 柔光呼吸：趴着打个呼噜 zzZ",
        normal: "✨ 已恢复灵动伴随模式"
      };
      applySystemPerception({ state: next, reason: reasonMap[next], line: reasonMap[next] });
    });
  }

  // 6. Hook existing moodle-lab.html functions (chooseExpression, applyState, applyColor, applyShape, playQuickAction, renderShareCard)
  const origChooseExpression = window.chooseExpression;
  window.chooseExpression = function (index) {
    origChooseExpression(index);
    if (window.Moodie3DSkins && window.Moodie3DSkins.engine) {
      window.Moodie3DSkins.engine.chooseExpression(index);
    }
  };

  // Fix SVGElement.className getter-only TypeError in moodle-lab.html:3475 using master:pet.html:1076-1092 implementation
  window.stateMotion = function (name) {
    const bounce = ["excited", "happy", "laughing", "playful", "celebrate", "bouncing"],
      tilt = ["listening", "thinking", "curious", "confused", "shy", "dragging"],
      scan = ["searching", "working", "radar", "dictating", "writing", "uploading"],
      turning = ["orbit", "spawning", "sending", "receiving"],
      pulse = ["sleeping", "drowsy", "bored", "humming", "loading", "progress", "powering-down"];
    let cls = "glitch";
    if (bounce.includes(name)) cls = "bounce";
    else if (tilt.includes(name)) cls = "tilt";
    else if (scan.includes(name)) cls = "scan";
    else if (turning.includes(name)) { cls = "turn"; viewer.classList.add("guides"); }
    else if (pulse.includes(name)) cls = "pulse";
    bot.classList.remove("act-bounce", "act-tilt", "act-scan", "act-turn", "act-pulse", "act-glitch");
    void bot.offsetWidth;
    bot.classList.add(`act-${cls}`);
    setTimeout(() => { bot.classList.remove(`act-${cls}`); viewer.classList.remove("guides"); }, 1100);
  };

  const origApplyState = window.applyState;
  window.applyState = function (name) {
    origApplyState(name);
    if (theme === "colorful") {
      setEffect(name);
    }
    if (window.Moodie3DSkins && (theme === "ceramic" || theme === "submarine")) {
      window.Moodie3DSkins.setState(name);
    }
    if (theme === "grok" && grokBotInstance) {
      const gState = (window.__GROK_RECIPES__ && window.__GROK_RECIPES__.states && window.__GROK_RECIPES__.states[name]) ? name : "idle";
      grokBotInstance.setState(gState);
    }
    showLine(name);
  };

  const origApplyColor = window.applyColor;
  window.applyColor = function (item) {
    origApplyColor(item);
    if (window.Moodie3DSkins && (theme === "ceramic" || theme === "submarine") && item && item[2]) {
      window.Moodie3DSkins.setColor(item[2]);
    }
  };

  const origApplyShape = window.applyShape;
  window.applyShape = function (item) {
    origApplyShape(item);
    if (item && item[0] && typeof startShapeMorph === "function") {
      startShapeMorph(item[0]);
    }
  };

  const origPlayQuickAction = window.playQuickAction;
  window.playQuickAction = function (name) {
    bot.classList.remove("quick-celebrate");
    origPlayQuickAction(name);
    if (window.Moodie3DSkins && (theme === "ceramic" || theme === "submarine")) {
      window.Moodie3DSkins.boop();
    } else if (theme === "grok" && grokBotInstance) {
      grokBotInstance.poke("quick");
    }
  };

  // Enhance renderShareCard so when in 3D ceramic / submarine mode, it also composites the live 3D WebGL canvas if available
  const origRenderShareCard = window.renderShareCard;
  if (typeof origRenderShareCard === "function") {
    window.renderShareCard = function (snapshot) {
      if ((theme === "ceramic" || theme === "submarine") && window.Moodie3DSkins && window.Moodie3DSkins.renderer) {
        try {
          window.Moodie3DSkins.renderer.render(window.Moodie3DSkins.scene, window.Moodie3DSkins.camera);
        } catch (_) {}
      }
      return origRenderShareCard(snapshot);
    };
  }

  // Run supplemental rAF step for 3D yaw/pitch turn & tinySpring on #bot3d
  let lastBridgeTime = performance.now();
  function bridgeFrame(now) {
    const dt = Math.min((now - lastBridgeTime) / 1000, 0.1);
    lastBridgeTime = now;
    const yaw = yawSpring.step(yawSpring.target ?? 0, dt);
    const pitch = pitchSpring.step(pitchSpring.target ?? 0, dt);
    if (bot3d) {
      bot3d.style.transform = `rotateY(${yaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg)`;
    }
    requestAnimationFrame(bridgeFrame);
  }
  requestAnimationFrame(bridgeFrame);

  // 7. Pointer interactions on .bot-stage (hover gaze, drag 3D yaw/pitch turn, single-click within 380ms, double-click within 380ms, contextmenu)
  let dragging = false, moveDist = 0, dragYaw = 0, dragPitch = 0, lastPointerX = 0, lastPointerY = 0;
  let clickCount = 0, clickTimer = null;

  viewer.addEventListener("pointermove", (e) => {
    const r = viewer.getBoundingClientRect();
    const dx = clamp(((e.clientX - (r.left + r.width / 2)) / r.width) * 2, -0.6, 0.6);
    const dy = clamp(((e.clientY - (r.top + r.height / 2)) / r.height) * 2, -0.6, 0.6);
    if (window.Moodie3DSkins && (theme === "ceramic" || theme === "submarine")) {
      window.Moodie3DSkins.setGaze(dx / 0.6, dy / 0.6);
    }
  });
  viewer.addEventListener("pointerleave", () => {
    if (window.Moodie3DSkins) window.Moodie3DSkins.clearGaze();
  });

  botStage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target && e.target.closest && (e.target.closest("#system-hud") || e.target.closest(".size-ctrl"))) return;
    dragging = true;
    moveDist = 0;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    dragYaw = yawSpring.x;
    dragPitch = pitchSpring.x;
    botStage.classList.add("dragging");
    try { botStage.setPointerCapture(e.pointerId); } catch (_) {}
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const mx = (typeof e.movementX === "number" && e.movementX !== 0) ? e.movementX : (e.clientX - lastPointerX);
    const my = (typeof e.movementY === "number" && e.movementY !== 0) ? e.movementY : (e.clientY - lastPointerY);
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    moveDist += Math.abs(mx) + Math.abs(my);
    dragYaw = clamp(dragYaw + mx * 0.55, -44, 44);
    dragPitch = clamp(dragPitch + my * 0.42, -26, 26);
    yawSpring.target = dragYaw;
    pitchSpring.target = dragPitch;
    if (window.Moodie3DSkins && (theme === "ceramic" || theme === "submarine")) {
      window.Moodie3DSkins.setTurn(dragYaw, dragPitch);
    }
  });

  function endStageDrag(e) {
    if (!dragging) return;
    dragging = false;
    botStage.classList.remove("dragging");
    yawSpring.target = 0;
    pitchSpring.target = 0;
    if (window.Moodie3DSkins) window.Moodie3DSkins.releaseTurn();

    if (moveDist < 6) {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 380);

      if (clickCount >= 2) {
        clickCount = 0;
        if (theme === "colorful") {
          doAction8();
        } else if (theme === "ceramic" || theme === "submarine") {
          if (window.Moodie3DSkins) {
            window.Moodie3DSkins.burstSpecial();
            window.Moodie3DSkins.triggerClickReaction(e ? e.clientX : 114, e ? e.clientY : 114);
          }
          spawnBurst(18);
          showMood(theme === "ceramic" ? "🏺 骨瓷双翼流光绽放 ✨" : "🫧 全息舱全频段声呐扫描开启 🌊");
        } else if (theme === "grok" && grokBotInstance) {
          grokBotInstance.setState("orbit");
          showMood("🪐 Grok 星轨加速！");
        }
        return;
      }

      if (theme === "ceramic" || theme === "submarine") {
        if (window.Moodie3DSkins) {
          window.Moodie3DSkins.triggerClickReaction(e ? e.clientX : 114, e ? e.clientY : 114);
        }
        showMood(
          theme === "ceramic"
            ? pick(["🏺 温润骨瓷为您祈福 ✨", "天使皇冠闪了一下~", "摸摸小瓷球，Bug 全退散！"])
            : pick(["🫧 深海声呐脉冲已发射 ~", "全息舱段压力正常，航向稳定！", "咕噜噜…深海潜航伴随中 🌊"])
        );
      } else if (theme === "grok" && grokBotInstance) {
        clearTimeout(grokTimer);
        const r = Math.random();
        if (r < 0.4) {
          const nextS = pick(GROK_NATIVE_STATES);
          grokBotInstance.setState(nextS);
          showMood(GROK_STATE_MOODS[nextS] || "切换状态");
        } else if (r < 0.7) {
          grokBotInstance.poke("quick");
          showMood(pick(["哎呀戳我干嘛~", "在呢在呢！", "Grok 受到轻戳 ✨"]));
        } else {
          grokBotInstance.blink();
          showMood("给你眨眨眼 (•_•)");
        }
        grokTimer = setTimeout(grokNext, 3000 + Math.random() * 2000);
      } else {
        reaction = { type: "squash", t: 0, dur: 620 };
        eyePulse = 1;
        blink();
        for (let i = 0; i < 3; i++) setTimeout(() => spawnFxParticle("happy"), i * 180);
        showMood(pick(["嘿嘿~被摸头啦", "舒服～(◡‿◡)", "再来一下嘛", "哎呀别戳啦", "双击我有变身秀✨"]));
      }
    }
  }
  window.addEventListener("pointerup", endStageDrag);
  window.addEventListener("pointercancel", endStageDrag);

  // Size control buttons (.size-ctrl)
  const sizeCtrlEl = document.getElementById("size-ctrl");
  if (sizeCtrlEl) {
    sizeCtrlEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-size]");
      if (!btn) return;
      e.stopPropagation();
      const act = btn.getAttribute("data-size");
      if (act === "minus") applyScale(petScale * 2 / 3);
      else if (act === "plus") applyScale(petScale * 3 / 2);
      else applyScale(1);
    });
  }

  // Theme bar & Menu button
  themeBar.addEventListener("click", (e) => {
    const tBtn = e.target.closest("button[data-theme]");
    if (tBtn) {
      applyTheme(tBtn.getAttribute("data-theme"));
      return;
    }
    const menuBtn = e.target.closest("#open-context-menu-btn");
    if (menuBtn && window.electronAPI && window.electronAPI.showMenu) {
      e.stopPropagation();
      const rect = menuBtn.getBoundingClientRect();
      window.electronAPI.showMenu(rect.left, rect.bottom + 6);
    }
  });

  // Director 8 continuous actions buttons in Card 2
  const directorWrap = document.getElementById("pet-director-actions");
  if (directorWrap) {
    directorWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-director-action]");
      if (!btn) return;
      const num = Number(btn.getAttribute("data-director-action"));
      if (theme !== "colorful") applyTheme("colorful", { silentMood: true });
      if (typeof window.playAction === "function") {
        window.playAction(num);
      }
    });
  }

  // Context menu on viewer right-click
  viewer.addEventListener("contextmenu", (e) => {
    if (window.electronAPI && window.electronAPI.showMenu) {
      e.preventDefault();
      window.electronAPI.showMenu(e.clientX, e.clientY);
    }
  });

  function togglePause() {
    autoPaused = !autoPaused;
    if (window.Moodie3DSkins) {
      if (autoPaused) window.Moodie3DSkins.pause();
      else window.Moodie3DSkins.resume();
    }
    showMood(autoPaused ? "休息中…" : "继续啦~");
    if (window.electronAPI && window.electronAPI.syncUiState) {
      window.electronAPI.syncUiState({ theme, systemState: currentSystemState, paused: autoPaused });
    }
    return autoPaused;
  }

  // Expose window.moodiePet API identical to master:pet.html
  window.moodiePet = {
    getTheme: () => theme,
    setTheme: (t) => applyTheme(t),
    getSystemState: () => currentSystemState,
    triggerSystemState: (s, reason, taskName) =>
      applySystemPerception({ state: s, reason: reason || "", taskName: taskName || "" }),
    nextMood: () => {
      const s = pick(ALL_STATES.filter(x => x !== activeState)) || pick(ALL_STATES);
      window.applyState(s);
    },
    randomLook: () => {
      const col = pick(GROKBOT_COLORS);
      window.applyColor(col);
      window.chooseExpression(Math.floor(Math.random() * DATA.EXPRESSIONS.length));
      window.playQuickAction(pick(["bounce", "peek", "wave", "squish", "shake"]));
      showMood(pick(["今日新穿搭 ✨", "新造型打卡！", "换了一套新皮肤～", "怎么样，好看吗？"]));
    },
    wink: () => {
      window.chooseExpression(25);
      showMood("给你一个 Wink ✨");
      spawnFxParticle("excited");
      window.playQuickAction("peek");
    },
    particleStorm: (s, e) => {
      if (theme !== "colorful") applyTheme("colorful", { silentMood: true });
      doAction8(s, e);
    },
    togglePause,
    idlePause: () => { if (!autoPaused) togglePause(); },
    idleResume: () => { if (autoPaused) togglePause(); },
    quit: () => showMood("网页版常驻伴随中 ✨")
  };

  // Context menu action handler identical to master:pet.html lines 2764-2809
  if (window.electronAPI && window.electronAPI.onMenuAction) {
    window.electronAPI.onMenuAction((action) => {
      if (action.indexOf("theme:") === 0) {
        const targetTheme = action.slice(6);
        applyTheme(targetTheme);
      } else if (action === "sys:auto-on") {
        showMood("🔄 已开启系统工作流自动感知 ✓");
      } else if (action === "sys:auto-off") {
        showMood("⏸️ 已暂停自动感知（保留手动触发）");
      } else if (action.indexOf("color:") === 0) {
        const hex = action.slice(6);
        const item = GROKBOT_COLORS.find(c => c[2].toLowerCase() === hex.toLowerCase());
        if (item) {
          window.applyColor(item);
          showMood(getColorLine(item[0]));
        }
      } else if (action.indexOf("shape:") === 0) {
        if (theme !== "colorful") applyTheme("colorful", { silentMood: true });
        const sId = action.slice(6);
        const sItem = GROKBOT_SHAPES.find(s => s[0] === sId);
        if (sItem) {
          window.applyShape(sItem);
          showMood(sId === "cloud" ? "欸？云朵！" : "变" + sItem[1] + "～");
        }
      } else if (action.indexOf("accessory:") === 0) {
        if (theme !== "colorful") applyTheme("colorful", { silentMood: true });
        const accId = action.slice(10);
        if (accId === "clear") {
          GROKBOT_ACCESSORIES.forEach(item => setSelection("accessory", item[0], false));
        } else {
          setSelection("accessory", accId, !selectedAccessories.has(accId));
        }
      } else if (action === "action:storm" || action === "particleStorm") {
        if (theme !== "colorful") applyTheme("colorful", { silentMood: true });
        doAction8();
      } else if (action.indexOf("size:") === 0) {
        const v = action.slice(5);
        if (v === "minus") applyScale(petScale * 2 / 3);
        else if (v === "plus") applyScale(petScale * 3 / 2);
        else applyScale(1);
      } else if (action === "autostart:on") {
        showMood("开机自启 ✓（桌面版专属）");
      } else if (action === "autostart:off") {
        showMood("关闭自启（桌面版专属）");
      } else if (window.moodiePet[action]) {
        window.moodiePet[action]();
      }
    });
  }

  // 8. Boot with pink color (#ff2d8b, GROKBOT_COLORS[8]) and ceramic 3D Bone-China Angel Ball to match docs/preview-3d-angel.png 1:1
  const pinkColorItem = GROKBOT_COLORS[8]; // ['pink','桃粉','#ff2d8b']
  if (pinkColorItem) {
    window.applyColor(pinkColorItem);
  }
  applyTheme(theme, { boot: true });
})();
