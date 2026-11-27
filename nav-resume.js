/* يحفظ مكان الطالب (التبويب/الدرس/الاختبار) ويرجّعه بعد تحديث الصفحة */
(function () {
  var KEY = 'ict_nav_v1', MAX_AGE = 12 * 3600 * 1000, restoring = false, booted = Date.now();
  function uid() {
    try {
      var u = appState.currentUser;
      if (!u || appState.isTeacherMode) return null;
      if (u.username === 'mr_walid_preview') return 'preview';
      return String(u.uid || u.username || '');
    } catch (e) { return null; }
  }
  function save() {
    if (restoring) return;
    var id = uid(); if (!id) return;
    try {
      var s = { id: id, t: Date.now(), tab: appState.activeTab, lesson: appState.selectedLessonId,
        chapter: appState.selectedChapter, open: appState.openChapters, sub: window.__ictSub || null, t2: null };
      if (typeof T2 !== 'undefined' && T2) s.t2 = { view: T2.view, lesson: T2.lesson };
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  }
  function wrap(name) {
    var f = window[name]; if (typeof f !== 'function') return;
    window[name] = function () {
      if (name === 'switchPracticeSubTab') window.__ictSub = arguments[0];
      var r = f.apply(this, arguments);
      save();
      return r;
    };
  }
  ['switchTab', 'renderLessonExplorer', 'switchPracticeSubTab', 't2Go', 'showT1Exam', 'showT1TermExam'].forEach(wrap);
  var origLogout = window.logoutUser;
  if (typeof origLogout === 'function') window.logoutUser = function () {
    try { localStorage.removeItem(KEY); localStorage.removeItem(PKEY); } catch (e) {}
    return origLogout.apply(this, arguments);
  };
  /* معاينة المعلم: حفظ التقدم المحلي واستعادته */
  var PKEY = 'ict_prevprog_v1';
  var origSaveState = window.saveState;
  if (typeof origSaveState === 'function') window.saveState = function () {
    var r = origSaveState.apply(this, arguments);
    try {
      var u = appState.currentUser;
      if (u && u.username === 'mr_walid_preview') localStorage.setItem(PKEY, JSON.stringify({
        c: appState.completedLessons, m: appState.masteredCards, p: appState.solvedPractice,
        s: appState.examScore, n: appState.examCorrectCount }));
    } catch (e) {}
    return r;
  };
  var origTeacher = window.applyTeacherSession;
  if (typeof origTeacher === 'function') window.applyTeacherSession = function () {
    var r = origTeacher.apply(this, arguments);
    if (booted && Date.now() - booted < 30000) {
      var snap = null;
      try { snap = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
      if (snap && snap.id === 'preview' && snap.tab && Date.now() - snap.t < MAX_AGE &&
          typeof window.enterStudentPreviewFromTeacher === 'function') {
        window.enterStudentPreviewFromTeacher();
      }
    }
    return r;
  };
  var origApply = window.applyStudentSession;
  if (typeof origApply === 'function') window.applyStudentSession = function (rec) {
    if (rec && rec.username === 'mr_walid_preview') {
      try {
        var pp = JSON.parse(localStorage.getItem(PKEY) || 'null');
        if (pp) rec = Object.assign({}, rec, { completedLessons: pp.c || [], masteredCards: pp.m || [], solvedPractice: pp.p || [],
          examScore: pp.s == null ? null : pp.s, examCorrectCount: pp.n == null ? null : pp.n });
        arguments[0] = rec;
      } catch (e) {}
    }
    var snap = null;
    if (Date.now() - booted < 30000) { booted = 0; try { snap = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} }
    restoring = true;
    var r;
    try { r = origApply.apply(this, arguments); } finally { restoring = false; }
    if (snap) restore(snap); else save();
    return r;
  };
  function restore(s) {
    var id = uid();
    if (!s || !id || s.id !== id || Date.now() - s.t > MAX_AGE || !s.tab) return;
    restoring = true; window.__ictRestoring = true;
    try {
      if (s.tab === 'term2') {
        if (typeof t2Unlocked === 'function' && !t2Unlocked()) return;
        window.switchTab('term2');
        if (s.t2 && s.t2.view && s.t2.view !== 'map' && typeof t2Go === 'function') {
          T2.view = s.t2.view; T2.lesson = s.t2.lesson || null;
          if (typeof renderTerm2 === 'function') renderTerm2();
        }
      } else {
        if (s.tab === 'lessons' || s.lesson) {
          if (s.chapter != null) appState.selectedChapter = s.chapter;
          if (s.lesson) appState.selectedLessonId = s.lesson;
          if (Array.isArray(s.open)) appState.openChapters = s.open.slice();
        }
        window.switchTab(s.tab);
        if (s.tab === 'lessons') {
          var m = /^t1-exam-(\w+)$/.exec(s.lesson || '');
          if (m && typeof showT1Exam === 'function') {
            if (m[1] === 'term') window.showT1TermExam(); else window.showT1Exam(parseInt(m[1], 10));
          } else renderLessonExplorer();
        }
        if (s.tab === 'practice' && s.sub) switchPracticeSubTab(s.sub);
      }
      window.scrollTo(0, 0);
    } catch (e) {}
    window.__ictRestoring = false;
    restoring = false;
    save();
  }
})();

/* تباين ألوان النص الثانوي (وضع فاتح وداكن) */
(function () {
  var css = [
    'html:not(.dark) .text-slate-400{color:#475569 !important}',
    'html:not(.dark) .text-slate-500{color:#334155 !important}',
    'html:not(.dark) .text-slate-600{color:#1e293b !important}',
    'html:not(.dark) .text-slate-700{color:#0f172a !important}',
    'html:not(.dark) .text-slate-800{color:#0f172a !important}',
    'html:not(.dark) .text-blue-700{color:#1e3a8a !important}',
    'html.dark .text-slate-500,html.dark .dark\\:text-slate-400{color:#cbd5e1 !important}',
    'html.dark .dark\\:text-slate-300{color:#e2e8f0 !important}',
    'html.dark .dark\\:text-slate-200{color:#f1f5f9 !important}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'ict-contrast'; st.textContent = css;
  document.head.appendChild(st);
})();

/* مزامنة إجابات الدروس وحالة الاختبارات وتقدم المعاينة مع حساب الطالب في السحابة (Firestore) */
(function () {
  var AP = 'ict_assess_v1_', EP = 'ict_exam_v1_', GP = 'ict_gq_v1_', PKEY = 'ict_prevprog_v1';
  var TEACHER = 'teacher@ict-walid.app', PREV_ID = 'teacher_preview';
  var rawSet = Storage.prototype.setItem, timer = null, applying = false, failed = 0;
  function cs() { var c = window.cloudStore; return (c && c.ready && c.db && c.auth && c.auth.currentUser) ? c : null; }
  function isPrev(u) { return !!(u && u.username === 'mr_walid_preview'); }
  function keys(u) {
    if (!u) return null;
    if (isPrev(u)) return { doc: PREV_ID, a: 'mr_walid_preview', e: 'preview', prev: true };
    var k = u.uid || u.username; if (!k || !u.uid) return null;
    return { doc: String(u.uid), a: k, e: String(k), prev: false };
  }
  function J(k) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return (v && typeof v === 'object') ? v : null; } catch (e) { return null; } }
  function put(k, v) { applying = true; try { rawSet.call(localStorage, k, JSON.stringify(v)); } catch (e) {} applying = false; }
  function collect(k) {
    return { assess: J(AP + k.a) || {}, exams: J(EP + k.e) || {}, gq: J(GP + k.a) || {}, prog: k.prev ? (J(PKEY) || null) : null, t: Date.now() };
  }
  function seed(k, cx) {
    if (!cx || typeof cx !== 'object') return;
    if (cx.gq) put(GP + k.a, Object.assign({}, cx.gq, J(GP + k.a) || {}));
    if (cx.assess) put(AP + k.a, Object.assign({}, cx.assess, J(AP + k.a) || {}));
    if (cx.exams) {
      var le = J(EP + k.e) || {}, m = Object.assign({}, le);
      Object.keys(cx.exams).forEach(function (u) {
        var c = cx.exams[u], l = le[u];
        if (!l || ((c && c.t) || 0) > (l.t || 0)) m[u] = c;
      });
      put(EP + k.e, m);
    }
  }
  function push() {
    timer = null;
    var u = (typeof appState !== 'undefined') ? appState.currentUser : null, k = keys(u), c = cs();
    if (!k || !c) return;
    if (k.prev ? String(c.auth.currentUser.email || '').toLowerCase() !== TEACHER : c.auth.currentUser.uid !== k.doc) return;
    var cx = collect(k);
    try { appState.currentUser.cx = cx; } catch (e) {}
    var data = k.prev ? { username: 'mr_walid_preview', uid: PREV_ID, fullName: 'teacher preview', cx: cx, updatedAt: Date.now() } : { cx: cx };
    try {
      var ref = c.doc(c.db, 'artifacts', c.appId, 'public', 'data', 'students', k.doc);
      c.setDoc(ref, data, { merge: true }).then(function () { failed = 0; window.__ictSyncOk = Date.now(); })
        .catch(function (e) { failed++; window.__ictSyncErr = String(e && e.code || e); console.warn('ict sync failed', e && e.code); if (failed < 4) timer = setTimeout(push, 8000 * failed); });
    } catch (e) {}
  }
  function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(push, 1200); }
  Storage.prototype.setItem = function (key) {
    var r = rawSet.apply(this, arguments);
    if (!applying && this === window.localStorage && typeof key === 'string' &&
        (key.indexOf(AP) === 0 || key.indexOf(EP) === 0 || key.indexOf(GP) === 0 || key === PKEY)) schedule();
    return r;
  };
  window.addEventListener('pagehide', function () { if (timer) { clearTimeout(timer); push(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden && timer) { clearTimeout(timer); push(); } });

  var orig = window.applyStudentSession;
  if (typeof orig === 'function') window.applyStudentSession = function (rec) {
    var k = keys(rec);
    if (k && !k.prev) seed(k, rec.cx);
    var r = orig.apply(this, arguments);
    if (k && !k.prev && !rec.cx) schedule();
    if (k && k.prev) previewCloud(k);
    return r;
  };
  window.__ictPreviewCloud = function () { try { var u = appState.currentUser; if (isPrev(u)) previewCloud(keys(u)); } catch (e) {} };
  function previewCloud(k) {
    var c = cs(); if (!c) return;
    var pr; try { pr = c.getDoc(c.doc(c.db, 'artifacts', c.appId, 'public', 'data', 'students', PREV_ID)); } catch (e) { return; }
    pr.then(function (snap) {
      if (!snap.exists() || !isPrev(appState.currentUser)) return;
      var cx = snap.data().cx; if (!cx) return;
      seed(k, cx);
      var a = Object.assign({}, cx.assess || {}, appState.solvedAssess || {});
      appState.solvedAssess = a; put(AP + k.a, a);
      var p = cx.prog;
      if (p) {
        var un = function (x, y) { return Array.from(new Set([].concat(x || [], y || []))); };
        appState.completedLessons = un(p.c, appState.completedLessons);
        appState.masteredCards = un(p.m, appState.masteredCards);
        appState.solvedPractice = un(p.p, appState.solvedPractice);
        put(PKEY, { c: appState.completedLessons, m: appState.masteredCards, p: appState.solvedPractice, s: appState.examScore, n: appState.examCorrectCount });
        try { updateProgressUI(); } catch (e) {}
      }
      try { if (appState.activeTab === 'lessons' && !window.__ictRestoring) renderLessonExplorer(); } catch (e) {}
      try { if (typeof filterGradedLevel === 'function') filterGradedLevel(appState.gradedLevel || 1); } catch (e) {}
    }).catch(function () {});
  }
})();

/* خريطة المنهج على الموبايل فقط: الفصول مطوية، والضغط على الفصل يفتح دروسه */
(function () {
  var st = document.createElement('style');
  st.textContent = [
    '.ict-chev{display:none}',
    '@media (max-width:767px){',
    '#curriculum-grid>div{padding:1rem 1.1rem !important;gap:.6rem}',
    '#curriculum-grid .ict-acc-head{cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '#curriculum-grid .ict-chev{display:inline-block;transition:transform .2s;font-weight:800;color:#1d4ed8}',
    'html.dark #curriculum-grid .ict-chev{color:#93c5fd}',
    '#curriculum-grid .ict-open .ict-chev{transform:rotate(180deg)}',
    '#curriculum-grid .ict-closed .ict-acc-list,#curriculum-grid .ict-closed .ict-acc-sum{display:none}',
    '#curriculum-grid .ict-closed{gap:0}',
    '}'
  ].join('\n');
  document.head.appendChild(st);
  var open = {};
  function enhance() {
    var grid = document.getElementById('curriculum-grid'); if (!grid) return;
    Array.prototype.forEach.call(grid.children, function (card, i) {
      var head = card.children[0], list = card.children[1]; if (!head || !list) return;
      head.classList.add('ict-acc-head'); list.classList.add('ict-acc-list');
      var sum = head.querySelector('p'); if (sum) sum.classList.add('ict-acc-sum');
      var row = head.querySelector('h4'); 
      if (row && !row.querySelector('.ict-chev')) {
        var c = document.createElement('span'); c.className = 'ict-chev'; c.textContent = ' ⌄'; c.setAttribute('aria-hidden', 'true'); row.appendChild(c);
      }
      head.setAttribute('role', 'button'); head.setAttribute('tabindex', '0');
      function set(o) { open[i] = o; card.classList.toggle('ict-open', o); card.classList.toggle('ict-closed', !o); head.setAttribute('aria-expanded', o ? 'true' : 'false'); }
      set(!!open[i]);
      head.onclick = function () { set(!open[i]); };
      head.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!open[i]); } };
    });
  }
  var orig = window.renderCurriculumGrid;
  if (typeof orig === 'function') window.renderCurriculumGrid = function () { var r = orig.apply(this, arguments); enhance(); return r; };
  enhance();
})();


