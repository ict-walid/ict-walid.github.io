/* يحفظ مكان الطالب (التبويب/الدرس/الاختبار) ويرجّعه بعد تحديث الصفحة */
(function () {
  var KEY = 'ict_nav_v1', MAX_AGE = 12 * 3600 * 1000, restoring = false, booted = Date.now();
  function uid() {
    try {
      var u = appState.currentUser;
      if (!u || appState.isTeacherMode || u.username === 'mr_walid_preview') return null;
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
    try { localStorage.removeItem(KEY); } catch (e) {}
    return origLogout.apply(this, arguments);
  };
  var origApply = window.applyStudentSession;
  if (typeof origApply === 'function') window.applyStudentSession = function () {
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
    restoring = true;
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
