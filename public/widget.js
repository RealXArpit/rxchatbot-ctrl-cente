(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────
  var config      = window.RealXChatConfig || {};
  var WEBHOOK_URL = 'https://n8n-production-5c06.up.railway.app/webhook/realx-ai';
  var API_KEY     = 'rx-chat-sk-2026-M9aG'; // replace with your VITE_API_KEY_PROD
  var CHANNEL     = 'WEBSITE';

  // Anonymous session persistence — survives page navigation within
  // the same browser tab. Cleared when the tab is closed.
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

  // ── State ────────────────────────────────────────────────────────
  var isOpen   = false;
  var isTyping = false;
  var logId    = null;

  // ── Styles ───────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#rx-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#1A237E;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:9999;transition:transform .2s}',
    '#rx-btn:hover{transform:scale(1.08)}',
    '#rx-btn svg{width:26px;height:26px;fill:white}',
    '#rx-win{position:fixed;bottom:90px;right:24px;width:370px;height:560px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:none;flex-direction:column;z-index:9998;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#rx-head{background:#1A237E;padding:14px 16px;display:flex;align-items:center;gap:10px}',
    '#rx-head-name{color:#fff;font-size:15px;font-weight:600}',
    '#rx-head-sub{color:rgba(255,255,255,.7);font-size:12px}',
    '#rx-close{margin-left:auto;background:none;border:none;color:#fff;cursor:pointer;font-size:22px;line-height:1;padding:0 2px}',
    '#rx-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}',
    '.rx-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;word-break:break-word;white-space:pre-wrap}',
    '.rx-bot{background:#F3F4F6;color:#111;align-self:flex-start;border-bottom-left-radius:4px}',
    '.rx-user{background:#1A237E;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '.rx-typing{display:flex;gap:4px;padding:10px 14px;background:#F3F4F6;border-radius:14px;align-self:flex-start;border-bottom-left-radius:4px}',
    '.rx-dot{width:7px;height:7px;border-radius:50%;background:#9CA3AF;animation:rx-b .9s infinite}',
    '.rx-dot:nth-child(2){animation-delay:.15s}',
    '.rx-dot:nth-child(3){animation-delay:.3s}',
    '@keyframes rx-b{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',
    '.rx-chip{margin-top:4px;background:#EEF2FF;color:#1A237E;border:1px solid #C7D2FE;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;display:inline-block;font-family:inherit}',
    '.rx-chip:hover{background:#E0E7FF}',
    '#rx-foot{padding:12px;border-top:1px solid #E5E7EB;display:flex;gap:8px}',
    '#rx-input{flex:1;border:1px solid #D1D5DB;border-radius:10px;padding:9px 12px;font-size:14px;outline:none;resize:none;font-family:inherit;max-height:100px;line-height:1.4}',
    '#rx-input:focus{border-color:#1A237E}',
    '#rx-send{background:#1A237E;color:#fff;border:none;border-radius:10px;padding:9px 16px;cursor:pointer;font-size:14px;font-weight:600}',
    '#rx-send:disabled{opacity:.5;cursor:not-allowed}',
    '@media(max-width:420px){#rx-win{width:calc(100vw - 16px);right:8px;bottom:80px}}',
  ].join('');
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'rx-btn';
  btn.setAttribute('aria-label', 'Chat with Reya');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.67 1.19 5.07 3.09 6.77L4 22l4.36-1.46C9.45 20.82 10.7 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg>';

  var win = document.createElement('div');
  win.id = 'rx-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Reya chat assistant');
  win.innerHTML = [
    '<div id="rx-head">',
      '<div><div id="rx-head-name">Reya</div><div id="rx-head-sub">RealX AI Assistant · Typically replies instantly</div></div>',
      '<button id="rx-close" aria-label="Close">&times;</button>',
    '</div>',
    '<div id="rx-msgs"></div>',
    '<div id="rx-foot">',
      '<textarea id="rx-input" rows="1" placeholder="Ask about RealX, FRAX, investing..."></textarea>',
      '<button id="rx-send">Send</button>',
    '</div>',
  ].join('');

  document.body.appendChild(btn);
  document.body.appendChild(win);

  // ── Helpers ──────────────────────────────────────────────────────
  var msgsEl = document.getElementById('rx-msgs');

  function scrollBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addMsg(role, text, followUp) {
    var d = document.createElement('div');
    d.className = 'rx-msg ' + (role === 'user' ? 'rx-user' : 'rx-bot');
    d.textContent = text;
    msgsEl.appendChild(d);
    if (followUp && role === 'bot') {
      var chip = document.createElement('button');
      chip.className = 'rx-chip';
      chip.textContent = followUp;
      chip.onclick = function () { send(followUp); };
      msgsEl.appendChild(chip);
    }
    scrollBottom();
  }

  function setLoading(on) {
    isTyping = on;
    document.getElementById('rx-send').disabled = on;
    document.getElementById('rx-input').disabled = on;
    var t = document.getElementById('rx-typing');
    if (on && !t) {
      var d = document.createElement('div');
      d.className = 'rx-typing'; d.id = 'rx-typing';
      d.innerHTML = '<span class="rx-dot"></span><span class="rx-dot"></span><span class="rx-dot"></span>';
      msgsEl.appendChild(d);
      scrollBottom();
    } else if (!on && t) {
      t.parentNode.removeChild(t);
    }
  }

  // ── Send ─────────────────────────────────────────────────────────
  function send(text) {
    var inputEl = document.getElementById('rx-input');
    var msg = (text || inputEl.value || '').trim();
    if (!msg || isTyping) return;
    if (!text) inputEl.value = '';
    inputEl.style.height = 'auto';
    addMsg('user', msg);
    setLoading(true);

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chatbot-api-key': API_KEY,
      },
      body: JSON.stringify({
        sessionId:   sessionId,
        userId:      userId,
        userMessage: msg,
        channel:     CHANNEL,
        logId:       logId,
      }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      setLoading(false);
      if (data.logId) logId = data.logId;
      addMsg('bot', data.answer || 'Something went wrong. Please try again.', data.suggestedFollowUp || null);
    })
    .catch(function () {
      setLoading(false);
      addMsg('bot', 'Having trouble connecting. Please try again in a moment.');
    });
  }

  // ── Open / Close ─────────────────────────────────────────────────
  function open() {
    isOpen = true;
    win.style.display = 'flex';
    if (msgsEl.children.length === 0) {
      addMsg('bot', "Hey! I'm Reya, your guide to fractional real estate investing on RealX. Ask me anything — how FRAX works, ownership rights, getting started, or anything about the platform.", 'What is FRAX?');
    }
    setTimeout(function () { document.getElementById('rx-input').focus(); }, 100);
  }

  function close() {
    isOpen = false;
    win.style.display = 'none';
  }

  // ── Events ───────────────────────────────────────────────────────
  btn.addEventListener('click', function () { isOpen ? close() : open(); });
  document.getElementById('rx-close').addEventListener('click', close);
  document.addEventListener('click', function (e) {
    if (isOpen && !win.contains(e.target) && !btn.contains(e.target)) close();
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

  // ── Public API ───────────────────────────────────────────────────
  window.RealXChat = { open: open, close: close, send: send };

}());