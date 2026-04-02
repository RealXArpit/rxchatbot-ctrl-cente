(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────────────
  var config      = window.RealXChatConfig || {};
  var WEBHOOK_URL = 'https://n8n-production-5c06.up.railway.app/webhook/realx-ai';
  var API_KEY     = 'rx-chat-sk-2026-M9aG'; // replace with your VITE_API_KEY_PROD
  var CHANNEL     = 'WEBSITE';
  var TYPEWRITER_SPEED = 60; // characters per second — increase for faster, decrease for slower

  // Anonymous session persistence
  var userId = config.userId || (
    sessionStorage.getItem('rx_user_id') || (function () {
      var id = 'anon_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('rx_user_id', id);
      return id;
    })()
  );
  var sessionId = config.sessionId || (
    sessionStorage.getItem('rx_session_id') || (function () {
      var id = 'web_' + userId + '_' + Date.now();
      sessionStorage.setItem('rx_session_id', id);
      return id;
    })()
  );

  // ── State ────────────────────────────────────────────────────────────────
  var isOpen          = false;
  var isTyping        = false;
  var logId           = null;
  var typewriterTimer = null;

  // ── Styles ───────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    ':root{--rx-primary:#E8341C;--rx-primary-hover:#C42D18;--rx-bg:#0A0A0A;--rx-surface:#141414;--rx-surface2:#1C1C1C;--rx-border:#2A2A2A;--rx-text:#FFFFFF;--rx-text-muted:#888888;--rx-text-faint:#555555;--rx-user-bubble:#E8341C;--rx-user-text:#FFFFFF;--rx-bot-bubble:#1C1C1C;--rx-bot-text:#EEEEEE;--rx-input-bg:#0F0F0F;--rx-radius-panel:6px;--rx-radius-bubble:6px;--rx-radius-btn:4px;--rx-shadow:0 16px 48px rgba(0,0,0,.6),0 4px 16px rgba(0,0,0,.4);--rx-font:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;}',

    '#rx-btn{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;background:var(--rx-primary);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(232,52,28,.4);display:flex;align-items:center;justify-content:center;z-index:2147483646;transition:transform .15s ease,box-shadow .15s ease;}',
    '#rx-btn:hover{transform:scale(1.06);box-shadow:0 6px 28px rgba(232,52,28,.55);}',
    '#rx-btn:focus-visible{outline:2px solid #fff;outline-offset:3px;}',
    '#rx-btn svg{width:24px;height:24px;fill:white}',

    '#rx-win{position:fixed;bottom:88px;right:24px;width:368px;height:556px;background:var(--rx-surface);border:1px solid var(--rx-border);border-radius:var(--rx-radius-panel);box-shadow:var(--rx-shadow);display:none;flex-direction:column;z-index:2147483645;overflow:hidden;font-family:var(--rx-font);}',

    '#rx-head{background:var(--rx-bg);border-bottom:1px solid var(--rx-border);padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '#rx-head-avatar{width:34px;height:34px;border-radius:50%;background:var(--rx-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '#rx-head-avatar svg{width:18px;height:18px;fill:white}',
    '#rx-head-info{flex:1;min-width:0}',
    '#rx-head-name{color:var(--rx-text);font-size:14px;font-weight:600;letter-spacing:.01em;}',
    '#rx-head-sub{color:var(--rx-text-muted);font-size:11px;margin-top:1px;display:flex;align-items:center;gap:5px;}',
    '#rx-status-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;flex-shrink:0;}',
    '#rx-close{background:none;border:none;color:var(--rx-text-muted);cursor:pointer;padding:4px;border-radius:var(--rx-radius-btn);display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;flex-shrink:0;}',
    '#rx-close:hover{color:var(--rx-text);background:var(--rx-surface2)}',
    '#rx-close:focus-visible{outline:2px solid var(--rx-primary);outline-offset:2px}',
    '#rx-close svg{width:16px;height:16px}',

    '#rx-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth;}',
    '#rx-msgs::-webkit-scrollbar{width:4px}',
    '#rx-msgs::-webkit-scrollbar-track{background:transparent}',
    '#rx-msgs::-webkit-scrollbar-thumb{background:var(--rx-border);border-radius:2px}',

    '.rx-row{display:flex;flex-direction:column;}',
    '.rx-row-user{align-items:flex-end}',
    '.rx-row-bot{align-items:flex-start}',
    '.rx-label{font-size:10px;color:var(--rx-text-faint);margin-bottom:3px;letter-spacing:.03em;text-transform:uppercase;padding:0 2px;}',
    '.rx-msg{max-width:84%;padding:10px 13px;border-radius:var(--rx-radius-bubble);font-size:13.5px;line-height:1.55;word-break:break-word;white-space:pre-wrap;}',
    '.rx-bot{background:var(--rx-bot-bubble);color:var(--rx-bot-text);border:1px solid var(--rx-border);border-bottom-left-radius:2px;}',
    '.rx-user{background:var(--rx-user-bubble);color:var(--rx-user-text);border:1px solid transparent;border-bottom-right-radius:2px;}',
    '.rx-ts{font-size:10px;color:var(--rx-text-faint);margin-top:3px;padding:0 2px;}',

    '.rx-cursor{display:inline-block;width:2px;height:13px;background:var(--rx-text-muted);margin-left:1px;vertical-align:middle;animation:rx-blink .7s infinite;}',
    '@keyframes rx-blink{0%,100%{opacity:1}50%{opacity:0}}',

    '.rx-chip{margin-top:6px;background:transparent;color:var(--rx-primary);border:1px solid var(--rx-primary);border-radius:var(--rx-radius-btn);padding:5px 11px;font-size:12px;font-family:var(--rx-font);cursor:pointer;display:inline-block;transition:background .15s,color .15s;letter-spacing:.01em;}',
    '.rx-chip:hover{background:var(--rx-primary);color:#fff}',
    '.rx-chip:focus-visible{outline:2px solid var(--rx-primary);outline-offset:2px}',

    '.rx-typing{display:flex;gap:4px;padding:10px 13px;background:var(--rx-bot-bubble);border:1px solid var(--rx-border);border-radius:var(--rx-radius-bubble);border-bottom-left-radius:2px;align-self:flex-start;}',
    '.rx-dot{width:6px;height:6px;border-radius:50%;background:var(--rx-text-muted);animation:rx-b .9s infinite;}',
    '.rx-dot:nth-child(2){animation-delay:.18s}',
    '.rx-dot:nth-child(3){animation-delay:.36s}',
    '@keyframes rx-b{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}',

    '#rx-foot{padding:12px;border-top:1px solid var(--rx-border);background:var(--rx-bg);display:flex;gap:8px;align-items:flex-end;flex-shrink:0;}',
    '#rx-input{flex:1;background:var(--rx-input-bg);border:1px solid var(--rx-border);border-radius:var(--rx-radius-btn);padding:9px 12px;font-size:13.5px;font-family:var(--rx-font);color:var(--rx-text);outline:none;resize:none;max-height:100px;line-height:1.45;transition:border-color .15s;}',
    '#rx-input::placeholder{color:var(--rx-text-faint)}',
    '#rx-input:focus{border-color:var(--rx-primary)}',
    '#rx-input:disabled{opacity:.5;cursor:not-allowed}',
    '#rx-send{background:var(--rx-primary);color:#fff;border:none;border-radius:var(--rx-radius-btn);padding:9px 14px;font-size:13px;font-weight:600;font-family:var(--rx-font);cursor:pointer;white-space:nowrap;letter-spacing:.02em;transition:background .15s,opacity .15s;flex-shrink:0;}',
    '#rx-send:hover:not(:disabled){background:var(--rx-primary-hover)}',
    '#rx-send:focus-visible{outline:2px solid #fff;outline-offset:2px}',
    '#rx-send:disabled{opacity:.45;cursor:not-allowed}',
    '#rx-powered{text-align:center;padding:5px 0 8px;font-size:10px;color:var(--rx-text-faint);letter-spacing:.03em;background:var(--rx-bg);border-top:1px solid var(--rx-border);flex-shrink:0;}',

    '@media(max-width:440px){#rx-win{width:calc(100vw - 16px);right:8px;bottom:80px;height:75vh}#rx-btn{bottom:16px;right:16px}}',
  ].join('');
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'rx-btn';
  btn.setAttribute('aria-label', 'Chat with Reya');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.67 1.19 5.07 3.09 6.77L4 22l4.36-1.46C9.45 20.82 10.7 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg>';

  var win = document.createElement('div');
  win.id = 'rx-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Reya AI assistant');
  win.innerHTML = [
    '<div id="rx-head">',
      '<div id="rx-head-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.67 1.19 5.07 3.09 6.77L4 22l4.36-1.46C9.45 20.82 10.7 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg></div>',
      '<div id="rx-head-info">',
        '<div id="rx-head-name">Reya</div>',
        '<div id="rx-head-sub"><span id="rx-status-dot"></span>RealX AI Assistant</div>',
      '</div>',
      '<button id="rx-close" aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>',
    '</div>',
    '<div id="rx-msgs" role="log" aria-live="polite"></div>',
    '<div id="rx-foot">',
      '<textarea id="rx-input" rows="1" placeholder="Ask about RealX, FRAX, investing..." aria-label="Message"></textarea>',
      '<button id="rx-send" aria-label="Send">Send</button>',
    '</div>',
    '<div id="rx-powered">Powered by <strong>RealX</strong></div>',
  ].join('');

  document.body.appendChild(btn);
  document.body.appendChild(win);

  var msgsEl = document.getElementById('rx-msgs');

  // ── Helpers ──────────────────────────────────────────────────────────────
  function scrollBottom() { msgsEl.scrollTop = msgsEl.scrollHeight; }

  function formatTime() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  // ── Typewriter engine ────────────────────────────────────────────────────
  // Reveals text character by character.
  // Pauses naturally at sentence boundaries for realistic rhythm.
  function typewriter(bubble, text, onDone) {
    var chars = text.split('');
    var index = 0;
    var intervalMs = 1000 / TYPEWRITER_SPEED;

    var cursor = document.createElement('span');
    cursor.className = 'rx-cursor';
    bubble.appendChild(cursor);

    function tick() {
      if (index >= chars.length) {
        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
        if (onDone) onDone();
        return;
      }

      var ch = chars[index];
      bubble.insertBefore(document.createTextNode(ch), cursor);
      index++;
      scrollBottom();

      // Natural pauses — sentence end, comma, newline
      var delay = intervalMs;
      if ((ch === '.' || ch === '!' || ch === '?') && index < chars.length) {
        var next = chars[index];
        if (next === ' ' || next === '\n') delay += 180;
      } else if (ch === ',') {
        delay += 60;
      } else if (ch === '\n') {
        delay += 100;
      }

      typewriterTimer = setTimeout(tick, delay);
    }

    tick();
  }

  // ── Add messages ─────────────────────────────────────────────────────────
  function addUserMsg(text) {
    var row = document.createElement('div');
    row.className = 'rx-row rx-row-user';
    var bubble = document.createElement('div');
    bubble.className = 'rx-msg rx-user';
    bubble.textContent = text;
    var ts = document.createElement('div');
    ts.className = 'rx-ts';
    ts.textContent = formatTime();
    row.appendChild(bubble);
    row.appendChild(ts);
    msgsEl.appendChild(row);
    scrollBottom();
  }

  function addBotMsg(text, followUp, onTypewriterDone) {
    var row = document.createElement('div');
    row.className = 'rx-row rx-row-bot';

    var label = document.createElement('div');
    label.className = 'rx-label';
    label.textContent = 'Reya';
    row.appendChild(label);

    var bubble = document.createElement('div');
    bubble.className = 'rx-msg rx-bot';
    row.appendChild(bubble);

    var ts = document.createElement('div');
    ts.className = 'rx-ts';
    row.appendChild(ts);

    msgsEl.appendChild(row);

    typewriter(bubble, text, function () {
      ts.textContent = formatTime();
      if (followUp) {
        var chip = document.createElement('button');
        chip.className = 'rx-chip';
        chip.textContent = followUp;
        chip.setAttribute('aria-label', 'Suggested: ' + followUp);
        chip.onclick = function () { send(followUp); };
        msgsEl.appendChild(chip);
        scrollBottom();
      }
      if (onTypewriterDone) onTypewriterDone();
    });
  }

  // ── Loading states ────────────────────────────────────────────────────────
  function showDots() {
    if (document.getElementById('rx-dots')) return;
    var d = document.createElement('div');
    d.className = 'rx-typing'; d.id = 'rx-dots';
    d.setAttribute('aria-label', 'Reya is typing');
    d.innerHTML = '<span class="rx-dot"></span><span class="rx-dot"></span><span class="rx-dot"></span>';
    msgsEl.appendChild(d);
    scrollBottom();
  }

  function hideDots() {
    var d = document.getElementById('rx-dots');
    if (d) d.parentNode.removeChild(d);
  }

  function setDisabled(on) {
    document.getElementById('rx-send').disabled = on;
    document.getElementById('rx-input').disabled = on;
  }

  // ── Send ─────────────────────────────────────────────────────────────────
  function send(text) {
    var inputEl = document.getElementById('rx-input');
    var msg = (text || inputEl.value || '').trim();
    if (!msg || isTyping) return;
    if (!text) { inputEl.value = ''; inputEl.style.height = 'auto'; }

    isTyping = true;
    setDisabled(true);
    addUserMsg(msg);
    showDots();

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-chatbot-api-key': API_KEY },
      body: JSON.stringify({ sessionId: sessionId, userId: userId, userMessage: msg, channel: CHANNEL, logId: logId }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      hideDots();
      if (data.logId) logId = data.logId;
      var answer = data.answer || 'Sorry, something went wrong. Please try again.';
      var followUp = data.suggestedFollowUp || null;

      addBotMsg(answer, followUp, function () {
        // Re-enable input only after typewriter finishes
        isTyping = false;
        setDisabled(false);
        var inp = document.getElementById('rx-input');
        if (inp && isOpen) inp.focus();
      });
    })
    .catch(function () {
      hideDots();
      isTyping = false;
      setDisabled(false);
      addBotMsg('Having trouble connecting right now. Please try again in a moment.', null, null);
    });
  }

  // ── Open / Close ─────────────────────────────────────────────────────────
  function open() {
    isOpen = true;
    win.style.display = 'flex';
    btn.setAttribute('aria-expanded', 'true');
    if (msgsEl.children.length === 0) {
      addBotMsg(
        "Hey! I'm Reya, your guide to fractional real estate investing on RealX. Ask me anything — how FRAX works, ownership rights, getting started, or anything about the platform.",
        'What is FRAX?',
        null
      );
    }
    setTimeout(function () {
      var inp = document.getElementById('rx-input');
      if (inp) inp.focus();
    }, 120);
  }

  function close() {
    if (typewriterTimer) { clearTimeout(typewriterTimer); typewriterTimer = null; }
    isOpen = false;
    isTyping = false;
    setDisabled(false);
    win.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  // ── Events ───────────────────────────────────────────────────────────────
  btn.addEventListener('click', function () { isOpen ? close() : open(); });
  document.getElementById('rx-close').addEventListener('click', close);
  document.addEventListener('click', function (e) {
    if (isOpen && !win.contains(e.target) && !btn.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) close();
  });

  var inp = document.getElementById('rx-input');
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  inp.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
  document.getElementById('rx-send').addEventListener('click', function () { send(); });

  // ── Public API ───────────────────────────────────────────────────────────
  window.RealXChat = { open: open, close: close, send: send };

}());