/* حفظ إجابات الأسئلة المتدرجة واستعادتها بعد التحديث (محليًا وفي حساب الطالب) */
(function () {
  var GP = 'ict_gq_v1_', restoring = false;
  function key() {
    try {
      var u = appState.currentUser; if (!u) return null;
      if (u.username === 'mr_walid_preview') return GP + 'mr_walid_preview';
      return GP + String(u.uid || u.username || '');
    } catch (e) { return null; }
  }
  function load() { var k = key(); if (!k) return {}; try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  var oa = window.answerGradedQuestion;
  if (typeof oa === 'function') window.answerGradedQuestion = function (id, idx) {
    var r = oa.apply(this, arguments);
    if (!restoring) { var k = key(); if (k) { var m = load(); if (m[id] === undefined) { m[id] = idx; try { localStorage.setItem(k, JSON.stringify(m)); } catch (e) {} } } }
    return r;
  };
  var of = window.filterGradedLevel;
  if (typeof of === 'function') window.filterGradedLevel = function () {
    var r = of.apply(this, arguments);
    var m = load(); restoring = true;
    try { Object.keys(m).forEach(function (id) { if (document.getElementById('gq-fb-' + id)) { try { oa(id, m[id]); } catch (e) {} } }); } finally { restoring = false; }
    return r;
  };
})();

/* لا تُظهر شاشة تسجيل الدخول أثناء استعادة جلسة محفوظة بعد التحديث */
(function () {
  var H = 'ict_sess_hint';
  var hint = false; try { hint = localStorage.getItem(H) === '1'; } catch (e) {}
  var root = document.documentElement, t0 = Date.now();
  function done() { root.classList.remove('ict-boot'); }
  if (hint) {
    var st = document.createElement('style');
    st.textContent = 'html.ict-boot #auth-portal-section{display:none !important}html.ict-boot body:after{content:"\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...";display:block;text-align:center;padding:4rem 1rem;font-weight:800;color:#64748b}';
    document.head.appendChild(st);
    root.classList.add('ict-boot');
    var iv = setInterval(function () {
      var ready = false;
      try {
        if (appState.currentUser) ready = true;
        else if (appState.isTeacherMode) {
          var sn = null; try { sn = JSON.parse(localStorage.getItem('ict_nav_v1') || 'null'); } catch (e) {}
          ready = !(sn && sn.id === 'preview' && Date.now() - sn.t < 12 * 3600 * 1000) || Date.now() - t0 > 4000;
        } else {
          var c = window.cloudStore;
          if (c && c.ready && c.auth && c.auth.currentUser === null && c._ictAuthReady) ready = true;
          if (c && c.mode === 'local' && Date.now() - t0 > 500) ready = true;
        }
      } catch (e) {}
      if (ready || Date.now() - t0 > 15000) { clearInterval(iv); done(); }
    }, 60);
    var wait = setInterval(function () {
      var c = window.cloudStore;
      if (c && c.ready && c.auth) { clearInterval(wait); try { c.auth.authStateReady().then(function () { c._ictAuthReady = true; }); } catch (e) { c._ictAuthReady = true; } }
    }, 50);
  }
  function mark(name) {
    var f = window[name]; if (typeof f !== 'function') return;
    window[name] = function (rec) { var r = f.apply(this, arguments); try { localStorage.setItem(H, '1');
      if (name === 'applyStudentSession' && rec) { if (rec.username === 'mr_walid_preview') { localStorage.setItem('ict_sess_kind', 'preview'); } else if (rec.uid) { localStorage.setItem('ict_sess_kind', 'student:' + rec.uid); } }
      else if (name === 'applyTeacherSession' && !appState.currentUser) localStorage.setItem('ict_sess_kind', 'teacher'); } catch (e) {} return r; };
  }
  mark('applyStudentSession'); mark('applyTeacherSession');
  var lo = window.logoutUser;
  if (typeof lo === 'function') window.logoutUser = function () { try { localStorage.removeItem(H); } catch (e) {} return lo.apply(this, arguments); };
})();


/* استعادة فورية للجلسة من الجهاز بدون انتظار Firebase، ثم التحقق منها في الخلفية */
(function () {
  var kind = null; try { kind = localStorage.getItem('ict_sess_kind'); } catch (e) {}
  if (!kind || kind === 'teacher' || localStorage.getItem('ict_sess_hint') !== '1') return;
  var optimistic = false;
  document.addEventListener('DOMContentLoaded', function () {
    try {
      if (appState.currentUser || appState.isTeacherMode) return;
      if (kind === 'preview') { enterStudentPreviewFromTeacher(); optimistic = true; }
      else if (kind.indexOf('student:') === 0) {
        var rec = studentsRegistry[kind.slice(8)];
        if (rec && rec.uid) { applyStudentSession(rec); optimistic = true; }
      }
    } catch (e) { optimistic = false; }
    if (!optimistic) return;
    var t0 = Date.now();
    var iv = setInterval(function () {
      var c = window.cloudStore;
      if (!(c && c.ready && c.auth && c._ictAuthReady) && Date.now() - t0 < 20000) return;
      clearInterval(iv);
      try {
        var cu = c && c.auth && c.auth.currentUser;
        if (!cu) { if (c && c.ready && c._ictAuthReady) { logoutUser(); } return; }
        if (kind === 'preview') { if (String(cu.email || '').toLowerCase() === 'teacher@ict-walid.app') window.__ictPreviewCloud(); else logoutUser(); }
        else if (cu.uid !== kind.slice(8)) logoutUser();
        else startTermListener();
      } catch (e) {}
    }, 100);
  });
})();
