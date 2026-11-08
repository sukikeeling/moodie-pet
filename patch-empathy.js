/* Moodie 共情层补丁 (FEATURE_EMPATHY_V25)
 * 纯逻辑模块，可在 pet.html 内联，也可 node 直接 require 自测。
 * 接入点（均有开关，关掉即恢复 2.0 行为）：
 *   1. randLine(state)            -> Empathy.pickLine(state, STATE_LINES, now)
 *   2. applySystemPerception(p)   -> Empathy.onSystemState(prev, next, now) 返回微剧场指令
 *   3. changeState/scheduleChatter 开头 -> if (Empathy.isSilent(Date.now())) 让位
 * 隐私：只记事件类型与时间，不记窗口标题/文件名；不写盘。
 */
(function (root) {
  'use strict';
  const FEATURE_EMPATHY_V25 = true;

  // ---- 1. 时段 ----
  function timeBand(date) {
    const h = (date || new Date()).getHours();
    if (h >= 5 && h < 11) return 'dawn';
    if (h >= 11 && h < 17) return 'noon';
    if (h >= 17 && h < 23) return 'dusk';
    return 'night';
  }

  // 时段台词池：只写"有时段味道"的状态，其余回落 STATE_LINES 原池
  const STATE_LINES_BAND = {
    idle:     { dawn: ['早呀，今天先从哪件事开始？', '新的一天，慢慢来~'],
                dusk: ['今天辛苦啦，歇一歇也行', '天要黑了，灯记得开'],
                night:['夜深了，我小声陪着你', '还没睡呀…我也不困'] },
    working:  { dawn: ['一早就开工，真勤快', '先把最难的那件做掉？'],
                noon: ['午后犯困？我替你盯着', '专注模式，稳稳的'],
                dusk: ['再冲一会儿，就收工', '傍晚的灵感最好用'],
                night:['这么晚了，我陪着你', '深夜的代码，我替你守着'] },
    sleeping: { night:['晚安…我先睡啦', '梦里也给你留盏灯'],
                noon: ['午觉时间，呼…'] },
    happy:    { dawn: ['早上就这么开心！'], night:['夜里偷偷开心一下'] },
    waking:   { dawn: ['早安~', '呼啊…新的一天'],
                noon: ['睡醒啦，下午好'],
                dusk: ['晚上好呀'],
                night:['嗯？夜里叫我？'] },
  };

  // ---- 2. 短时记忆（仅内存）----
  const RECENT_N = 8;
  const memory = {
    recent: Object.create(null),   // state -> 最近 N 句
    sessionStart: 0,
    codingSince: 0,                // >0 表示正在连续 coding
    codingRemindedAt: 0,
    errorCountToday: 0,
    errorDay: '',
    lastErrorRecoverAt: 0,
    silentUntil: 0,
    greeted: false,
  };
  function reset(now) {
    memory.recent = Object.create(null);
    memory.sessionStart = now || 0;
    memory.codingSince = memory.codingRemindedAt = 0;
    memory.errorCountToday = 0; memory.errorDay = '';
    memory.lastErrorRecoverAt = memory.silentUntil = 0;
    memory.greeted = false;
  }
  function dayKey(now) { const d = new Date(now); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }

  // 候选池 = 时段池(若有) + 通用池；过滤近 N 句；耗尽则清空该状态历史重来
  function pickLine(state, lines, now, rnd) {
    rnd = rnd || Math.random;
    const base = (lines && lines[state]) || [state];
    if (!FEATURE_EMPATHY_V25) return base[Math.floor(rnd() * base.length)];
    const band = timeBand(new Date(now || Date.now()));
    const bandPool = (STATE_LINES_BAND[state] && STATE_LINES_BAND[state][band]) || [];
    // 今天出错 >=3 次：不开玩笑，用安慰语气覆盖
    let pool = bandPool.concat(base);
    if (memory.errorCountToday >= 3 && COMFORT[state]) pool = COMFORT[state].concat(bandPool);
    const hist = memory.recent[state] || (memory.recent[state] = []);
    let cand = pool.filter(l => hist.indexOf(l) < 0);
    if (!cand.length) { hist.length = 0; cand = pool; }
    const line = cand[Math.floor(rnd() * cand.length)];
    hist.push(line);
    if (hist.length > RECENT_N) hist.shift();
    return line;
  }
  const COMFORT = {
    happy: ['慢慢来，不急', '先深呼吸一下'],
    celebrate: ['今天它有点难缠，我们稳住'],
    laughing: ['嗯…今天先不闹你'],
  };

  // ---- 3. 微剧场：状态边沿检测 ----
  // 返回 { line, action, silentMs, state } 或 null；action 名对应现有 playQuickAction 的 bounce/wave/squish/peek/shake
  function onSystemState(prev, next, now) {
    if (!FEATURE_EMPATHY_V25 || prev === next) return null;
    let out = null;
    const dk = dayKey(now);
    if (memory.errorDay !== dk) { memory.errorDay = dk; memory.errorCountToday = 0; }

    if (next === 'error') memory.errorCountToday++;
    if (prev === 'coding' && next !== 'coding') memory.codingSince = 0;
    if (next === 'coding' && !memory.codingSince) { memory.codingSince = now; memory.codingRemindedAt = now; }

    if (prev === 'error' && next === 'normal') {
      memory.lastErrorRecoverAt = now;
      memory.silentUntil = now + 8000;               // 防情绪错位：随机层静默 8 秒
      out = { line: '过去啦，歇口气。', action: 'bounce', silentMs: 8000, state: 'relieved' };
    } else if (next === 'sleep') {
      out = { line: timeBand(new Date(now)) === 'night' ? '晚安…我先睡啦' : '困了…先眯会儿。', action: null, silentMs: 0, state: 'drowsy' };
    } else if (next === 'coding' && timeBand(new Date(now)) === 'night') {
      out = { line: '这么晚了，我陪着你。', action: null, silentMs: 0, state: 'working', calm: true };
    } else if (next === 'error' && memory.errorCountToday >= 3) {
      out = { line: '今天它有点难缠，慢慢来。', action: null, silentMs: 0, state: 'alerting' };
    }
    return out;
  }
  // 由 scheduleChatter 每次到点调用：连续 coding >= 60 分钟提醒一次（之后每 60 分钟再提醒）
  function codingReminder(now) {
    if (!FEATURE_EMPATHY_V25 || !memory.codingSince) return null;
    if (now - memory.codingRemindedAt >= 60 * 60 * 1000) {
      memory.codingRemindedAt = now;
      return { line: '专注很久了，喝口水再继续？', action: 'wave' };
    }
    return null;
  }
  // 每天首次启动问候
  function startupGreeting(now) {
    if (!FEATURE_EMPATHY_V25 || memory.greeted) return null;
    memory.greeted = true;
    const b = timeBand(new Date(now));
    return { line: { dawn: '早呀~', noon: '午好~', dusk: '晚上好~', night: '夜深了，还在呀' }[b], action: 'wave' };
  }
  function isSilent(now) { return FEATURE_EMPATHY_V25 && now < memory.silentUntil; }

  // ---- 4. 死键与文案清理（对 pet.html 的补丁说明 + 可执行校验）----
  // STATE_REACTION 里 focused / dizzy 不在 39 个状态内：删除这两个键（pet.html:636、638）
  const DEAD_KEYS = ['focused', 'dizzy'];
  function cleanDeadKeys(reactionMap) { DEAD_KEYS.forEach(k => delete reactionMap[k]); return reactionMap; }
  // uploading 的固定进度文案：pet.html:576 去掉 '进度 70%…'，换成无数字说法
  function fixUploadingLines(lines) {
    if (lines && lines.uploading) lines.uploading = lines.uploading.map(l => /\d+%/.test(l) ? '还在搬运，别急~' : l);
    return lines;
  }
  // SKETCHES 轮换：不再 pick 随机，改按洗牌袋取，保证看遍再重复
  function makeBag(arr) {
    let bag = [];
    return () => { if (!bag.length) bag = arr.slice().sort(() => Math.random() - 0.5); return bag.pop(); };
  }

  const api = { timeBand, STATE_LINES_BAND, memory, reset, pickLine, onSystemState, codingReminder,
                startupGreeting, isSilent, cleanDeadKeys, fixUploadingLines, makeBag, DEAD_KEYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Empathy = api;
})(typeof window !== 'undefined' ? window : globalThis);
